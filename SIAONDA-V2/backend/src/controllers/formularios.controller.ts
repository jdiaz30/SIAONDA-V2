import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getFileUrl, deleteFile } from '../middleware/upload';

// Schemas de validación
const createFormularioSchema = z.object({
  productos: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive().default(1),
    campos: z.array(z.object({
      campoId: z.number().int().positive(),
      valor: z.string()
    }))
  })),
  clientes: z.array(z.object({
    clienteId: z.number().int().positive(),
    tipoRelacion: z.string().default('Autor')
  })),
  firma: z.string().optional(),
  observaciones: z.string().optional()
});

// Generar código único de formulario: 8 dígitos + /MM/YYYY
// Con protección contra race conditions en concurrencia
const generateCodigoFormulario = async (): Promise<string> => {
  const now = new Date();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const año = now.getFullYear();

  // Retry hasta 5 veces si hay colisión
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.formulario.count();
    const numero = (count + 1 + attempt).toString().padStart(8, '0');
    const codigo = `${numero}/${mes}/${año}`;

    // Verificar que no exista
    const existe = await prisma.formulario.findUnique({
      where: { codigo }
    });

    if (!existe) {
      return codigo;
    }

    // Si existe, esperar un tiempo aleatorio antes de reintentar
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  // Fallback: usar timestamp para garantizar unicidad
  const timestamp = Date.now();
  return `${timestamp.toString().padStart(8, '0')}/${mes}/${año}`;
};

// GET /api/formularios
export const getFormularios = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const estadoId = req.query.estadoId ? parseInt(req.query.estadoId as string) : undefined;

  const where: any = {
    // Excluir obras hijas de producciones (solo mostrar producciones padre y formularios normales)
    produccionPadreId: null
  };

  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: 'insensitive' } },
      { clientes: { some: { cliente: { nombrecompleto: { contains: search, mode: 'insensitive' } } } } }
    ];
  }

  if (estadoId) {
    where.estadoId = estadoId;
  }

  const [formularios, total] = await Promise.all([
    prisma.formulario.findMany({
      where,
      skip,
      take: limit,
      include: {
        estado: true,
        usuario: {
          select: {
            id: true,
            nombrecompleto: true
          }
        },
        clientes: {
          include: {
            cliente: {
              select: {
                id: true,
                codigo: true,
                nombrecompleto: true,
                identificacion: true
              }
            }
          },
          take: 1
        },
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                categoria: true
              }
            },
            campos: {
              include: {
                campo: true
              }
            }
          }
        },
        factura: {
          select: {
            id: true,
            codigo: true,
            total: true,
            estado: true
          }
        },
        _count: {
          select: {
            certificados: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    }),
    prisma.formulario.count({ where })
  ]);

  res.json({
    formularios,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/formularios/:id
export const getFormulario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const formulario = await prisma.formulario.findUnique({
    where: { id },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          codigo: true,
          nombrecompleto: true
        }
      },
      factura: {
        include: {
          estado: true
        }
      },
      clientes: {
        include: {
          cliente: {
            include: {
              archivos: true
            }
          }
        }
      },
      productos: {
        include: {
          producto: {
            include: {
              costos: {
                where: {
                  OR: [
                    { fechaFinal: null },
                    { fechaFinal: { gte: new Date() } }
                  ],
                  fechaInicio: { lte: new Date() }
                },
                orderBy: { cantidadMin: 'asc' }
              }
            }
          },
          campos: {
            include: {
              campo: {
                include: {
                  tipo: true
                }
              }
            }
          },
          archivos: true
        }
      },
      certificados: {
        include: {
          estado: true
        }
      },
      solicitudIrc: {
        include: {
          estado: true,
          empresa: true,
          certificado: true,
          categoriaIrc: true,
          factura: {
            select: {
              id: true,
              codigo: true,
              ncf: true,
              total: true,
            }
          },
          recibidoPor: {
            select: {
              id: true,
              nombrecompleto: true
            }
          }
        }
      }
    }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  res.json(formulario);
});

