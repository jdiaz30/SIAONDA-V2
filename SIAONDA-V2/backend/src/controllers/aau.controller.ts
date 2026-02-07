import { Request, Response } from 'express';
import path from 'path';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * Controlador para el módulo de Atención al Usuario (AaU)
 * Gestiona formularios de registro de obras y servicios
 */

// GET /api/aau/estadisticas/dashboard
export const getEstadisticasDashboard = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total de formularios (obras + IRC)
  const totalFormularios = await prisma.formulario.count();

  // Formularios con solicitud IRC vinculada
  const formulariosConIRC = await prisma.formulario.count({
    where: { solicitudIrcId: { not: null } }
  });

  // Para IRC: contar por estados de SolicitudRegistroInspeccion
  const estadoIrcPendiente = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'PENDIENTE' } });
  const estadoIrcPagada = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'PAGADA' } });
  const estadoIrcEnRevision = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'EN_REVISION' } });
  const estadoIrcDevuelta = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'DEVUELTA' } });
  const estadoIrcCertificadoCargado = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'CERTIFICADO_CARGADO' } });
  const estadoIrcEntregada = await prisma.estadoSolicitudInspeccion.findUnique({ where: { nombre: 'ENTREGADA' } });

  // Contar solicitudes IRC por estado
  let ircPendientes = 0;
  if (estadoIrcPendiente || estadoIrcPagada) {
    const orConditions: any[] = [];
    if (estadoIrcPendiente) orConditions.push({ estadoId: estadoIrcPendiente.id });
    if (estadoIrcPagada) orConditions.push({ estadoId: estadoIrcPagada.id });

    if (orConditions.length > 0) {
      ircPendientes = await prisma.solicitudRegistroInspeccion.count({
        where: { OR: orConditions }
      });
    }
  }

  const ircEnRevision = estadoIrcEnRevision ? await prisma.solicitudRegistroInspeccion.count({
    where: { estadoId: estadoIrcEnRevision.id }
  }) : 0;

  const ircDevueltas = estadoIrcDevuelta ? await prisma.solicitudRegistroInspeccion.count({
    where: { estadoId: estadoIrcDevuelta.id }
  }) : 0;

  const ircListasEntrega = estadoIrcCertificadoCargado ? await prisma.solicitudRegistroInspeccion.count({
    where: { estadoId: estadoIrcCertificadoCargado.id }
  }) : 0;

  // Para obras: contar por estados de Formulario (solo los que NO son IRC)
  const estadoObraPendiente = await prisma.formularioEstado.findUnique({ where: { nombre: 'PENDIENTE' } });
  const estadoObraEnRevision = await prisma.formularioEstado.findUnique({ where: { nombre: 'EN_REVISION_REGISTRO' } });
  const estadoObraDevuelto = await prisma.formularioEstado.findUnique({ where: { nombre: 'DEVUELTO' } });
  const estadoObraCertificado = await prisma.formularioEstado.findUnique({ where: { nombre: 'CERTIFICADO' } });

  const [obrasPendientes, obrasEnRevision, obrasDevueltas, obrasCertificadas] = await Promise.all([
    estadoObraPendiente ? prisma.formulario.count({
      where: {
        estadoId: estadoObraPendiente.id,
        solicitudIrcId: null // Solo obras
      }
    }) : Promise.resolve(0),
    estadoObraEnRevision ? prisma.formulario.count({
      where: {
        estadoId: estadoObraEnRevision.id,
        solicitudIrcId: null
      }
    }) : Promise.resolve(0),
    estadoObraDevuelto ? prisma.formulario.count({
      where: {
        estadoId: estadoObraDevuelto.id,
        solicitudIrcId: null
      }
    }) : Promise.resolve(0),
    estadoObraCertificado ? prisma.formulario.count({
      where: {
        estadoId: estadoObraCertificado.id,
        solicitudIrcId: null
      }
    }) : Promise.resolve(0),
  ]);

  // Totales combinados
  const pendientes = obrasPendientes + ircPendientes;
  const enRevision = obrasEnRevision + ircEnRevision;
  const devueltos = obrasDevueltas + ircDevueltas;
  const certificados = obrasCertificadas + ircListasEntrega;

  // Estadísticas del mes
  const obrasRecibidasMes = await prisma.formulario.count({
    where: {
      fecha: { gte: primerDiaMes },
      solicitudIrcId: null // Solo obras
    }
  });

  const ircRecibidasMes = await prisma.solicitudRegistroInspeccion.count({
    where: {
      fechaRecepcion: { gte: primerDiaMes }
    }
  });

  const recibidosMes = obrasRecibidasMes + ircRecibidasMes;

  const entregadosMes = estadoIrcEntregada ? await prisma.solicitudRegistroInspeccion.count({
    where: {
      estadoId: estadoIrcEntregada.id,
      fechaEntrega: { gte: primerDiaMes }
    }
  }) : 0;

  res.json({
    pendientes,
    enRevision,
    devueltos,
    certificados,
    recibidosMes,
    asentadosMes: 0, // Por ahora 0, necesitaríamos contar formularios de obra asentados
    entregadosMes,
    devueltosMes: devueltos, // Simplificado
  });
});

