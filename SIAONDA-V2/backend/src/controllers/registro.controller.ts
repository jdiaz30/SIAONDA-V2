import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generarCertificadoRegistro, generarCertificadoProduccion } from '../services/certificadoRegistro.service';
import { generarCertificadoOficial } from '../services/certificadoRegistroOficial.service';
import { registrarCambioEstado } from '../utils/formularioHistorial';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configuración de multer para subir certificados firmados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'certificados-firmados');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cert-firmado-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadCertificado = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// ============================================
// DASHBOARD - Estadísticas y resumen
// ============================================
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Contar por estado
  const estadisticas = await prisma.registro.groupBy({
    by: ['estadoId'],
    _count: true
  });

  // Obtener nombres de estados
  const estados = await prisma.registroEstado.findMany();

  const estadisticasConNombre = estadisticas.map(stat => {
    const estado = estados.find(e => e.id === stat.estadoId);
    return {
      estado: estado?.nombre || 'Desconocido',
      cantidad: stat._count
    };
  });

  // Registros recientes
  const registrosRecientes = await prisma.registro.findMany({
    take: 10,
    orderBy: { fechaAsentamiento: 'desc' },
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true
        }
      },
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Total de registros del año actual
  const anioActual = new Date().getFullYear();
  const totalAnioActual = await prisma.registro.count({
    where: {
      fechaAsentamiento: {
        gte: new Date(`${anioActual}-01-01`),
        lte: new Date(`${anioActual}-12-31`)
      }
    }
  });

  res.json({
    success: true,
    data: {
      estadisticas: estadisticasConNombre,
      registrosRecientes,
      totalAnioActual,
      anioActual
    }
  });
});

// ============================================
// OBRAS PENDIENTES DE ASENTAMIENTO
// ============================================
export const getObrasPendientes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Obtener estado PENDIENTE_ASENTAMIENTO
  const estadoPendiente = await prisma.registroEstado.findFirst({
    where: { nombre: 'PENDIENTE_ASENTAMIENTO' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado PENDIENTE_ASENTAMIENTO no encontrado', 500);
  }

  // Obtener obras pendientes
  const obrasPendientes = await prisma.registro.findMany({
    where: {
      estadoId: estadoPendiente.id
    },
    include: {
      estado: true,
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: {
                    include: {
                      archivos: true
                    }
                  }
                }
              },
              archivos: true,
              produccionPadre: {
                include: {
                  productos: {
                    include: {
                      producto: true
                    }
                  }
                }
              }
            }
          },
          campos: {
            include: {
              campo: true
            }
          },
          archivos: true
        }
      }
    },
    orderBy: { creadoEn: 'asc' }
  });

  // Agrupar obras que pertenecen a una producción
  const producciones = new Map();
  const obrasIndependientes = [];

  for (const obra of obrasPendientes) {
    const formulario = obra.formularioProducto.formulario;

    // Si la obra pertenece a una producción (tiene produccionPadreId)
    if (formulario.produccionPadreId) {
      const padreId = formulario.produccionPadreId;

      if (!producciones.has(padreId)) {
        producciones.set(padreId, {
          id: padreId,
          esProduccion: true,
          tituloProduccion: formulario.produccionPadre?.tituloProduccion || 'Producción',
          tipoProducto: formulario.produccionPadre?.productos[0]?.producto.nombre || 'N/A',
          clientes: formulario.clientes, // Los clientes son los mismos para todas las obras
          obras: []
        });
      }

      producciones.get(padreId).obras.push(obra);
    } else {
      // Obra independiente (no es parte de una producción)
      obrasIndependientes.push(obra);
    }
  }

  // Convertir Map a array y combinar con obras independientes
  const obrasAgrupadas = [
    ...Array.from(producciones.values()),
    ...obrasIndependientes
  ];

  res.json({
    success: true,
    data: {
      obras: obrasAgrupadas,
      total: obrasAgrupadas.length,
      totalRegistrosIndividuales: obrasPendientes.length
    }
  });
});