// POST /api/formularios
export const createFormulario = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = createFormularioSchema.parse(req.body);

  // Generar código único
  const codigo = await generateCodigoFormulario();

  // Estado inicial: Pendiente
  const estadoPendiente = await prisma.formularioEstado.findFirst({
    where: { nombre: 'Pendiente' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado Pendiente no configurado', 500);
  }

  // Crear formulario con transacción
  const formulario = await prisma.$transaction(async (tx) => {
    const nuevoFormulario = await tx.formulario.create({
      data: {
        codigo,
        fecha: new Date(),
        estadoId: estadoPendiente.id,
        usuarioId: req.usuario!.id,
        firma: data.firma || null,
        observaciones: data.observaciones || null
      }
    });

    // Asociar clientes
    for (const clienteData of data.clientes) {
      await tx.formularioCliente.create({
        data: {
          formularioId: nuevoFormulario.id,
          clienteId: clienteData.clienteId,
          tipoRelacion: clienteData.tipoRelacion
        }
      });
    }

    // Asociar productos y campos
    for (const productoData of data.productos) {
      const formularioProducto = await tx.formularioProducto.create({
        data: {
          formularioId: nuevoFormulario.id,
          productoId: productoData.productoId,
          cantidad: productoData.cantidad
        }
      });

      // Guardar valores de campos
      for (const campoData of productoData.campos) {
        await tx.formularioProductoCampo.create({
          data: {
            formularioProductoId: formularioProducto.id,
            campoId: campoData.campoId,
            valor: campoData.valor
          }
        });
      }
    }

    // 🔗 WEBHOOK: Si el formulario es de tipo IRC, crear automáticamente la solicitud de Inspectoría
    const productosFormulario = await tx.formularioProducto.findMany({
      where: { formularioId: nuevoFormulario.id },
      include: { producto: true }
    });

    const tieneProductoIRC = productosFormulario.some(fp => fp.producto.codigo === 'IRC-01');

    if (tieneProductoIRC) {
      // Obtener datos del formulario para crear la solicitud IRC
      const productosConCampos = await tx.formularioProducto.findMany({
        where: {
          formularioId: nuevoFormulario.id,
          producto: { codigo: 'IRC-01' }
        },
        include: {
          campos: {
            include: { campo: true }
          }
        }
      });

      const productoCampos = productosConCampos[0]?.campos || [];
      const getCampoValor = (nombreCampo: string) =>
        productoCampos.find(c => c.campo.campo === nombreCampo)?.valor;

      const tipoSolicitud = getCampoValor('tipoSolicitud') || 'REGISTRO_NUEVO';
      const nombreEmpresa = getCampoValor('nombreEmpresa');
      const nombreComercial = getCampoValor('nombreComercial');
      const rnc = getCampoValor('rnc');
      const categoriaIrcNombre = getCampoValor('categoriaIrc');
      const direccion = getCampoValor('direccion');
      const telefono = getCampoValor('telefono');
      const email = getCampoValor('email') || 'sin-email@onda.gob.do';
      const representanteLegal = getCampoValor('representanteLegal');
      const cedulaRepresentante = getCampoValor('cedulaRepresentante');
      const tipoPersona = getCampoValor('tipoPersona') || 'MORAL';
      const descripcionActividades = getCampoValor('descripcionActividades') || 'Sin descripción';

      if (!nombreEmpresa || !rnc || !categoriaIrcNombre || !tipoPersona) {
        throw new AppError('Datos incompletos para crear solicitud IRC', 400);
      }

      // Buscar categoría IRC por nombre
      const categoriaIrc = await tx.categoriaIrc.findFirst({
        where: {
          nombre: { contains: categoriaIrcNombre, mode: 'insensitive' }
        }
      });

      if (!categoriaIrc) {
        throw new AppError(`Categoría IRC "${categoriaIrcNombre}" no encontrada`, 400);
      }

      // Generar código de solicitud
      const year = new Date().getFullYear();
      const count = await tx.solicitudRegistroInspeccion.count({
        where: {
          codigo: { startsWith: `SOL-INSP-${year}` }
        }
      });
      const codigoSolicitud = `SOL-INSP-${year}-${(count + 1).toString().padStart(4, '0')}`;

      // Obtener estado inicial "PENDIENTE"
      const estadoPendiente = await tx.estadoSolicitudInspeccion.findFirst({
        where: { nombre: 'PENDIENTE' }
      });

      // Crear solicitud de inspectoría (SIN crear EmpresaInspeccionada aún)
      // La empresa se crea DESPUÉS cuando el inspector apruebe la solicitud
      const solicitud = await tx.solicitudRegistroInspeccion.create({
        data: {
          codigo: codigoSolicitud,
          empresaId: null, // No hay empresa aún, se creará al aprobar
          tipoSolicitud,
          nombreEmpresa: nombreEmpresa,
          nombreComercial: nombreComercial,
          rnc,
          categoriaIrcId: categoriaIrc.id,
          estadoId: estadoPendiente?.id || 1,
          recibidoPorId: req.usuario!.id,
          fechaRecepcion: new Date()
        }
      });

      // Vincular formulario con solicitud
      await tx.formulario.update({
        where: { id: nuevoFormulario.id },
        data: { solicitudIrcId: solicitud.id }
      });

      console.log(`✅ Webhook IRC: Creada solicitud ${codigoSolicitud} desde formulario ${codigo}`);
    }

    return nuevoFormulario;
  });

  // Obtener formulario completo
  const formularioCompleto = await prisma.formulario.findUnique({
    where: { id: formulario.id },
    include: {
      estado: true,
      clientes: {
        include: {
          cliente: true
        }
      },
      productos: {
        include: {
          producto: true,
          campos: {
            include: {
              campo: true
            }
          }
        }
      }
    }
  });

  res.status(201).json(formularioCompleto);
});