// GET /api/aau/formularios
export const getFormularios = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const buscar = req.query.buscar as string;
  const estado = req.query.estado as string;
  const tipo = req.query.tipo as string;
  const fechaInicio = req.query.fechaInicio as string;
  const fechaFin = req.query.fechaFin as string;

  const where: any = {};

  // Filtro de búsqueda
  if (buscar) {
    where.OR = [
      { codigo: { contains: buscar, mode: 'insensitive' } },
      {
        clientes: {
          some: {
            cliente: {
              nombrecompleto: { contains: buscar, mode: 'insensitive' },
            },
          },
        },
      },
    ];
  }

  // Filtro de estado
  if (estado) {
    const estadoObj = await prisma.formularioEstado.findUnique({ where: { nombre: estado } });
    if (estadoObj) {
      where.estadoId = estadoObj.id;
    }
  }

  // Filtro de tipo (categoría de producto)
  if (tipo) {
    where.productos = {
      some: {
        producto: {
          categoria: { contains: tipo, mode: 'insensitive' },
        },
      },
    };
  }

  // Filtro de fechas
  if (fechaInicio || fechaFin) {
    where.fecha = {};
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio);
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin);
    }
  }

  // Obtener formularios regulares (obras)
  const [formularios, totalFormularios] = await Promise.all([
    prisma.formulario.findMany({
      where,
      include: {
        estado: true,
        usuario: {
          select: {
            id: true,
            nombrecompleto: true,
          },
        },
        clientes: {
          include: {
            cliente: {
              select: {
                id: true,
                codigo: true,
                nombrecompleto: true,
                identificacion: true,
              },
            },
          },
        },
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                categoria: true,
              },
            },
          },
        },
        factura: {
          select: {
            id: true,
            codigo: true,
            total: true,
          },
        },
        solicitudIrc: {
          select: {
            id: true,
            codigo: true,
            tipoSolicitud: true,
            nombreEmpresa: true,
            rnc: true,
            estadoId: true,
            estado: {
              select: {
                id: true,
                nombre: true,
              },
            },
            categoriaIrc: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                precio: true,
              },
            },
            factura: {
              select: {
                id: true,
                total: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    }),
    prisma.formulario.count({ where }),
  ]);

  // Obtener solicitudes IRC sin formulario vinculado (PENDIENTES sin factura)
  const solicitudesIrcSinFormulario = await prisma.solicitudRegistroInspeccion.findMany({
    where: {
      formulario: { is: null }, // No tienen formulario vinculado
    },
    include: {
      estado: true,
      categoriaIrc: true,
      factura: true,
    },
    orderBy: {
      creadoEn: 'desc',
    },
  });

  // Convertir solicitudes IRC a formato compatible con Formulario
  const solicitudesComoFormularios = solicitudesIrcSinFormulario.map((s: any) => ({
    id: s.id,
    codigo: s.codigo,
    fecha: s.creadoEn,
    estadoId: s.estadoId,
    estado: s.estado,
    usuarioId: s.usuarioId,
    usuario: { id: s.usuarioId, nombrecompleto: 'AAU' },
    facturaId: s.facturaId,
    factura: s.factura,
    firma: null,
    observaciones: s.observaciones,
    mensajeDevolucion: s.mensajeDevolucion,
    fechaDevolucion: s.fechaDevolucion,
    montoTotal: s.categoriaIrc?.precio || 0,
    clientes: [],
    productos: [],
    archivos: [],
    solicitudIrc: {
      id: s.id,
      codigo: s.codigo,
      tipoSolicitud: s.tipoSolicitud,
      nombreEmpresa: s.nombreEmpresa,
      rnc: s.rnc,
      estadoId: s.estadoId,
      estado: s.estado,
      categoriaIrc: s.categoriaIrc,
      factura: s.factura,
    },
  }));

  // Combinar ambas listas
  const todosLosFormularios = [...formularios, ...solicitudesComoFormularios];

  // Ordenar por fecha (mas recientes primero)
  todosLosFormularios.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Aplicar paginacion despues de combinar
  const paginados = todosLosFormularios.slice(skip, skip + limit);
  const total = totalFormularios + solicitudesIrcSinFormulario.length;

  res.json({
    data: paginados,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/aau/formularios/devueltos
export const getFormulariosDevueltos = asyncHandler(async (req: Request, res: Response) => {
  // 1. Obtener formularios de OBRAS devueltas
  const estadoDevuelto = await prisma.formularioEstado.findUnique({
    where: { nombre: 'DEVUELTO' },
  });

  const formulariosObras = estadoDevuelto ? await prisma.formulario.findMany({
    where: {
      estadoId: estadoDevuelto.id,
      solicitudIrcId: null, // Solo obras, no IRC
    },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true,
        },
      },
      clientes: {
        include: {
          cliente: {
            select: {
              id: true,
              codigo: true,
              nombrecompleto: true,
              identificacion: true,
            },
          },
        },
      },
      productos: {
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              categoria: true,
            },
          },
        },
      },
    },
  }) : [];

  // 2. Obtener solicitudes IRC devueltas
  const estadoIrcDevuelta = await prisma.estadoSolicitudInspeccion.findUnique({
    where: { nombre: 'DEVUELTA' },
  });

  const solicitudesIrcDevueltas = estadoIrcDevuelta ? await prisma.solicitudRegistroInspeccion.findMany({
    where: {
      estadoId: estadoIrcDevuelta.id,
    },
    include: {
      estado: true,
      categoriaIrc: true,
      factura: true,
    },
  }) : [];

  // 3. Combinar ambos resultados en un formato unificado
  const resultados: any[] = [
    // Formularios de obras devueltas
    ...formulariosObras.map(f => ({
      id: f.id,
      tipo: 'OBRA',
      codigo: f.codigo,
      fecha: f.fecha,
      estado: f.estado.nombre,
      clienteNombre: f.clientes[0]?.cliente.nombrecompleto || 'Sin cliente',
      categoria: f.productos[0]?.producto.categoria || 'Sin categoría',
      mensajeDevolucion: f.mensajeDevolucion,
      fechaDevolucion: f.fechaDevolucion,
      formularioId: f.id,
      solicitudIrcId: null,
    })),
    // Solicitudes IRC devueltas
    ...solicitudesIrcDevueltas.map((s: any) => ({
      id: s.id,
      tipo: 'IRC',
      codigo: s.codigo,
      fecha: s.fechaRecepcion || s.creadoEn || new Date(),
      estado: s.estado.nombre,
      clienteNombre: s.nombreEmpresa || 'Sin nombre',
      categoria: s.categoriaIrc?.nombre || 'IRC',
      mensajeDevolucion: s.mensajeDevolucion,
      fechaDevolucion: s.fechaDevolucion,
      formularioId: null,
      solicitudIrcId: s.id,
    })),
  ];

  // Ordenar por fecha de devolución (más antiguos primero)
  resultados.sort((a, b) => {
    const fechaA = a.fechaDevolucion ? new Date(a.fechaDevolucion).getTime() : 0;
    const fechaB = b.fechaDevolucion ? new Date(b.fechaDevolucion).getTime() : 0;
    return fechaA - fechaB;
  });

  res.json({ data: resultados });
});