// ============================================
// ASENTAR OBRA
// ============================================
export const asentarObra = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { registroId, observaciones, libroNumero, hojaNumero } = req.body;

  if (!registroId) {
    throw new AppError('Se requiere el ID del registro', 400);
  }

  if (!libroNumero || !hojaNumero) {
    throw new AppError('Se requieren los números de libro y hoja', 400);
  }

  // Verificar que el registro existe y está en estado válido
  const registroActual = await prisma.registro.findUnique({
    where: { id: registroId },
    include: { estado: true }
  });

  if (!registroActual) {
    throw new AppError('Registro no encontrado', 404);
  }

  // Solo se puede asentar si está en estado PENDIENTE_ASENTAMIENTO
  if (registroActual.estado.nombre !== 'PENDIENTE_ASENTAMIENTO') {
    throw new AppError(
      `No se puede asentar este registro. Estado actual: ${registroActual.estado.nombre}`,
      400
    );
  }

  // Obtener estado ASENTADO
  const estadoAsentado = await prisma.registroEstado.findFirst({
    where: { nombre: 'ASENTADO' }
  });

  if (!estadoAsentado) {
    throw new AppError('Estado ASENTADO no encontrado', 500);
  }

  // Actualizar registro con validación de estado previo
  const registroActualizado = await prisma.registro.update({
    where: {
      id: registroId,
      estadoId: registroActual.estadoId // Validar que el estado no cambió
    },
    data: {
      estadoId: estadoAsentado.id,
      usuarioAsentamientoId: req.usuario.id,
      fechaAsentamiento: new Date(),
      observaciones,
      libroNumero: parseInt(libroNumero),
      hojaNumero: parseInt(hojaNumero)
    },
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true
        }
      },
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: registroActualizado,
    message: 'Obra asentada exitosamente'
  });
});

// ============================================
// ASENTAR PRODUCCIÓN COMPLETA
// ============================================
export const asentarProduccion = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { produccionPadreId, obras, observaciones } = req.body;

  // obras es un array con: [{ registroId, libroNumero, hojaNumero, tituloObra }]

  if (!produccionPadreId || !obras || !Array.isArray(obras) || obras.length === 0) {
    throw new AppError('Datos incompletos para asentar producción', 400);
  }

  // Obtener estado ASENTADO
  const estadoAsentado = await prisma.registroEstado.findFirst({
    where: { nombre: 'ASENTADO' }
  });

  if (!estadoAsentado) {
    throw new AppError('Estado ASENTADO no encontrado', 500);
  }

  // Asentar cada obra de la producción
  const registrosAsentados = [];

  for (const obra of obras) {
    const { registroId, libroNumero, hojaNumero } = obra;

    if (!registroId || !libroNumero || !hojaNumero) {
      throw new AppError(`Datos incompletos para obra con registroId ${registroId}`, 400);
    }

    // Verificar que el registro existe y está pendiente
    const registroActual = await prisma.registro.findUnique({
      where: { id: registroId },
      include: { estado: true }
    });

    if (!registroActual) {
      throw new AppError(`Registro ${registroId} no encontrado`, 404);
    }

    if (registroActual.estado.nombre !== 'PENDIENTE_ASENTAMIENTO') {
      throw new AppError(`Registro ${registroId} no está pendiente de asentamiento`, 400);
    }

    // Asentar el registro
    const registroActualizado = await prisma.registro.update({
      where: {
        id: registroId,
        estadoId: registroActual.estadoId
      },
      data: {
        estadoId: estadoAsentado.id,
        usuarioAsentamientoId: req.usuario.id,
        fechaAsentamiento: new Date(),
        observaciones,
        libroNumero: parseInt(libroNumero),
        hojaNumero: parseInt(hojaNumero)
      }
    });

    registrosAsentados.push(registroActualizado);
  }

  res.json({
    success: true,
    data: {
      produccionPadreId,
      registrosAsentados,
      totalObras: registrosAsentados.length
    },
    message: `Producción asentada exitosamente con ${registrosAsentados.length} obras`
  });
});