// PUT /api/formularios/:id
export const updateFormulario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { observaciones, firma, productos } = req.body;

  const existente = await prisma.formulario.findUnique({
    where: { id },
    include: {
      productos: {
        include: {
          campos: true
        }
      }
    }
  });

  if (!existente) {
    throw new AppError('Formulario no encontrado', 404);
  }

  // Si hay productos para actualizar, usar transacción
  const formulario = await prisma.$transaction(async (tx) => {
    // Actualizar datos básicos del formulario
    const formularioActualizado = await tx.formulario.update({
      where: { id },
      data: {
        observaciones,
        firma: firma || null
      }
    });

    // Si hay productos para actualizar
    if (productos && Array.isArray(productos)) {
      for (const productoData of productos) {
        const { productoId, campos } = productoData;

        // Buscar el FormularioProducto existente
        const formularioProducto = existente.productos.find(
          fp => fp.productoId === productoId
        );

        if (formularioProducto && campos && Array.isArray(campos)) {
          // Eliminar campos antiguos
          await tx.formularioProductoCampo.deleteMany({
            where: {
              formularioProductoId: formularioProducto.id
            }
          });

          // Crear nuevos campos
          for (const campo of campos) {
            if (campo.campoId && campo.valor !== undefined) {
              await tx.formularioProductoCampo.create({
                data: {
                  formularioProductoId: formularioProducto.id,
                  campoId: campo.campoId,
                  valor: campo.valor.toString()
                }
              });
            }
          }
        }
      }
    }

    // Retornar formulario actualizado con todas sus relaciones
    return tx.formulario.findUnique({
      where: { id },
      include: {
        estado: true,
        clientes: {
          include: {
            cliente: true
          }
        },
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
        solicitudIrc: {
          include: {
            estado: true,
            categoriaIrc: true,
            recibidoPor: {
              select: {
                id: true,
                nombrecompleto: true
              }
            }
          }
        }
      }
    });
  });

  res.json(formulario);
});

// POST /api/formularios/:id/asentar
export const asentarFormulario = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const formulario = await prisma.formulario.findUnique({
    where: { id },
    include: { estado: true }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  if (formulario.estado.nombre === 'Asentado' || formulario.estado.nombre === 'Certificado') {
    throw new AppError('El formulario ya está asentado', 400);
  }

  const estadoAsentado = await prisma.formularioEstado.findFirst({
    where: { nombre: 'Asentado' }
  });

  if (!estadoAsentado) {
    throw new AppError('Estado Asentado no configurado', 500);
  }

  const formularioActualizado = await prisma.formulario.update({
    where: { id },
    data: {
      estadoId: estadoAsentado.id
    },
    include: {
      estado: true,
      productos: true
    }
  });

  res.json({
    message: 'Formulario asentado exitosamente',
    formulario: formularioActualizado
  });
});

// GET /api/formularios/estados
export const getEstadosFormulario = asyncHandler(async (req: Request, res: Response) => {
  const estados = await prisma.formularioEstado.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(estados);
});

// DELETE /api/formularios/:id
export const deleteFormulario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const existente = await prisma.formulario.findUnique({
    where: { id },
    include: {
      estado: true,
      certificados: true
    }
  });

  if (!existente) {
    throw new AppError('Formulario no encontrado', 404);
  }

  if (existente.certificados.length > 0) {
    throw new AppError('No se puede eliminar un formulario que ya tiene certificados', 400);
  }

  if (existente.estado.nombre === 'Asentado' || existente.estado.nombre === 'Certificado') {
    throw new AppError('No se puede eliminar un formulario asentado o certificado', 400);
  }

  await prisma.formulario.delete({ where: { id } });

  res.json({ message: 'Formulario eliminado exitosamente' });
});