// GET /api/aau/formularios/en-revision
export const getFormulariosEnRevision = asyncHandler(async (req: Request, res: Response) => {
  const estadoEnRevision = await prisma.formularioEstado.findUnique({
    where: { nombre: 'EN_REVISION_REGISTRO' },
  });

  if (!estadoEnRevision) {
    return res.json({ data: [] });
  }

  const formularios = await prisma.formulario.findMany({
    where: {
      estadoId: estadoEnRevision.id,
    },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true,
        },
      },
      clientes: {
        include: {
          cliente: {
            select: {
              id: true,
              codigo: true,
              nombrecompleto: true,
              identificacion: true,
            },
          },
        },
      },
      productos: {
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              categoria: true,
            },
          },
        },
      },
    },
    orderBy: {
      fecha: 'desc',
    },
  });

  res.json({ data: formularios });
});

// GET /api/aau/formularios/pendientes-entrega
// Retorna TODAS las solicitudes (obras e IRC) listas para entrega
export const getCertificadosPendientes = asyncHandler(async (req: Request, res: Response) => {
  // 1. Obtener formularios de OBRAS certificadas (listas para entrega)
  const estadoCertificado = await prisma.formularioEstado.findUnique({
    where: { nombre: 'CERTIFICADO' },
  });

  const formulariosObras = estadoCertificado ? await prisma.formulario.findMany({
    where: {
      estadoId: estadoCertificado.id,
      solicitudIrcId: null, // Solo obras
    },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true,
        },
      },
      clientes: {
        include: {
          cliente: {
            select: {
              id: true,
              codigo: true,
              nombrecompleto: true,
              identificacion: true,
              telefono: true,
              movil: true,
            },
          },
        },
      },
      productos: {
        include: {
          producto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              categoria: true,
            },
          },
          // Incluir el registro asociado para obtener el certificado firmado
          registros: {
            select: {
              id: true,
              numeroRegistro: true,
              certificadoFirmado: true,
              certificadoGenerado: true,
              fechaGeneracionCert: true,
            },
            where: {
              certificadoFirmado: { not: null }
            },
            take: 1
          }
        },
      },
      certificados: {
        select: {
          id: true,
          codigo: true,
          fechaEmision: true,
        },
      },
    },
  }) : [];

  // 2. Obtener solicitudes IRC con certificados cargados (listas para entrega)
  const estadoIrcCertificadoCargado = await prisma.estadoSolicitudInspeccion.findUnique({
    where: { nombre: 'CERTIFICADO_CARGADO' },
  });

  const solicitudesIrcListas = estadoIrcCertificadoCargado ? await prisma.solicitudRegistroInspeccion.findMany({
    where: {
      estadoId: estadoIrcCertificadoCargado.id,
    },
    include: {
      estado: true,
      categoriaIrc: true,
      factura: true,
      certificado: {
        select: {
          id: true,
          numeroCertificado: true,
          numeroRegistro: true,
          fechaEmision: true,
          rutaPdf: true,
          rutaPdfFirmado: true,
        }
      },
      empresa: {
        select: {
          nombreEmpresa: true,
          rnc: true,
        }
      },
    },
  }) : [];

  // 3. Combinar ambos resultados en formato unificado
  const resultados: any[] = [
    // Certificados de obras
    ...formulariosObras.map(f => {
      const registro = f.productos[0]?.registros?.[0];
      return {
        id: f.id,
        tipo: 'OBRA',
        codigo: f.codigo,
        fecha: f.fecha,
        estado: f.estado.nombre,
        clienteNombre: f.clientes[0]?.cliente.nombrecompleto || 'Sin cliente',
        clienteTelefono: f.clientes[0]?.cliente.telefono || f.clientes[0]?.cliente.movil || 'Sin teléfono',
        categoria: f.productos[0]?.producto.categoria || 'Sin categoría',
        certificadoCodigo: registro?.numeroRegistro || f.certificados[0]?.codigo || null,
        certificadoFecha: registro?.fechaGeneracionCert || f.certificados[0]?.fechaEmision || null,
        certificadoPdfUrl: registro?.certificadoFirmado || null,
        formularioId: f.id,
        solicitudIrcId: null,
      };
    }),
    // Certificados IRC
    ...solicitudesIrcListas.map((s: any) => ({
      id: s.id,
      tipo: 'IRC',
      codigo: s.codigo,
      fecha: s.fechaRecepcion || s.creadoEn || new Date(),
      estado: s.estado.nombre,
      clienteNombre: s.empresa?.nombreEmpresa || s.nombreEmpresa || 'Sin nombre',
      clienteTelefono: 'Ver empresa',
      categoria: s.categoriaIrc?.nombre || 'IRC',
      certificadoCodigo: s.certificado?.numeroCertificado || 'Certificado cargado',
      certificadoFecha: s.certificado?.fechaEmision || null,
      certificadoPdfUrl: s.certificado?.rutaPdfFirmado || s.certificado?.rutaPdf || null,
      formularioId: null,
      solicitudIrcId: s.id,
    })),
  ];

  // Ordenar por fecha (más recientes primero)
  resultados.sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();
    return fechaB - fechaA;
  });

  res.json({ data: resultados });
});