// ============================================
// DEVOLVER OBRA A AAU
// ============================================
export const devolverAAAU = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { registroId, comentario } = req.body;

  if (!registroId) {
    throw new AppError('Se requiere el ID del registro', 400);
  }

  if (!comentario || comentario.trim() === '') {
    throw new AppError('Se requiere un comentario explicando el motivo de la devolución', 400);
  }

  // Obtener el registro con sus datos completos
  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    include: {
      formularioProducto: {
        include: {
          formulario: true
        }
      }
    }
  });

  if (!registro) {
    throw new AppError('Registro no encontrado', 404);
  }

  // Obtener estado DEVUELTO para el formulario
  const estadoDevueltoFormulario = await prisma.formularioEstado.findFirst({
    where: { nombre: 'DEVUELTO' }
  });

  if (!estadoDevueltoFormulario) {
    throw new AppError('Estado DEVUELTO no encontrado', 500);
  }

  // Obtener estado DEVUELTO_AAU para el registro
  const estadoDevueltoRegistro = await prisma.registroEstado.findFirst({
    where: { nombre: 'DEVUELTO_AAU' }
  });

  if (!estadoDevueltoRegistro) {
    throw new AppError('Estado DEVUELTO_AAU no encontrado', 500);
  }

  // Actualizar el registro
  const registroActualizado = await prisma.registro.update({
    where: { id: registroId },
    data: {
      estadoId: estadoDevueltoRegistro.id,
      observaciones: comentario
    },
    include: {
      estado: true,
      formularioProducto: {
        include: {
          producto: true,
          formulario: true
        }
      }
    }
  });

  // Actualizar el formulario asociado con el comentario y fecha de devolución
  const formulario = registro.formularioProducto.formulario;
  const estadoAnteriorId = formulario.estadoId;

  await prisma.formulario.update({
    where: { id: formulario.id },
    data: {
      estadoId: estadoDevueltoFormulario.id,
      mensajeDevolucion: comentario,
      fechaDevolucion: new Date()
    }
  });

  // Registrar en el historial del formulario
  await registrarCambioEstado(
    formulario.id,
    estadoAnteriorId,
    estadoDevueltoFormulario.id,
    req.usuario.id,
    'DEVUELTO',
    comentario
  );

  res.json({
    success: true,
    data: registroActualizado,
    message: 'Obra devuelta a AAU para corrección'
  });
});

// ============================================
// GENERAR NÚMERO DE REGISTRO
// ============================================
async function generarNumeroRegistro(): Promise<string> {
  const anioActual = new Date().getFullYear();
  const mesActual = (new Date().getMonth() + 1).toString().padStart(2, '0');

  // Buscar o crear secuencia para el año actual
  const secuencia = await prisma.secuenciaRegistro.upsert({
    where: { anio: anioActual },
    update: {
      secuencia: {
        increment: 1
      }
    },
    create: {
      anio: anioActual,
      secuencia: 1
    }
  });

  // Formato: 00000001/12/2025
  const numeroSecuencial = secuencia.secuencia.toString().padStart(8, '0');
  return `${numeroSecuencial}/${mesActual}/${anioActual}`;
}