// POST /api/formularios/:id/archivos
export const uploadArchivos = asyncHandler(async (req: Request, res: Response) => {
  const formularioId = parseInt(req.params.id);
  const formularioProductoId = req.body.formularioProductoId ? parseInt(req.body.formularioProductoId) : null;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new AppError('No se proporcionaron archivos', 400);
  }

  // Verificar que el formulario existe
  const formulario = await prisma.formulario.findUnique({
    where: { id: formularioId }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  // Si se especifica formularioProductoId, verificar que existe
  if (formularioProductoId) {
    const formularioProducto = await prisma.formularioProducto.findFirst({
      where: {
        id: formularioProductoId,
        formularioId
      }
    });

    if (!formularioProducto) {
      throw new AppError('Producto del formulario no encontrado', 404);
    }
  }

  // Guardar archivos en la base de datos
  const archivosGuardados = [];
  for (const file of files) {
    // Obtener ruta relativa desde uploads (no hardcodear la carpeta)
    const rutaRelativa = file.path.replace(/\\/g, '/').split('uploads/')[1] || file.path;
    const ruta = rutaRelativa.startsWith('uploads/') ? rutaRelativa : `uploads/${rutaRelativa}`;

    const archivo = await prisma.formularioArchivo.create({
      data: {
        formularioId,
        formularioProductoId,
        nombreOriginal: file.originalname,
        nombreSistema: file.filename,
        ruta: ruta,
        tamano: file.size,
        mimeType: file.mimetype
      }
    });

    archivosGuardados.push({
      id: archivo.id,
      nombre: archivo.nombreOriginal,
      ruta: archivo.ruta,
      tipo: archivo.mimeType,
      tamano: Number(archivo.tamano) // Convert BigInt to Number for JSON serialization
    });
  }

  res.json({
    message: `${archivosGuardados.length} archivo(s) guardado(s) exitosamente`,
    archivos: archivosGuardados
  });
});

// DELETE /api/formularios/:id/archivos/:archivoId
export const deleteArchivo = asyncHandler(async (req: Request, res: Response) => {
  const formularioId = parseInt(req.params.id);
  const archivoId = parseInt(req.params.archivoId);

  // TODO: Implementar lógica de eliminación
  // Dependiendo de cómo almacenes los archivos (tabla separada o JSON)

  res.json({ message: 'Archivo eliminado exitosamente' });
});

/**
 * POST /api/formularios/obras
 * Crear formulario de registro de obra (nuevo flujo simplificado AaU)
 */
export const createFormularioObra = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const {
    autores,        // Array de { clienteId, rol }
    productoId,     // ID del producto/tipo de obra seleccionado
    datosObra,      // Objeto con: camposEspecificos
  } = req.body;

  // Validaciones
  if (!autores || autores.length === 0) {
    throw new AppError('Debe incluir al menos un autor', 400);
  }

  if (!productoId) {
    throw new AppError('Debe seleccionar un tipo de obra', 400);
  }

  if (!datosObra || !datosObra.camposEspecificos) {
    throw new AppError('Debe completar los datos de la obra', 400);
  }

  // Verificar que hay un autor principal
  const tieneAutorPrincipal = autores.some((a: any) => a.rol === 'AUTOR_PRINCIPAL');
  if (!tieneAutorPrincipal) {
    throw new AppError('Debe designar un Autor Principal', 400);
  }

  // Obtener el producto y su precio
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    include: {
      costos: {
        where: {
          OR: [
            { fechaFinal: null },
            { fechaFinal: { gte: new Date() } }
          ],
          fechaInicio: { lte: new Date() }
        },
        orderBy: { cantidadMin: 'asc' },
        take: 1
      }
    }
  });

  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  const precioProducto = producto.costos[0]?.precio;
  if (!precioProducto) {
    throw new AppError('No se encontró precio para este producto', 500);
  }

  // Generar código único de formulario
  const codigo = await generateCodigoFormulario();

  // Obtener estado PENDIENTE_PAGO
  const estadoPendiente = await prisma.formularioEstado.findFirst({
    where: { nombre: 'PENDIENTE_PAGO' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado PENDIENTE_PAGO no configurado', 500);
  }

  // Crear formulario en transacción
  const formulario = await prisma.$transaction(async (tx) => {
    // 1. Crear formulario
    const nuevoFormulario = await tx.formulario.create({
      data: {
        codigo,
        fecha: new Date(),
        estadoId: estadoPendiente.id,
        usuarioId: req.usuario!.id,
        // Guardar todos los datos de la obra en observaciones como JSON
        observaciones: JSON.stringify(datosObra.camposEspecificos)
      }
    });

    // 2. Asociar autores/clientes con sus roles
    for (const autor of autores) {
      await tx.formularioCliente.create({
        data: {
          formularioId: nuevoFormulario.id,
          clienteId: autor.clienteId,
          tipoRelacion: autor.rol
        }
      });
    }

    // 3. Asociar el producto
    await tx.formularioProducto.create({
      data: {
        formularioId: nuevoFormulario.id,
        productoId: producto.id,
        cantidad: 1
      }
    });

    return nuevoFormulario;
  });

  // Obtener formulario completo con relaciones
  const formularioCompleto = await prisma.formulario.findUnique({
    where: { id: formulario.id },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true
        }
      },
      clientes: {
        include: {
          cliente: true
        }
      },
      productos: {
        include: {
          producto: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Formulario creado exitosamente',
    formulario: formularioCompleto
  });
});