// POST /api/aau/formularios/:id/enviar-registro
export const enviarARegistro = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const formulario = await prisma.formulario.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true },
  });

  if (!formulario) {
    return res.status(404).json({ message: 'Formulario no encontrado' });
  }

  // Solo se puede enviar si está PAGADO
  if (formulario.estado.nombre !== 'PAGADO') {
    return res.status(400).json({
      message: 'Solo se pueden enviar formularios en estado PAGADO',
    });
  }

  const estadoEnRevision = await prisma.formularioEstado.findUnique({
    where: { nombre: 'EN_REVISION_REGISTRO' },
  });

  if (!estadoEnRevision) {
    return res.status(500).json({ message: 'Estado EN_REVISION_REGISTRO no encontrado' });
  }

  const formularioActualizado = await prisma.formulario.update({
    where: { id: parseInt(id) },
    data: {
      estadoId: estadoEnRevision.id,
    },
    include: {
      estado: true,
    },
  });

  res.json({
    message: 'Formulario enviado a Registro exitosamente',
    data: formularioActualizado,
  });
});

// POST /api/aau/formularios/:id/corregir-reenviar
export const corregirYReenviar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const datosCorreccion = req.body;

  const formulario = await prisma.formulario.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true },
  });

  if (!formulario) {
    return res.status(404).json({ message: 'Formulario no encontrado' });
  }

  // Solo se puede corregir si está DEVUELTO
  if (formulario.estado.nombre !== 'DEVUELTO') {
    return res.status(400).json({
      message: 'Solo se pueden corregir formularios en estado DEVUELTO',
    });
  }

  const estadoEnRevision = await prisma.formularioEstado.findUnique({
    where: { nombre: 'EN_REVISION_REGISTRO' },
  });

  if (!estadoEnRevision) {
    return res.status(500).json({ message: 'Estado EN_REVISION_REGISTRO no encontrado' });
  }

  // Actualizar formulario con correcciones y cambiar estado
  const formularioActualizado = await prisma.formulario.update({
    where: { id: parseInt(id) },
    data: {
      ...datosCorreccion,
      estadoId: estadoEnRevision.id,
      mensajeDevolucion: null, // Limpiar mensaje de devolución
      fechaDevolucion: null,
    },
    include: {
      estado: true,
      clientes: {
        include: {
          cliente: true,
        },
      },
      productos: {
        include: {
          producto: true,
        },
      },
    },
  });

  // TODO: Registrar en historial (Fase 2)

  res.json({
    message: 'Formulario corregido y reenviado a Registro exitosamente',
    data: formularioActualizado,
  });
});

// POST /api/aau/formularios/:id/entregar
export const registrarEntrega = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firmaCliente } = req.body;

  const formulario = await prisma.formulario.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true },
  });

  if (!formulario) {
    return res.status(404).json({ message: 'Formulario no encontrado' });
  }

  // Solo se puede entregar si está CERTIFICADO
  if (formulario.estado.nombre !== 'CERTIFICADO') {
    return res.status(400).json({
      message: 'Solo se pueden entregar formularios en estado CERTIFICADO',
    });
  }

  const estadoEntregado = await prisma.formularioEstado.findUnique({
    where: { nombre: 'ENTREGADO' },
  });

  if (!estadoEntregado) {
    return res.status(500).json({ message: 'Estado ENTREGADO no encontrado' });
  }

  const formularioActualizado = await prisma.formulario.update({
    where: { id: parseInt(id) },
    data: {
      estadoId: estadoEntregado.id,
      fechaEntrega: new Date(),
      // Opcional: Guardar firma del cliente si se proporciona
      ...(firmaCliente && { observaciones: `Firma del cliente: ${firmaCliente}` }),
    },
    include: {
      estado: true,
    },
  });

  res.json({
    message: 'Entrega registrada exitosamente',
    data: formularioActualizado,
  });
});