// ============================================
// CREAR REGISTROS DESDE FORMULARIO PAGADO
// ============================================
export const crearRegistrosDesdeFormulario = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { formularioId } = req.body;

  if (!formularioId) {
    throw new AppError('Se requiere el ID del formulario', 400);
  }

  // Verificar que el formulario existe y está pagado
  const formulario = await prisma.formulario.findUnique({
    where: { id: formularioId },
    include: {
      productos: {
        include: {
          producto: true,
          campos: {
            include: {
              campo: true
            }
          }
        }
      },
      factura: {
        include: {
          estado: true
        }
      }
    }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  // Verificar que tiene factura pagada
  if (!formulario.factura || formulario.factura.estado.nombre !== 'Pagada') {
    throw new AppError('El formulario debe tener una factura pagada', 400);
  }

  // Obtener estado PENDIENTE_ASENTAMIENTO
  const estadoPendiente = await prisma.registroEstado.findFirst({
    where: { nombre: 'PENDIENTE_ASENTAMIENTO' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado PENDIENTE_ASENTAMIENTO no encontrado', 500);
  }

  // Crear un registro por cada producto (obra) en el formulario
  const registrosCreados = [];

  for (const producto of formulario.productos) {
    // Buscar campo "titulo" o "nombre_obra" para el título
    const campoTitulo = producto.campos.find(c =>
      c.campo.nombre.toLowerCase().includes('titulo') ||
      c.campo.nombre.toLowerCase().includes('nombre')
    );

    const tituloObra = campoTitulo?.valor || 'Sin título';
    const numeroRegistro = await generarNumeroRegistro();

    const registro = await prisma.registro.create({
      data: {
        numeroRegistro,
        formularioProductoId: producto.id,
        fechaAsentamiento: new Date(),
        tipoObra: producto.producto.nombre,
        tituloObra,
        estadoId: estadoPendiente.id,
        usuarioAsentamientoId: req.usuario.id
      },
      include: {
        estado: true,
        usuarioAsentamiento: {
          select: {
            nombrecompleto: true
          }
        },
        formularioProducto: {
          include: {
            producto: true
          }
        }
      }
    });

    registrosCreados.push(registro);
  }

  res.json({
    success: true,
    data: {
      registros: registrosCreados,
      total: registrosCreados.length
    },
    message: `${registrosCreados.length} obra(s) registrada(s) exitosamente`
  });
});

// ============================================
// LISTAR REGISTROS CON FILTROS
// ============================================
export const getRegistros = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const {
    estadoId,
    tipoObra,
    fechaDesde,
    fechaHasta,
    busqueda,
    page = 1,
    limit = 50
  } = req.query;

  const where: any = {};

  if (estadoId) {
    where.estadoId = parseInt(estadoId as string);
  }

  if (tipoObra) {
    where.tipoObra = tipoObra;
  }

  if (fechaDesde || fechaHasta) {
    where.fechaAsentamiento = {};
    if (fechaDesde) {
      where.fechaAsentamiento.gte = new Date(fechaDesde as string);
    }
    if (fechaHasta) {
      where.fechaAsentamiento.lte = new Date(fechaHasta as string);
    }
  }

  if (busqueda) {
    where.OR = [
      { numeroRegistro: { contains: busqueda as string, mode: 'insensitive' } },
      { tituloObra: { contains: busqueda as string, mode: 'insensitive' } }
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [registros, total] = await Promise.all([
    prisma.registro.findMany({
      where,
      skip,
      take,
      include: {
        estado: true,
        usuarioAsentamiento: {
          select: {
            nombrecompleto: true
          }
        },
        formularioProducto: {
          include: {
            producto: true,
            formulario: {
              include: {
                clientes: {
                  include: {
                    cliente: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fechaAsentamiento: 'desc' }
    }),
    prisma.registro.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      registros,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// ============================================
// DETALLE DE REGISTRO
// ============================================
export const getRegistroDetalle = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { id } = req.params;

  const registro = await prisma.registro.findUnique({
    where: { id: parseInt(id) },
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true,
          correo: true
        }
      },
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              },
              factura: {
                include: {
                  estado: true
                }
              }
            }
          },
          campos: {
            include: {
              campo: true
            }
          }
        }
      }
    }
  });

  if (!registro) {
    throw new AppError('Registro no encontrado', 404);
  }

  res.json({
    success: true,
    data: registro
  });
});

// ============================================
// ACTUALIZAR ESTADO DE REGISTRO
// ============================================
export const actualizarEstadoRegistro = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { id } = req.params;
  const { estadoId, observaciones } = req.body;

  if (!estadoId) {
    throw new AppError('Se requiere el ID del estado', 400);
  }

  // Construir objeto de actualización
  const dataToUpdate: any = {
    estadoId,
    observaciones
  };

  // Actualizar fechas según el nuevo estado
  const estado = await prisma.registroEstado.findUnique({
    where: { id: estadoId }
  });

  if (estado) {
    const fechaActual = new Date();

    switch (estado.nombre) {
      case 'CERTIFICADO_GENERADO':
        dataToUpdate.fechaGeneracionCert = fechaActual;
        break;
      case 'ENVIADO_FIRMA':
        dataToUpdate.fechaEnvioFirma = fechaActual;
        break;
      case 'CERTIFICADO_FIRMADO':
        dataToUpdate.fechaFirmaCert = fechaActual;
        break;
      case 'LISTO_PARA_ENTREGA':
        dataToUpdate.fechaEnviadoAAU = fechaActual;
        break;
      case 'ENTREGADO':
        dataToUpdate.fechaEntregado = fechaActual;
        break;
    }
  }

  const registroActualizado = await prisma.registro.update({
    where: { id: parseInt(id) },
    data: dataToUpdate,
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true
        }
      },
      formularioProducto: {
        include: {
          producto: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: registroActualizado,
    message: 'Estado actualizado exitosamente'
  });
});