/**
 * POST /api/formularios/obras-multiple
 * Crear formulario con MÚLTIPLES obras (sistema de carrito)
 */
export const createFormularioObrasMultiple = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const {
    autores,  // Array de { clienteId, rol }
    obras     // Array de { productoId, datosObra: { camposEspecificos } }
  } = req.body;

  // Validaciones
  if (!autores || autores.length === 0) {
    throw new AppError('Debe incluir al menos un autor', 400);
  }

  if (!obras || obras.length === 0) {
    throw new AppError('Debe incluir al menos una obra en el carrito', 400);
  }

  // Verificar que hay un autor principal
  const tieneAutorPrincipal = autores.some((a: any) => a.rol === 'AUTOR_PRINCIPAL');
  if (!tieneAutorPrincipal) {
    throw new AppError('Debe designar un Autor Principal', 400);
  }

  // Obtener estado PENDIENTE_PAGO
  const estadoPendiente = await prisma.formularioEstado.findFirst({
    where: { nombre: 'PENDIENTE_PAGO' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado PENDIENTE_PAGO no configurado', 500);
  }

  // Validar productos y calcular total
  let montoTotal = 0;
  const productosValidados: Array<{
    productoId: number;
    datosObra: any;
    producto: any;
    precio: number;
  }> = [];

  for (const obra of obras) {
    if (!obra.productoId) {
      throw new AppError('Cada obra debe tener un productoId', 400);
    }

    if (!obra.datosObra || !obra.datosObra.camposEspecificos) {
      throw new AppError('Cada obra debe tener datos completos', 400);
    }

    const producto = await prisma.producto.findUnique({
      where: { id: obra.productoId },
      include: {
        costos: {
          where: {
            OR: [
              { fechaFinal: null },
              { fechaFinal: { gte: new Date() } }
            ],
            fechaInicio: { lte: new Date() }
          },
          orderBy: { cantidadMin: 'asc' },
          take: 1
        }
      }
    });

    if (!producto) {
      throw new AppError(`Producto con ID ${obra.productoId} no encontrado`, 404);
    }

    const precio = producto.costos[0]?.precio;
    if (!precio) {
      throw new AppError(`No se encontró precio para el producto ${producto.codigo}`, 500);
    }

    montoTotal += Number(precio);
    productosValidados.push({
      productoId: obra.productoId,
      datosObra: obra.datosObra,
      producto,
      precio
    });
  }

  // Generar código único
  const codigo = await generateCodigoFormulario();

  // Crear formulario con todas las obras en UNA transacción
  const formulario = await prisma.$transaction(async (tx) => {
    // 1. Crear formulario principal
    const nuevoFormulario = await tx.formulario.create({
      data: {
        codigo,
        fecha: new Date(),
        estadoId: estadoPendiente.id,
        usuarioId: req.usuario!.id,
        montoTotal
      }
    });

    // 2. Asociar autores (una sola vez para todas las obras)
    for (const autor of autores) {
      await tx.formularioCliente.create({
        data: {
          formularioId: nuevoFormulario.id,
          clienteId: autor.clienteId,
          tipoRelacion: autor.rol
        }
      });
    }

    // 3. Crear FormularioProducto por CADA obra en el carrito
    for (const { productoId, datosObra, precio } of productosValidados) {
      const formularioProducto = await tx.formularioProducto.create({
        data: {
          formularioId: nuevoFormulario.id,
          productoId,
          cantidad: 1
        }
      });

      // 4. Obtener campos del formulario para este producto
      const campos = await tx.formularioCampo.findMany({
        where: { productoId }
      });

      // 5. Guardar valores de campos específicos de ESTA obra
      for (const campo of campos) {
        const valor = datosObra.camposEspecificos[campo.campo];

        // Solo guardar si tiene valor
        if (valor !== undefined && valor !== null && valor !== '') {
          await tx.formularioProductoCampo.create({
            data: {
              formularioProductoId: formularioProducto.id,
              campoId: campo.id,
              valor: String(valor)
            }
          });
        }
      }
    }

    return nuevoFormulario;
  });

  // Obtener formulario completo con todas las relaciones
  const formularioCompleto = await prisma.formulario.findUnique({
    where: { id: formulario.id },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true
        }
      },
      clientes: {
        include: {
          cliente: true
        }
      },
      productos: {
        include: {
          producto: true,
          campos: {
            include: {
              campo: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    message: `Formulario creado exitosamente con ${obras.length} obra(s)`,
    formulario: formularioCompleto,
    totalObras: obras.length,
    montoTotal
  });
});

/**
 * PUT /api/formularios/:id/corregir
 * Corregir formulario devuelto desde Registro
 */
export const corregirFormulario = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { campos } = req.body; // Array de { id: campoId, valor: string }

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  if (!campos || !Array.isArray(campos)) {
    throw new AppError('Debe proporcionar campos a actualizar', 400);
  }

  // Verificar que el formulario existe y está en estado DEVUELTO
  const formulario = await prisma.formulario.findUnique({
    where: { id },
    include: {
      estado: true,
      productos: {
        include: {
          campos: true
        }
      }
    }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  if (formulario.estado.nombre !== 'DEVUELTO') {
    throw new AppError('Solo se pueden corregir formularios en estado DEVUELTO', 400);
  }

  // Actualizar campos en transacción
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar cada campo
    for (const campo of campos) {
      if (!campo.id || campo.valor === undefined) {
        continue;
      }

      await tx.formularioProductoCampo.update({
        where: { id: campo.id },
        data: { valor: campo.valor }
      });
    }

    // 2. Cambiar estado del formulario a PAGADO para que vuelva al flujo de Registro
    const estadoPagado = await tx.formularioEstado.findFirst({
      where: { nombre: 'PAGADO' }
    });

    if (!estadoPagado) {
      throw new AppError('Estado PAGADO no encontrado', 500);
    }

    // 3. Actualizar formulario: cambiar estado y limpiar datos de devolución
    await tx.formulario.update({
      where: { id },
      data: {
        estadoId: estadoPagado.id,
        mensajeDevolucion: null,
        fechaDevolucion: null
      }
    });

    // 4. Buscar el Registro asociado a este formulario y cambiar su estado a PENDIENTE_ASENTAMIENTO
    const registroDevuelto = await tx.registro.findFirst({
      where: {
        formularioProducto: {
          formularioId: id
        }
      },
      include: {
        estado: true
      }
    });

    if (registroDevuelto && registroDevuelto.estado.nombre === 'DEVUELTO_AAU') {
      const estadoPendienteAsentamiento = await tx.registroEstado.findFirst({
        where: { nombre: 'PENDIENTE_ASENTAMIENTO' }
      });

      if (estadoPendienteAsentamiento) {
        await tx.registro.update({
          where: { id: registroDevuelto.id },
          data: {
            estadoId: estadoPendienteAsentamiento.id,
            observaciones: `Formulario corregido por AAU. ${registroDevuelto.observaciones || ''}`
          }
        });
      }
    }
  });

  res.json({
    success: true,
    message: 'Formulario corregido exitosamente. Será reenviado a Registro.'
  });
});

// GET /api/formularios/:id/historial - Obtener historial de cambios de estado
export const getHistorialFormulario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const formulario = await prisma.formulario.findUnique({
    where: { id: parseInt(id) }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  const historial = await prisma.formularioHistorial.findMany({
    where: { formularioId: parseInt(id) },
    include: {
      estadoAnterior: {
        select: { nombre: true, descripcion: true }
      },
      estadoNuevo: {
        select: { nombre: true, descripcion: true }
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          nombrecompleto: true,
          tipo: {
            select: { nombre: true }
          }
        }
      }
    },
    orderBy: { fecha: 'asc' }
  });

  res.json({
    success: true,
    data: historial
  });
});