// POST /api/aau/certificados/:id/entregar
// Endpoint unificado que maneja entrega de OBRAS e IRC
export const entregarCertificado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipo, nombreReceptor, cedulaReceptor, esRepresentante } = req.body;
  const file = (req as any).file; // Documento legal si es representante

  if (!tipo || !['OBRA', 'IRC'].includes(tipo)) {
    return res.status(400).json({
      message: 'Tipo de certificado inválido. Debe ser OBRA o IRC',
    });
  }

  // Validar datos de entrega si se proporcionan
  if (nombreReceptor && !cedulaReceptor) {
    return res.status(400).json({
      message: 'Debe proporcionar la cédula del receptor',
    });
  }

  if (esRepresentante === 'true' && !file) {
    return res.status(400).json({
      message: 'Debe adjuntar el documento legal del representante',
    });
  }

  // Guardar solo el nombre del archivo, no la ruta completa
  const rutaDocumento = file ? `/uploads/documentos-legales/${file.filename}` : null;

  if (tipo === 'OBRA') {
    // Manejar entrega de obra
    const formulario = await prisma.formulario.findUnique({
      where: { id: parseInt(id) },
      include: {
        estado: true,
        clientes: {
          include: {
            cliente: true,
          },
        },
        productos: {
          include: {
            producto: true,
            registros: {
              where: {
                certificadoFirmado: { not: null },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!formulario) {
      return res.status(404).json({ message: 'Formulario no encontrado' });
    }

    // Solo se puede entregar si está CERTIFICADO
    if (formulario.estado.nombre !== 'CERTIFICADO') {
      return res.status(400).json({
        message: 'Solo se pueden entregar formularios en estado CERTIFICADO',
      });
    }

    const estadoEntregado = await prisma.formularioEstado.findUnique({
      where: { nombre: 'ENTREGADO' },
    });

    if (!estadoEntregado) {
      return res.status(500).json({ message: 'Estado ENTREGADO no encontrado' });
    }

    // Obtener datos para el historial
    const registro = formulario.productos[0]?.registros?.[0];
    const cliente = formulario.clientes[0]?.cliente;
    const producto = formulario.productos[0]?.producto;

    // Usar transacción para actualizar formulario y crear registro de entrega
    const [formularioActualizado] = await prisma.$transaction([
      prisma.formulario.update({
        where: { id: parseInt(id) },
        data: {
          estadoId: estadoEntregado.id,
          fechaEntrega: new Date(),
        },
        include: {
          estado: true,
        },
      }),
      prisma.historialEntrega.create({
        data: {
          tipo: 'OBRA',
          formularioId: parseInt(id),
          certificadoCodigo: formulario.codigo,
          numeroRegistro: registro?.numeroRegistro || null,
          clienteNombre: cliente?.nombrecompleto || 'Sin cliente',
          clienteTelefono: cliente?.telefono || cliente?.movil || null,
          categoria: producto?.categoria || 'Sin categoría',
          usuarioEntregaId: (req as any).usuario.id, // Usuario autenticado
          nombreReceptor: nombreReceptor || null,
          cedulaReceptor: cedulaReceptor || null,
          esRepresentante: esRepresentante === 'true',
          rutaDocumentoLegal: rutaDocumento,
        },
      }),
    ]);

    return res.json({
      message: 'Certificado de obra entregado exitosamente',
      data: formularioActualizado,
    });
  } else {
    // Manejar entrega de IRC
    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: parseInt(id) },
      include: {
        estado: true,
        categoriaIrc: true,
        empresa: true,
      },
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud IRC no encontrada' });
    }

    // Debe estar en estado CERTIFICADO_CARGADO (estado 8)
    if (solicitud.estado.nombre !== 'CERTIFICADO_CARGADO') {
      return res.status(400).json({
        message: 'Solo se pueden entregar certificados IRC en estado CERTIFICADO_CARGADO',
      });
    }

    const estadoEntregada = await prisma.estadoSolicitudInspeccion.findUnique({
      where: { nombre: 'ENTREGADA' },
    });

    if (!estadoEntregada) {
      return res.status(500).json({ message: 'Estado ENTREGADA no encontrado' });
    }

    // Usar transacción para actualizar solicitud IRC, empresa y crear historial
    const fechaRegistro = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1); // 1 año de vigencia

    // DEBUG: Mostrar valores antes de insertar
    console.log('Datos para historial entrega:', {
      certificadoCodigo: solicitud.numeroRegistro || solicitud.codigo,
      numeroRegistro: solicitud.numeroRegistro,
      clienteNombre: solicitud.empresa?.nombreEmpresa || solicitud.nombreEmpresa || 'Sin empresa',
      clienteTelefono: solicitud.empresa?.telefono,
      categoria: solicitud.categoriaIrc.nombre,
      nombreReceptor,
      cedulaReceptor,
      esRepresentante,
      rutaDocumento,
    });

    const operaciones: any[] = [
      // Actualizar solicitud IRC
      prisma.solicitudRegistroInspeccion.update({
        where: { id: parseInt(id) },
        data: {
          estadoId: estadoEntregada.id,
          fechaEntrega: new Date(),
        },
        include: {
          estado: true,
          categoriaIrc: true,
        },
      }),
      // Crear registro en historial
      prisma.historialEntrega.create({
        data: {
          tipo: 'IRC',
          solicitudIrcId: parseInt(id),
          certificadoCodigo: solicitud.numeroRegistro || solicitud.codigo,
          numeroRegistro: solicitud.numeroRegistro || null,
          clienteNombre: solicitud.empresa?.nombreEmpresa || solicitud.nombreEmpresa || 'Sin empresa',
          clienteTelefono: solicitud.empresa?.telefono || null,
          categoria: solicitud.categoriaIrc.nombre,
          usuarioEntregaId: (req as any).usuario.id, // Usuario autenticado
          nombreReceptor: nombreReceptor || null,
          cedulaReceptor: cedulaReceptor || null,
          esRepresentante: esRepresentante === 'true',
          rutaDocumentoLegal: rutaDocumento,
        },
      }),
    ];

    // Si tiene empresa asociada, actualizar fechas
    if (solicitud.empresaId) {
      operaciones.push(
        prisma.empresaInspeccionada.update({
          where: { id: solicitud.empresaId },
          data: {
            registrado: true,
            fechaRegistro,
            fechaVencimiento,
          },
        })
      );
    }

    const [solicitudActualizada] = await prisma.$transaction(operaciones);

    return res.json({
      message: 'Certificado IRC entregado exitosamente',
      data: solicitudActualizada,
    });
  }
});

// GET /api/aau/historial-entregas
// Obtener historial completo de entregas de certificados
export const getHistorialEntregas = asyncHandler(async (req: Request, res: Response) => {
  const { tipo, fechaDesde, fechaHasta, page = '1', limit = '50' } = req.query;

  const where: any = {};

  // Filtrar por tipo si se especifica
  if (tipo && (tipo === 'OBRA' || tipo === 'IRC')) {
    where.tipo = tipo;
  }

  // Filtrar por rango de fechas
  if (fechaDesde || fechaHasta) {
    where.fechaEntrega = {};
    if (fechaDesde) {
      where.fechaEntrega.gte = new Date(fechaDesde as string);
    }
    if (fechaHasta) {
      where.fechaEntrega.lte = new Date(fechaHasta as string);
    }
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [entregas, total] = await Promise.all([
    prisma.historialEntrega.findMany({
      where,
      include: {
        usuarioEntrega: {
          select: {
            id: true,
            nombrecompleto: true,
            codigo: true,
          },
        },
        formulario: {
          select: {
            id: true,
            codigo: true,
          },
        },
        solicitudIrc: {
          select: {
            id: true,
            codigo: true,
          },
        },
      },
      orderBy: {
        fechaEntrega: 'desc',
      },
      skip,
      take: limitNum,
    }),
    prisma.historialEntrega.count({ where }),
  ]);

  res.json({
    data: entregas,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/aau/solicitudes-irc/:id/corregir-reenviar
// Corregir y reenviar solicitud IRC devuelta
export const corregirYReenviarIRC = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { datosCorregidos, comentarioCorreccion } = req.body;

  // Validar datos corregidos
  if (!datosCorregidos) {
    return res.status(400).json({ message: 'Se requieren los datos corregidos' });
  }

  const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
    where: { id: parseInt(id) },
    include: { estado: true, empresa: true },
  });

  if (!solicitud) {
    return res.status(404).json({ message: 'Solicitud IRC no encontrada' });
  }

  // Solo se puede corregir si está DEVUELTA
  if (solicitud.estado.nombre !== 'DEVUELTA') {
    return res.status(400).json({
      message: 'Solo se pueden corregir solicitudes en estado DEVUELTA',
    });
  }

  // Validar campos requeridos
  const camposRequeridos = ['nombreEmpresa', 'rnc', 'telefono', 'correoElectronico', 'direccion', 'descripcionActividades'];
  for (const campo of camposRequeridos) {
    if (!datosCorregidos[campo] || datosCorregidos[campo].trim() === '') {
      return res.status(400).json({ message: `El campo ${campo} es requerido` });
    }
  }

  const estadoEnRevision = await prisma.estadoSolicitudInspeccion.findUnique({
    where: { nombre: 'EN_REVISION' },
  });

  if (!estadoEnRevision) {
    return res.status(500).json({ message: 'Estado EN_REVISION no encontrado' });
  }

  // Actualizar empresa con los datos corregidos que pertenecen a ese modelo
  if (solicitud.empresaId && datosCorregidos) {
    const provinciaId = datosCorregidos.provinciaId ? parseInt(datosCorregidos.provinciaId) : null;

    const updateData: any = {
      rnc: datosCorregidos.rnc.trim(),
      nombreEmpresa: datosCorregidos.nombreEmpresa.trim(),
      nombreComercial: datosCorregidos.nombreComercial?.trim() || null,
      direccion: datosCorregidos.direccion.trim(),
      telefono: datosCorregidos.telefono.trim(),
      email: datosCorregidos.correoElectronico.trim(),
      paginaWeb: datosCorregidos.paginaWeb?.trim() || null,
      descripcionActividades: datosCorregidos.descripcionActividades.trim(),
      nombrePropietario: datosCorregidos.nombrePropietario?.trim() || null,
      cedulaPropietario: datosCorregidos.cedulaPropietario?.trim() || null,
      tipoPersona: datosCorregidos.tipoPersona || 'MORAL',
      personaContacto: datosCorregidos.personaContacto?.trim() || null,
      fax: datosCorregidos.fax?.trim() || null,
      comentario: JSON.stringify({
        observaciones: datosCorregidos.observaciones?.trim() || '',
        sector: datosCorregidos.sector?.trim() || '',
        telefonoSecundario: datosCorregidos.telefonoSecundario?.trim() || '',
        telefonoAdicional: datosCorregidos.telefonoAdicional?.trim() || '',
        celular: datosCorregidos.celular?.trim() || '',
        cantidadEmpleados: datosCorregidos.cantidadEmpleados || '',
        fechaConstitucion: datosCorregidos.fechaConstitucion || '',
        fechaInicioOperaciones: datosCorregidos.fechaInicioOperaciones || '',
        tipoNegocio: datosCorregidos.tipoNegocio?.trim() || '',
      }),
    };

    // Solo actualizar provincia si se proporcionó un ID válido
    if (provinciaId && provinciaId > 0) {
      updateData.provincia = {
        connect: { id: provinciaId }
      };
    }

    await prisma.empresaInspeccionada.update({
      where: { id: solicitud.empresaId },
      data: updateData,
    });

    // Actualizar Consejo de Administración (solo para Persona Moral)
    if (datosCorregidos.tipoPersona === 'MORAL' && datosCorregidos.consejoAdministracion) {
      // Eliminar miembros anteriores
      await prisma.consejoAdministracion.deleteMany({
        where: { empresaId: solicitud.empresaId }
      });

      // Crear nuevos miembros
      if (Array.isArray(datosCorregidos.consejoAdministracion)) {
        for (const miembro of datosCorregidos.consejoAdministracion) {
          await prisma.consejoAdministracion.create({
            data: {
              empresaId: solicitud.empresaId,
              cargo: miembro.cargo || 'MIEMBRO',
              nombre: miembro.nombre,
              cedula: miembro.cedula,
            }
          });
        }
      }
    }

    // Actualizar Principales Clientes
    if (datosCorregidos.principalesClientes) {
      // Eliminar clientes anteriores
      await prisma.clienteEmpresa.deleteMany({
        where: { empresaId: solicitud.empresaId }
      });

      // Crear nuevos clientes
      if (Array.isArray(datosCorregidos.principalesClientes)) {
        for (let i = 0; i < datosCorregidos.principalesClientes.length; i++) {
          const cliente = datosCorregidos.principalesClientes[i];
          if (cliente && cliente.trim()) {
            await prisma.clienteEmpresa.create({
              data: {
                empresaId: solicitud.empresaId,
                nombreCliente: cliente.trim(),
                orden: i + 1
              }
            });
          }
        }
      }
    }
  }

  // Actualizar solicitud y cambiar estado
  const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
    where: { id: parseInt(id) },
    data: {
      estadoId: estadoEnRevision.id,
      mensajeDevolucion: null, // Limpiar mensaje de devolución
      fechaDevolucion: null,
      observaciones: comentarioCorreccion || 'Solicitud corregida y reenviada desde AAU',
    },
    include: {
      estado: true,
      empresa: true,
      categoriaIrc: true,
    },
  });

  res.json({
    message: 'Solicitud corregida y reenviada a Inspectoría exitosamente',
    data: solicitudActualizada,
  });
});