// ============================================
// GENERAR CERTIFICADO PDF
// ============================================
export const generarCertificado = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { id } = req.params;

  // Obtener registro completo
  const registro = await prisma.registro.findUnique({
    where: { id: parseInt(id) },
    include: {
      estado: true,
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              }
            }
          },
          campos: {
            include: {
              campo: true
            }
          }
        }
      }
    }
  });

  if (!registro) {
    throw new AppError('Registro no encontrado', 404);
  }

  // Verificar que esté asentado
  if (registro.estado.nombre === 'PENDIENTE_ASENTAMIENTO') {
    throw new AppError('El registro debe estar asentado para generar certificado', 400);
  }

  // Obtener información del cliente
  const cliente = registro.formularioProducto.formulario.clientes[0]?.cliente;
  if (!cliente) {
    throw new AppError('No se encontró información del titular', 400);
  }

  // ==========================================
  // DETECTAR SI ES PRODUCCIÓN
  // ==========================================
  const formulario = registro.formularioProducto.formulario;
  const esProduccion = formulario.esProduccion || formulario.produccionPadreId !== null;

  let pdfPath: string;
  let registrosActualizar: number[] = [parseInt(id)];

  if (esProduccion) {
    // ES PRODUCCIÓN - Generar certificado único para todas las obras

    // Obtener el ID del formulario padre
    const formularioPadreId = formulario.produccionPadreId || formulario.id;

    // Obtener TODOS los registros de la producción
    const registrosProduccion = await prisma.registro.findMany({
      where: {
        formularioProducto: {
          formulario: {
            OR: [
              { id: formularioPadreId },
              { produccionPadreId: formularioPadreId }
            ]
          }
        }
      },
      include: {
        formularioProducto: {
          include: {
            formulario: true
          }
        }
      },
      orderBy: { numeroRegistro: 'asc' }
    });

    if (registrosProduccion.length === 0) {
      throw new AppError('No se encontraron obras de la producción', 404);
    }

    // Verificar si ya se generó el certificado para alguno de la producción
    const certificadoExistente = registrosProduccion.find(r => r.certificadoGenerado);
    if (certificadoExistente) {
      // Ya existe certificado, usar el mismo para todos
      pdfPath = certificadoExistente.certificadoGenerado!;
    } else {
      // Obtener el formulario padre para tener el título
      const formularioPadre = await prisma.formulario.findUnique({
        where: { id: formularioPadreId }
      });

      // Preparar datos de la producción
      const primerRegistro = registrosProduccion[0];
      const produccionData = {
        tituloProduccion: formularioPadre?.tituloProduccion || '',
        tipoObra: registro.tipoObra,
        fechaAsentamiento: primerRegistro.fechaAsentamiento,
        libroNumero: primerRegistro.libroNumero,
        numeroRegistroPrimero: primerRegistro.numeroRegistro,
        cliente: {
          nombrecompleto: cliente.nombrecompleto,
          identificacion: cliente.identificacion,
          rnc: cliente.rnc,
          direccion: cliente.direccion
        },
        obras: registrosProduccion.map(r => ({
          numeroRegistro: r.numeroRegistro,
          tituloObra: r.tituloObra
        }))
      };

      // Generar certificado de producción
      pdfPath = await generarCertificadoProduccion(formularioPadreId, produccionData);
    }

    // Marcar TODOS los registros de la producción para actualizar
    registrosActualizar = registrosProduccion.map(r => r.id);

  } else {
    // NO ES PRODUCCIÓN - Generar certificado individual
    const certificadoData = {
      numeroRegistro: registro.numeroRegistro,
      tituloObra: registro.tituloObra,
      tipoObra: registro.tipoObra,
      fechaAsentamiento: registro.fechaAsentamiento,
      libroNumero: registro.libroNumero,
      hojaNumero: registro.hojaNumero,
      cliente: {
        nombrecompleto: cliente.nombrecompleto,
        identificacion: cliente.identificacion
      },
      campos: registro.formularioProducto.campos
    };

    // Usar servicio original (ya actualizado con nuevo diseño)
    pdfPath = await generarCertificadoRegistro(parseInt(id), certificadoData);
  }

  // Obtener estado CERTIFICADO_GENERADO
  const estadoCertificado = await prisma.registroEstado.findFirst({
    where: { nombre: 'CERTIFICADO_GENERADO' }
  });

  if (!estadoCertificado) {
    throw new AppError('Estado CERTIFICADO_GENERADO no encontrado', 500);
  }

  // Actualizar TODOS los registros correspondientes
  await prisma.registro.updateMany({
    where: { id: { in: registrosActualizar } },
    data: {
      certificadoGenerado: pdfPath,
      estadoId: estadoCertificado.id,
      fechaGeneracionCert: new Date()
    }
  });

  // Obtener el registro actualizado para retornar
  const registroActualizado = await prisma.registro.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true }
  });

  res.json({
    success: true,
    data: {
      registro: registroActualizado,
      certificadoUrl: pdfPath,
      esProduccion,
      registrosActualizados: registrosActualizar.length
    },
    message: esProduccion
      ? `Certificado de producción generado para ${registrosActualizar.length} obras`
      : 'Certificado generado exitosamente'
  });
});

// ============================================
// SUBIR CERTIFICADO FIRMADO
// ============================================
export const subirCertificadoFirmado = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { id } = req.params;
  const file = req.file;

  if (!file) {
    throw new AppError('No se subió ningún archivo', 400);
  }

  // Obtener registro con formulario
  const registro = await prisma.registro.findUnique({
    where: { id: parseInt(id) },
    include: {
      estado: true,
      formularioProducto: {
        include: {
          formulario: true
        }
      }
    }
  });

  if (!registro) {
    throw new AppError('Registro no encontrado', 404);
  }

  // Verificar que tenga certificado generado
  if (!registro.certificadoGenerado) {
    throw new AppError('Debe generar el certificado antes de subir la versión firmada', 400);
  }

  const relativePath = `/uploads/certificados-firmados/${file.filename}`;

  // Obtener estado CERTIFICADO_FIRMADO
  const estadoFirmado = await prisma.registroEstado.findFirst({
    where: { nombre: 'CERTIFICADO_FIRMADO' }
  });

  if (!estadoFirmado) {
    throw new AppError('Estado CERTIFICADO_FIRMADO no encontrado', 500);
  }

  // ==========================================
  // DETECTAR SI ES PRODUCCIÓN
  // ==========================================
  const formulario = registro.formularioProducto.formulario;
  const esProduccion = formulario.esProduccion || formulario.produccionPadreId !== null;

  let registrosActualizar: number[] = [parseInt(id)];

  if (esProduccion) {
    // Es producción - actualizar TODOS los registros
    const formularioPadreId = formulario.produccionPadreId || formulario.id;

    // Obtener TODOS los registros de la producción
    const registrosProduccion = await prisma.registro.findMany({
      where: {
        formularioProducto: {
          formulario: {
            OR: [
              { id: formularioPadreId },
              { produccionPadreId: formularioPadreId }
            ]
          }
        }
      }
    });

    registrosActualizar = registrosProduccion.map(r => r.id);
  }

  // Actualizar TODOS los registros correspondientes
  await prisma.registro.updateMany({
    where: { id: { in: registrosActualizar } },
    data: {
      certificadoFirmado: relativePath,
      estadoId: estadoFirmado.id,
      fechaFirmaCert: new Date()
    }
  });

  // Obtener el registro actualizado para retornar
  const registroActualizado = await prisma.registro.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true }
  });

  res.json({
    success: true,
    data: {
      registro: registroActualizado,
      certificadoFirmadoUrl: relativePath,
      esProduccion,
      registrosActualizados: registrosActualizar.length
    },
    message: esProduccion
      ? `Certificado firmado aplicado a ${registrosActualizar.length} obras de la producción`
      : 'Certificado firmado subido exitosamente'
  });
});