// POST /api/aau/formularios-irc
// Crear formulario IRC desde AaU (CON generación automática de factura)
export const crearFormularioIRC = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Parsear JSON si viene de FormData
  const tipoSolicitud = req.body.tipoSolicitud;
  const empresaId = req.body.empresaId ? parseInt(req.body.empresaId) : null;
  const empresaData = req.body.empresaData ? JSON.parse(req.body.empresaData) : null;
  const empresaDataActualizada = req.body.empresaDataActualizada ? JSON.parse(req.body.empresaDataActualizada) : null;
  const clienteId = req.body.clienteId ? parseInt(req.body.clienteId) : null;

  // Obtener archivos adjuntos
  const archivos = req.files as Express.Multer.File[];

  // Validar tipo de solicitud
  if (!tipoSolicitud || !['REGISTRO_NUEVO', 'RENOVACION'].includes(tipoSolicitud)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de solicitud inválido'
    });
  }

  // Para renovación debe existir empresaId
  if (tipoSolicitud === 'RENOVACION' && !empresaId) {
    return res.status(400).json({
      success: false,
      message: 'Para renovación debe proporcionar el ID de la empresa'
    });
  }

  // Para registro nuevo debe existir empresaData
  if (tipoSolicitud === 'REGISTRO_NUEVO' && !empresaData) {
    return res.status(400).json({
      success: false,
      message: 'Para registro nuevo debe proporcionar los datos de la empresa'
    });
  }

  try {
    let empresaIdFinal = empresaId;
    let clienteIdFinal: number;

    // Si es registro nuevo, verificar si la empresa ya existe o crearla
    if (tipoSolicitud === 'REGISTRO_NUEVO') {
      const rncLimpio = empresaData.rnc.replace(/-/g, '');

      // Verificar si la empresa ya existe por RNC
      const empresaExistente = await prisma.empresaInspeccionada.findUnique({
        where: { rnc: rncLimpio }
      });

      if (empresaExistente) {
        // Si ya existe, usar esa empresa
        empresaIdFinal = empresaExistente.id;
      } else {
        // Si no existe, crearla
        const empresaCreada = await prisma.empresaInspeccionada.create({
        data: {
          nombreEmpresa: empresaData.nombreEmpresa,
          nombreComercial: empresaData.nombreComercial,
          rnc: empresaData.rnc.replace(/-/g, ''),
          direccion: empresaData.direccion,
          telefono: empresaData.telefono || '',
          email: empresaData.correoElectronico || '',
          paginaWeb: empresaData.paginaWeb,
          categoriaIrcId: empresaData.categoriaIrcId,
          tipoPersona: empresaData.tipoPersona,
          nombrePropietario: empresaData.nombrePropietario,
          cedulaPropietario: empresaData.cedulaPropietario,
          descripcionActividades: empresaData.descripcionActividades,
          provinciaId: empresaData.provinciaId,
          statusId: 1,
          estadoJuridicoId: 1,
          conclusionId: 1,
          statusExternoId: 8,
          registrado: false,
          existeEnSistema: true,
          comentario: empresaData.observaciones,
          creadoPorId: 1,
          consejoAdministracion: {
            create: (empresaData.consejoAdministracion || []).map((m: any) => ({
              nombreCompleto: m.nombreCompleto,
              cargo: m.cargo,
              cedula: m.cedula,
              domicilio: m.domicilio,
              telefono: m.telefono,
              celular: m.celular,
              email: m.email
            }))
          },
          principalesClientes: {
            create: (empresaData.principalesClientes || []).map((c: any, index: number) => ({
              nombreCliente: c.nombreCliente,
              orden: index + 1
            }))
          }
        }
        });
        empresaIdFinal = empresaCreada.id;

        // Guardar documentos adjuntos
        if (archivos && archivos.length > 0) {
          for (const archivo of archivos) {
            await prisma.documentoEmpresa.create({
              data: {
                empresaId: empresaCreada.id,
                tipoDocumento: 'SOPORTE', // Tipo genérico para documentos de soporte
                nombreArchivo: archivo.originalname,
                rutaArchivo: `/uploads/${path.basename(path.dirname(archivo.path))}/${archivo.filename}`,
                tamano: archivo.size,
                mimeType: archivo.mimetype,
                cargadoPorId: req.usuario?.id || 1
              }
            });
          }
        }
      }
    } else if (empresaDataActualizada) {
      // Si es renovación y hay datos actualizados, actualizar empresa
      await prisma.empresaInspeccionada.update({
        where: { id: empresaId },
        data: {
          nombreComercial: empresaDataActualizada.nombreComercial,
          direccion: empresaDataActualizada.direccion,
          telefono: empresaDataActualizada.telefono,
          email: empresaDataActualizada.correoElectronico,
          descripcionActividades: empresaDataActualizada.descripcionActividades,
          comentario: empresaDataActualizada.observaciones
        }
      });
    }

    // Generar código de solicitud
    const year = new Date().getFullYear();
    const prefix = `SOL-IRC-${year}-`;
    const ultimaSolicitud = await prisma.solicitudRegistroInspeccion.findFirst({
      where: { codigo: { startsWith: prefix } },
      orderBy: { codigo: 'desc' }
    });
    let numero = 1;
    if (ultimaSolicitud) {
      const ultimoNumero = parseInt(ultimaSolicitud.codigo.split('-').pop() || '0');
      numero = ultimoNumero + 1;
    }
    const codigo = `${prefix}${numero.toString().padStart(4, '0')}`;

    // Obtener datos de la empresa
    const empresa = await prisma.empresaInspeccionada.findUnique({
      where: { id: empresaIdFinal },
      include: { categoriaIrc: true }
    });

    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    // Buscar cliente existente por RNC o identificación
    const identificacionBusqueda = empresa.tipoPersona === 'FISICA' && empresa.cedulaPropietario
      ? empresa.cedulaPropietario
      : empresa.rnc;

    let cliente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { rnc: empresa.rnc },
          { identificacion: identificacionBusqueda }
        ]
      }
    });

    if (!cliente) {
      const tipoIdentificacion = empresa.tipoPersona === 'FISICA' ? 'Cedula' : 'RNC';
      const countClientes = await prisma.cliente.count();
      const numeroCliente = (countClientes + 1).toString().padStart(6, '0');
      const codigoCliente = `CLI-${numeroCliente}`;

      cliente = await prisma.cliente.create({
        data: {
          codigo: codigoCliente,
          identificacion: identificacionBusqueda,
          tipoIdentificacion,
          nombre: empresa.nombreEmpresa,
          nombrecompleto: empresa.nombreEmpresa,
          telefono: empresa.telefono || '',
          direccion: empresa.direccion || '',
          correo: empresa.email || '',
          rnc: empresa.rnc,
          tipoId: 1,
          nacionalidadId: 1
        }
      });
    }

    clienteIdFinal = cliente.id;

    // Verificar que haya una caja abierta
    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        estadoId: 1, // Abierta
        horaCierre: null
      }
    });

    if (!cajaAbierta) {
      return res.status(400).json({
        success: false,
        message: 'No hay una caja abierta. Debe abrir una caja primero.'
      });
    }

    // Obtener estado "Abierta" para la factura
    const estadoFacturaAbierta = await prisma.facturaEstado.findFirst({
      where: { nombre: 'Abierta' }
    });

    if (!estadoFacturaAbierta) {
      throw new Error('Estado Abierta no configurado para facturas');
    }

    // Generar código de factura
    const ultimaFactura = await prisma.factura.findFirst({
      orderBy: { id: 'desc' }
    });
    const numeroFactura = ultimaFactura ? ultimaFactura.id + 1 : 1;
    const codigoFactura = `FAC-${year}-${numeroFactura.toString().padStart(6, '0')}`;

    // Calcular totales basados en el precio de la categoría IRC
    // IRC NO lleva ITBIS
    const precioCategoria = Number(empresa.categoriaIrc.precio);
    const subtotal = precioCategoria;
    const itbis = 0; // IRC sin ITBIS
    const total = subtotal;

    // Obtener estado inicial del formulario
    const estadoFormulario = await prisma.formularioEstado.findFirst({
      where: { nombre: 'PENDIENTE_PAGO' }
    });

    if (!estadoFormulario) {
      return res.status(500).json({
        success: false,
        message: 'Estado PENDIENTE_PAGO no encontrado en formularios'
      });
    }

    // Crear todo en una transacción: Solicitud IRC -> Formulario -> Factura
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear solicitud IRC primero
      const solicitud = await tx.solicitudRegistroInspeccion.create({
        data: {
          codigo,
          empresaId: empresaIdFinal,
          tipoSolicitud,
          rnc: empresa.rnc,
          nombreEmpresa: empresa.nombreEmpresa,
          nombreComercial: empresa.nombreComercial,
          categoriaIrcId: empresa.categoriaIrcId,
          estadoId: 1, // PENDIENTE
          recibidoPorId: 1,
          fechaRecepcion: new Date()
        }
      });

      // 2. Crear factura en estado ABIERTA
      const factura = await tx.factura.create({
        data: {
          codigo: codigoFactura,
          ncf: null, // Sin NCF inicialmente
          rnc: null,
          fecha: new Date(),
          subtotal,
          itbis,
          descuento: 0,
          total,
          pagado: 0,
          metodoPago: null,
          fechaPago: null,
          referenciaPago: null,
          observaciones: `Solicitud IRC: ${empresa.nombreEmpresa} - ${empresa.categoriaIrc.nombre}`,
          estadoId: estadoFacturaAbierta.id,
          clienteId: clienteIdFinal,
          cajaId: cajaAbierta.id
        }
      });

      // 3. Crear item de factura
      await tx.facturaItem.create({
        data: {
          facturaId: factura.id,
          concepto: `${empresa.categoriaIrc.nombre} - ${empresa.categoriaIrc.codigo}`,
          cantidad: 1,
          precioUnitario: precioCategoria,
          itbis,
          subtotal,
          total
        }
      });

      // 4. Actualizar solicitud IRC con la factura
      await tx.solicitudRegistroInspeccion.update({
        where: { id: solicitud.id },
        data: { facturaId: factura.id }
      });

      // 5. Crear formulario vinculado a la solicitud IRC y factura
      const formulario = await tx.formulario.create({
        data: {
          codigo: codigo,
          fecha: new Date(),
          usuarioId: req.usuario?.id!,
          estadoId: estadoFormulario.id,
          esProduccion: false,
          solicitudIrcId: solicitud.id,
          facturaId: factura.id
        }
      });

      // 6. Retornar solicitud con todas sus relaciones
      const solicitudCompleta = await tx.solicitudRegistroInspeccion.findUnique({
        where: { id: solicitud.id },
        include: {
          empresa: {
            include: {
              categoriaIrc: true,
              provincia: true
            }
          },
          categoriaIrc: true,
          estado: true,
          formulario: true,
          factura: {
            include: {
              estado: true,
              items: true
            }
          }
        }
      });

      return solicitudCompleta;
    });

    res.status(201).json({
      success: true,
      message: 'Formulario IRC creado exitosamente. El cliente debe ir a Caja para pagar.',
      data: resultado
    });
  } catch (error: any) {
    console.error('Error creando formulario IRC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear formulario IRC',
      error: error.message
    });
  }
});