// ============================================
// ENVIAR A AAU PARA ENTREGA
// ============================================
export const enviarAAAU = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Se requiere un array de IDs', 400);
  }

  // Obtener estado LISTO_PARA_ENTREGA para registros
  const estadoListo = await prisma.registroEstado.findFirst({
    where: { nombre: 'LISTO_PARA_ENTREGA' }
  });

  if (!estadoListo) {
    throw new AppError('Estado LISTO_PARA_ENTREGA no encontrado', 500);
  }

  // Obtener estado CERTIFICADO para formularios
  const estadoCertificado = await prisma.formularioEstado.findUnique({
    where: { nombre: 'CERTIFICADO' }
  });

  if (!estadoCertificado) {
    throw new AppError('Estado CERTIFICADO no encontrado', 500);
  }

  // Obtener los registros para actualizar también sus formularios
  const registros = await prisma.registro.findMany({
    where: {
      id: { in: ids },
      certificadoFirmado: { not: null }
    },
    include: {
      formularioProducto: {
        select: {
          formularioId: true
        }
      }
    }
  });

  // Actualizar registros y formularios en una transacción
  await prisma.$transaction(async (tx) => {
    // Actualizar registros
    await tx.registro.updateMany({
      where: {
        id: { in: registros.map(r => r.id) }
      },
      data: {
        estadoId: estadoListo.id,
        fechaEnviadoAAU: new Date()
      }
    });

    // Actualizar formularios asociados a estado CERTIFICADO
    const formularioIds = [...new Set(registros.map(r => r.formularioProducto.formularioId))];
    await tx.formulario.updateMany({
      where: {
        id: { in: formularioIds }
      },
      data: {
        estadoId: estadoCertificado.id
      }
    });
  });

  res.json({
    success: true,
    data: {
      cantidadEnviados: registros.length
    },
    message: `${registros.length} certificado(s) enviado(s) a AAU para entrega`
  });
});

// ============================================
// OBTENER REGISTROS LISTOS PARA GENERAR CERTIFICADOS
// ============================================
export const getRegistrosParaCertificados = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Obtener estado ASENTADO
  const estadoAsentado = await prisma.registroEstado.findFirst({
    where: { nombre: 'ASENTADO' }
  });

  if (!estadoAsentado) {
    throw new AppError('Estado ASENTADO no encontrado', 500);
  }

  const registros = await prisma.registro.findMany({
    where: {
      estadoId: estadoAsentado.id
    },
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true
        }
      },
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { fechaAsentamiento: 'asc' }
  });

  // Agrupar producciones - solo mostrar UNA entrada por producción
  const registrosAgrupados: any[] = [];
  const produccionesVistas = new Set<number>();

  for (const registro of registros) {
    const formulario = registro.formularioProducto.formulario;
    const esProduccion = formulario.esProduccion || formulario.produccionPadreId !== null;

    if (esProduccion) {
      // Es parte de una producción
      const formularioPadreId = formulario.produccionPadreId || formulario.id;

      // Si ya agregamos esta producción, saltarla
      if (produccionesVistas.has(formularioPadreId)) {
        continue;
      }

      // Marcar como vista
      produccionesVistas.add(formularioPadreId);

      // Contar todas las obras de esta producción
      const obrasProduccion = registros.filter(r => {
        const form = r.formularioProducto.formulario;
        return form.id === formularioPadreId || form.produccionPadreId === formularioPadreId;
      });

      // Usar el primer registro pero con info de producción
      registrosAgrupados.push({
        ...registro,
        esProduccion: true,
        cantidadObras: obrasProduccion.length,
        tituloObra: formulario.tituloProduccion || `Producción de ${registro.tipoObra}`,
        idsProduccion: obrasProduccion.map(r => r.id)
      });
    } else {
      // No es producción, agregar normal
      registrosAgrupados.push({
        ...registro,
        esProduccion: false,
        cantidadObras: 1
      });
    }
  }

  res.json({
    success: true,
    data: {
      registros: registrosAgrupados,
      total: registrosAgrupados.length
    }
  });
});

// ============================================
// OBTENER CERTIFICADOS LISTOS PARA ENVIAR A AAU
// ============================================
export const getCertificadosListosAAU = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Obtener estados CERTIFICADO_GENERADO y CERTIFICADO_FIRMADO
  const estadoGenerado = await prisma.registroEstado.findFirst({
    where: { nombre: 'CERTIFICADO_GENERADO' }
  });

  const estadoFirmado = await prisma.registroEstado.findFirst({
    where: { nombre: 'CERTIFICADO_FIRMADO' }
  });

  if (!estadoGenerado || !estadoFirmado) {
    throw new AppError('Estados de certificados no encontrados', 500);
  }

  const registros = await prisma.registro.findMany({
    where: {
      OR: [
        { estadoId: estadoGenerado.id },
        { estadoId: estadoFirmado.id }
      ]
    },
    include: {
      estado: true,
      usuarioAsentamiento: {
        select: {
          nombrecompleto: true
        }
      },
      formularioProducto: {
        include: {
          producto: true,
          formulario: {
            include: {
              clientes: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { fechaGeneracionCert: 'desc' }
  });

  // Agrupar producciones - solo mostrar UNA entrada por producción
  const registrosAgrupados: any[] = [];
  const produccionesVistas = new Set<number>();

  for (const registro of registros) {
    const formulario = registro.formularioProducto.formulario;
    const esProduccion = formulario.esProduccion || formulario.produccionPadreId !== null;

    if (esProduccion) {
      // Es parte de una producción
      const formularioPadreId = formulario.produccionPadreId || formulario.id;

      // Si ya agregamos esta producción, saltarla
      if (produccionesVistas.has(formularioPadreId)) {
        continue;
      }

      // Marcar como vista
      produccionesVistas.add(formularioPadreId);

      // Contar todas las obras de esta producción
      const obrasProduccion = registros.filter(r => {
        const form = r.formularioProducto.formulario;
        return form.id === formularioPadreId || form.produccionPadreId === formularioPadreId;
      });

      // Usar el primer registro pero con info de producción
      registrosAgrupados.push({
        ...registro,
        esProduccion: true,
        cantidadObras: obrasProduccion.length,
        tituloObra: formulario.tituloProduccion || `Producción de ${registro.tipoObra}`,
        idsProduccion: obrasProduccion.map(r => r.id)
      });
    } else {
      // No es producción, agregar normal
      registrosAgrupados.push({
        ...registro,
        esProduccion: false,
        cantidadObras: 1
      });
    }
  }

  res.json({
    success: true,
    data: {
      registros: registrosAgrupados,
      total: registrosAgrupados.length
    }
  });
});
