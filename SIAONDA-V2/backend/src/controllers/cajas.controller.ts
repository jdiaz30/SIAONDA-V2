import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { format } from 'date-fns';
import { generarReporteCierreCaja } from '../services/reporteCierreCaja.service';

// Schema de validación para abrir caja
const abrirCajaSchema = z.object({
  descripcion: z.string().min(1),
  observaciones: z.string().optional(),
  esGratuita: z.boolean().optional().default(false),
  motivoGratuito: z.string().optional()
}).refine(
  (data) => {
    // Si es gratuita, debe tener motivo
    if (data.esGratuita && !data.motivoGratuito?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Si la caja es gratuita, debe especificar el motivo",
    path: ["motivoGratuito"]
  }
);

// Schema de validación para cerrar caja (vacío - simplificado como V1)
const cerrarCajaSchema = z.object({});

// Generar código de caja: CAJA-YYYYMMDD-NNNN
// Con protección contra race conditions en concurrencia
const generateCodigoCaja = async (): Promise<string> => {
  const now = new Date();
  const año = now.getFullYear();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const dia = now.getDate().toString().padStart(2, '0');
  const fecha = `${año}${mes}${dia}`;

  // Retry hasta 5 veces si hay colisión
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.caja.count({
      where: {
        fecha: {
          gte: new Date(año, now.getMonth(), now.getDate(), 0, 0, 0),
          lt: new Date(año, now.getMonth(), now.getDate() + 1, 0, 0, 0)
        }
      }
    });

    const numero = (count + 1 + attempt).toString().padStart(4, '0');
    const codigo = `CAJA-${fecha}-${numero}`;

    // Verificar que no exista
    const existe = await prisma.caja.findUnique({
      where: { codigo }
    });

    if (!existe) {
      return codigo;
    }

    // Si existe, esperar un tiempo aleatorio antes de reintentar
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  // Fallback: usar timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `CAJA-${fecha}-${timestamp}`;
};

// GET /api/cajas
export const getCajas = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const estadoId = req.query.estadoId ? parseInt(req.query.estadoId as string) : undefined;
  const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined;
  const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined;

  const where: any = {};

  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: 'insensitive' } },
      { usuario: { nombrecompleto: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (estadoId) {
    where.estadoId = estadoId;
  }

  if (fechaInicio && fechaFin) {
    where.fecha = {
      gte: fechaInicio,
      lte: fechaFin
    };
  }

  const [cajas, total] = await Promise.all([
    prisma.caja.findMany({
      where,
      skip,
      take: limit,
      include: {
        estado: true,
        usuario: {
          select: {
            id: true,
            codigo: true,
            nombrecompleto: true
          }
        },
        _count: {
          select: {
            facturas: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    }),
    prisma.caja.count({ where })
  ]);

  res.json({
    cajas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/cajas/:id
export const getCaja = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const caja = await prisma.caja.findUnique({
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
      facturas: {
        include: {
          estado: true,
          cliente: {
            select: {
              nombrecompleto: true
            }
          },
          items: true
        },
        orderBy: { fecha: 'asc' }
      }
    }
  });

  if (!caja) {
    throw new AppError('Caja no encontrada', 404);
  }

  res.json(caja);
});

// POST /api/cajas/abrir
export const abrirCaja = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = abrirCajaSchema.parse(req.body);

  // Verificar que el usuario no tenga otra caja abierta
  const cajaAbierta = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    }
  });

  if (cajaAbierta) {
    throw new AppError('Ya tienes una caja abierta. Debes cerrarla antes de abrir otra', 400);
  }

  // Estado: Abierta
  const estadoAbierta = await prisma.cajaEstado.findFirst({
    where: { nombre: 'Abierta' }
  });

  if (!estadoAbierta) {
    throw new AppError('Estado Abierta no configurado', 500);
  }

  // Generar código
  const codigo = await generateCodigoCaja();

  // Estado: Cierre Abierto
  const estadoCierreAbierto = await prisma.cierreEstado.findFirst({
    where: { nombre: 'Abierto' }
  });

  if (!estadoCierreAbierto) {
    throw new AppError('Estado de cierre Abierto no configurado', 500);
  }

  // Crear caja Y cierre en transacción (según SIAONDA V1)
  const resultado = await prisma.$transaction(async (tx) => {
    // 1. Crear la caja
    const nuevaCaja = await tx.caja.create({
      data: {
        codigo,
        descripcion: data.descripcion,
        fecha: new Date(),
        horaApertura: new Date(),
        montoInicial: 0, // Siempre inicia en 0
        observaciones: data.observaciones || null,
        esGratuita: data.esGratuita || false,
        motivoGratuito: data.motivoGratuito || null,
        estadoId: estadoAbierta.id,
        usuarioId: req.usuario!.id,
        sucursalId: req.usuario!.sucursalId || null // Hereda sucursal del usuario automáticamente
      }
    });

    // 2. Crear cierre automáticamente (según SIAONDA V1: se crea al abrir caja)
    const cierre = await tx.cierre.create({
      data: {
        cajaId: nuevaCaja.id,
        fechaInicio: new Date(),
        fechaFinal: new Date(), // Se actualiza al cerrar
        estadoId: estadoCierreAbierto.id,
        totalEsperado: 0,
        totalReal: 0,
        diferencia: 0
      }
    });

    return { caja: nuevaCaja, cierre };
  });

  // Obtener caja completa con relaciones
  const cajaCompleta = await prisma.caja.findUnique({
    where: { id: resultado.caja.id },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true
        }
      },
      sucursal: true,
      cierres: true
    }
  });

  res.status(201).json({
    message: 'Caja abierta exitosamente (cierre creado automáticamente)',
    caja: cajaCompleta
  });
});

// POST /api/cajas/:id/cerrar
// Implementación según SIAONDA V1: Crear Cierre y asociar facturas
export const cerrarCaja = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Verificar que la caja existe y pertenece al usuario
  const caja = await prisma.caja.findUnique({
    where: { id },
    include: {
      estado: true,
      cierres: {
        where: {
          estado: {
            nombre: 'Abierto'
          }
        },
        orderBy: { id: 'desc' },
        take: 1
      }
    }
  });

  if (!caja) {
    throw new AppError('Caja no encontrada', 404);
  }

  if (caja.usuarioId !== req.usuario.id) {
    throw new AppError('Esta caja no te pertenece', 403);
  }

  if (caja.estado.nombre !== 'Abierta') {
    throw new AppError('La caja ya está cerrada', 400);
  }

  // Obtener el cierre activo (creado al abrir la caja)
  const cierreActivo = caja.cierres[0];

  if (!cierreActivo) {
    throw new AppError('No se encontró un cierre activo para esta caja', 500);
  }

  // Estados necesarios
  const estadoCajaCerrada = await prisma.cajaEstado.findFirst({
    where: { nombre: 'Cerrada' }
  });

  const estadoCierreCerrado = await prisma.cierreEstado.findFirst({
    where: { nombre: 'Cerrado' }
  });

  if (!estadoCajaCerrada || !estadoCierreCerrado) {
    throw new AppError('Estados no configurados correctamente en la base de datos', 500);
  }

  // Realizar operación de cierre en transacción (simplificado como en V1)
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Cerrar el registro de cierre (actualizar fecha_final y estado)
      await tx.cierre.update({
        where: { id: cierreActivo.id },
        data: {
          fechaFinal: new Date(),
          estadoId: estadoCierreCerrado.id
        }
      });

      // 2. Asociar TODAS las facturas pagadas al cierre
      // UPDATE t_documento SET ID_cierre = X WHERE ID_caja = Y AND ID_cierre = 0
      await tx.factura.updateMany({
        where: {
          cajaId: id,
          OR: [
            { cierreId: 0 },
            { cierreId: null }
          ]
        },
        data: {
          cierreId: cierreActivo.id
        }
      });

      // 3. Cerrar la caja (cambiar estado a Cerrada y liberar usuario)
      const cajaActualizada = await tx.caja.update({
        where: { id },
        data: {
          horaCierre: new Date(),
          estadoId: estadoCajaCerrada.id,
          usuarioId: null
        },
        include: {
          estado: true,
          facturas: {
            include: {
              estado: true,
              cliente: {
                select: {
                  nombrecompleto: true
                }
              }
            }
          }
        }
      });

      return {
        caja: cajaActualizada,
        cierre: cierreActivo
      };
    });

    res.json({
      message: 'Caja cerrada exitosamente',
      caja: resultado.caja,
      cierreId: resultado.cierre.id
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    throw error;
  }
});

// GET /api/cajas/:id/reporte
export const generarReporteCierre = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const caja = await prisma.caja.findUnique({
    where: { id },
    include: {
      estado: true,
      usuario: {
        select: {
          codigo: true,
          nombrecompleto: true
        }
      },
      facturas: {
        where: {
          estado: {
            nombre: 'Pagada'
          }
        },
        include: {
          estado: true,
          cliente: {
            select: {
              nombrecompleto: true,
              identificacion: true
            }
          },
          items: true
        },
        orderBy: { fecha: 'asc' }
      }
    }
  });

  if (!caja) {
    throw new AppError('Caja no encontrada', 404);
  }

  // Agrupar facturas por método de pago
  const porMetodoPago: { [key: string]: { cantidad: number; total: number } } = {};

  caja.facturas.forEach(f => {
    const metodo = f.metodoPago || 'Efectivo';
    if (!porMetodoPago[metodo]) {
      porMetodoPago[metodo] = { cantidad: 0, total: 0 };
    }
    porMetodoPago[metodo].cantidad++;
    porMetodoPago[metodo].total += Number(f.total);
  });

  const reporte = {
    caja: {
      codigo: caja.codigo,
      fecha: format(caja.fecha, 'dd/MM/yyyy'),
      horaApertura: caja.horaApertura ? format(caja.horaApertura, 'HH:mm:ss') : null,
      horaCierre: caja.horaCierre ? format(caja.horaCierre, 'HH:mm:ss') : null,
      estado: caja.estado.nombre
    },
    usuario: caja.usuario,
    montos: {
      montoInicial: Number(caja.montoInicial),
      totalFacturas: Number(caja.totalFacturas || 0),
      montoEsperado: Number(caja.montoInicial) + Number(caja.totalFacturas || 0),
      montoFinal: Number(caja.montoFinal || 0),
      diferencia: Number(caja.diferencia || 0)
    },
    facturas: {
      cantidad: caja.facturas.length,
      detalle: caja.facturas.map(f => ({
        codigo: f.codigo,
        ncf: f.ncf,
        cliente: f.cliente?.nombrecompleto || 'N/A',
        metodoPago: f.metodoPago,
        subtotal: f.subtotal,
        itbis: f.itbis,
        total: f.total,
        hora: format(f.fecha, 'HH:mm:ss')
      }))
    },
    porMetodoPago,
    observaciones: caja.observaciones
  };

  res.json(reporte);
});

// GET /api/cajas/cierre/:id/imprimir
// Generar PDF del reporte de cierre de caja
export const imprimirReporteCierre = asyncHandler(async (req: Request, res: Response) => {
  const cierreId = parseInt(req.params.id);

  if (!cierreId || isNaN(cierreId)) {
    throw new AppError('ID de cierre inválido', 400);
  }

  await generarReporteCierreCaja(cierreId, res);
});

// GET /api/cajas/usuario/activa
export const getCajaActiva = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const caja = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true
        }
      },
      facturas: {
        select: {
          total: true
        }
      },
      _count: {
        select: {
          facturas: true
        }
      }
    }
  });

  if (!caja) {
    res.json(null);
    return;
  }

  // Calcular el total de facturas
  const totalFacturas = caja.facturas.reduce((sum, factura) => {
    return sum + Number(factura.total);
  }, 0);

  // Devolver la caja con el total calculado
  const cajaConTotal = {
    ...caja,
    totalFacturas,
    facturas: undefined // No enviar todas las facturas al frontend, solo el total
  };

  res.json(cajaConTotal);
});

// GET /api/cajas/estados
export const getEstadosCaja = asyncHandler(async (req: Request, res: Response) => {
  const estados = await prisma.cajaEstado.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(estados);
});

// DELETE /api/cajas/:id
export const deleteCaja = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const caja = await prisma.caja.findUnique({
    where: { id },
    include: {
      estado: true,
      facturas: true
    }
  });

  if (!caja) {
    throw new AppError('Caja no encontrada', 404);
  }

  if (caja.facturas.length > 0) {
    throw new AppError('No se puede eliminar una caja que tiene facturas asociadas', 400);
  }

  if (caja.estado.nombre === 'Cerrada') {
    throw new AppError('No se puede eliminar una caja cerrada', 400);
  }

  await prisma.caja.delete({ where: { id } });

  res.json({ message: 'Caja eliminada exitosamente' });
});

// ============================================================================
// FACTURAS MANUALES - Para servicios fuera de AAU
// ============================================================================

// Schema de validación para crear factura manual
const crearFacturaManualSchema = z.object({
  cliente: z.object({
    nombre: z.string().min(1),
    identificacion: z.string().optional(),
    rnc: z.string().optional()
  }),
  items: z.array(z.object({
    concepto: z.string().min(1),
    cantidad: z.number().int().min(1),
    precioUnitario: z.number().min(0)
  })).min(1),
  metodoPago: z.string().min(1),
  referenciaPago: z.string().optional(),
  requiereNCF: z.boolean().optional().default(false),
  observaciones: z.string().optional()
}).refine(
  (data) => {
    // Si requiere NCF, debe tener RNC
    if (data.requiereNCF && !data.cliente.rnc?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Si requiere NCF, debe proporcionar el RNC del cliente",
    path: ["cliente", "rnc"]
  }
);

// POST /api/cajas/factura-manual
// Crear factura manual para servicios como cotizaciones, copias, etc.
export const crearFacturaManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = crearFacturaManualSchema.parse(req.body);

  // Verificar que el usuario tenga una caja abierta
  const cajaActiva = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    }
  });

  if (!cajaActiva) {
    throw new AppError('Debes tener una caja abierta para crear facturas', 400);
  }

  // Generar código de factura
  const generateCodigoFactura = async (): Promise<string> => {
    const now = new Date();
    const año = now.getFullYear();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const dia = now.getDate().toString().padStart(2, '0');
    const fecha = `${año}${mes}${dia}`;

    // Retry hasta 5 veces si hay colisión
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await prisma.factura.count({
        where: {
          fecha: {
            gte: new Date(año, now.getMonth(), now.getDate(), 0, 0, 0),
            lt: new Date(año, now.getMonth(), now.getDate() + 1, 0, 0, 0)
          }
        }
      });

      const numero = (count + 1 + attempt).toString().padStart(4, '0');
      const codigo = `FAC-${fecha}-${numero}`;

      // Verificar que no exista
      const existe = await prisma.factura.findUnique({
        where: { codigo }
      });

      if (!existe) {
        return codigo;
      }

      // Si existe, esperar un tiempo aleatorio antes de reintentar
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    // Fallback: usar timestamp
    const timestamp = Date.now().toString().slice(-4);
    return `FAC-${fecha}-${timestamp}`;
  };

  // Generar NCF si se requiere
  const generateNCF = async (tipoComprobante: string = 'B01'): Promise<string | null> => {
    return await prisma.$transaction(async (tx) => {
      const secuencias = await tx.$queryRaw<any[]>`
        SELECT * FROM "secuencias_ncf"
        WHERE "tipoComprobante" = ${tipoComprobante}
          AND "activo" = true
          AND "fecha_vencimiento" >= NOW()
        ORDER BY "fecha_vencimiento" DESC
        FOR UPDATE
      `;

      let secuenciaDisponible = null;
      for (const sec of secuencias) {
        if (Number(sec.numero_actual) < Number(sec.numero_final)) {
          secuenciaDisponible = sec;
          break;
        }
      }

      if (!secuenciaDisponible) {
        throw new AppError(`No hay secuencias NCF activas disponibles para ${tipoComprobante}`, 400);
      }

      const numeroActual = Number(secuenciaDisponible.numero_actual) + 1;
      const ncf = `${secuenciaDisponible.serie}${secuenciaDisponible.tipoComprobante}${numeroActual.toString().padStart(8, '0')}`;

      await tx.secuenciaNcf.update({
        where: { id: secuenciaDisponible.id },
        data: { numeroActual: BigInt(numeroActual) }
      });

      return ncf;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  };

  const codigo = await generateCodigoFactura();

  let ncf: string | null = null;
  if (data.requiereNCF) {
    ncf = await generateNCF('B01');
  }

  // Calcular totales
  const subtotal = data.items.reduce((sum, item) =>
    sum + (item.precioUnitario * item.cantidad), 0
  );
  const itbis = 0; // ONDA no cobra ITBIS
  const total = subtotal + itbis;

  // Si la caja es gratuita, el total es 0
  const montoFinal = cajaActiva.esGratuita ? 0 : total;

  // Obtener estado Pagada
  const estadoPagada = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pagada' }
  });

  if (!estadoPagada) {
    throw new AppError('Estado Pagada no encontrado', 500);
  }

  // Crear factura en transacción
  const factura = await prisma.factura.create({
    data: {
      codigo,
      ncf,
      rnc: data.cliente.rnc || null,
      fecha: new Date(),
      subtotal: montoFinal,
      itbis: 0,
      descuento: 0,
      total: montoFinal,
      pagado: montoFinal,
      fechaPago: new Date(),
      metodoPago: data.metodoPago,
      referenciaPago: data.referenciaPago || null,
      observaciones: data.observaciones ?
        `Cliente: ${data.cliente.nombre}\nID: ${data.cliente.identificacion || 'N/A'}\n\n${data.observaciones}` :
        `Cliente: ${data.cliente.nombre}\nID: ${data.cliente.identificacion || 'N/A'}`,
      estadoId: estadoPagada.id,
      cajaId: cajaActiva.id,
      cierreId: 0, // Se asociará al cerrar la caja
      clienteId: null, // Factura manual sin cliente registrado
      items: {
        create: data.items.map(item => ({
          concepto: item.concepto,
          cantidad: item.cantidad,
          precioUnitario: cajaActiva.esGratuita ? 0 : item.precioUnitario,
          subtotal: cajaActiva.esGratuita ? 0 : item.precioUnitario * item.cantidad,
          itbis: 0,
          total: cajaActiva.esGratuita ? 0 : item.precioUnitario * item.cantidad
        }))
      }
    },
    include: {
      items: true,
      estado: true,
      caja: {
        select: {
          codigo: true,
          usuario: {
            select: {
              nombrecompleto: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    message: 'Factura manual creada exitosamente',
    factura
  });
});

// ============================================================================
// SOLICITUDES IRC - INTEGRACIÓN CON CAJA
// ============================================================================

// Schema de validación para cobrar solicitud IRC
const cobrarSolicitudSchema = z.object({
  metodoPago: z.string().min(1),
  referencia: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  requiereNCF: z.boolean().optional().default(false),
  rnc: z.string().nullable().optional(),
  anosVigencia: z.number().int().min(1).max(5).optional().default(1) // Años de vigencia (1-5)
});

// GET /api/cajas/solicitudes-pendientes
// Lista de solicitudes IRC (pendientes o pagadas según filtro)
export const getSolicitudesPendientes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const estado = req.query.estado as string; // 'PENDIENTE' | 'PAGADA' | undefined (todas)

  const where: any = {
    AND: []
  };

  // Filtrar por estado si se especifica
  if (estado === 'PENDIENTE') {
    // PENDIENTE = Sin factura (aún no cobrada) O con factura Abierta
    // Mostrar solicitudes con estado PENDIENTE que NO tienen factura o tienen factura sin pagar
    where.AND.push({
      estado: { nombre: 'PENDIENTE' }
    });
    where.AND.push({
      OR: [
        { facturaId: null }, // Sin factura (nuevo flujo desde AaU)
        {
          factura: {
            estado: {
              nombre: 'Abierta' // Con factura pero no pagada (flujo antiguo)
            }
          }
        }
      ]
    });
  } else if (estado === 'PAGADA') {
    // PAGADA = Tiene factura pagada (factura.estado = 'Pagada')
    where.AND.push({
      factura: {
        estado: {
          nombre: 'Pagada'
        }
      }
    });
    where.AND.push({
      estado: { nombre: 'PAGADA' }
    });
  }

  if (search) {
    where.AND.push({
      OR: [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombreEmpresa: { contains: search, mode: 'insensitive' } },
        { rnc: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  // Si no hay filtros, limpiar el AND vacío
  const finalWhere = where.AND.length > 0 ? where : {};

  const [solicitudes, total] = await Promise.all([
    prisma.solicitudRegistroInspeccion.findMany({
      where: finalWhere,
      skip,
      take: limit,
      include: {
        estado: true,
        categoriaIrc: true,
        recibidoPor: {
          select: {
            id: true,
            nombrecompleto: true
          }
        },
        formulario: {
          select: {
            id: true,
            codigo: true
          }
        },
        factura: {
          select: {
            id: true,
            codigo: true,
            ncf: true,
            fecha: true,
            total: true,
            metodoPago: true,
            estado: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: { fechaRecepcion: 'desc' }
    }),
    prisma.solicitudRegistroInspeccion.count({ where: finalWhere })
  ]);

  res.json({
    solicitudes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// POST /api/cajas/cobrar-solicitud/:id
// Registrar pago de una solicitud IRC y generar factura con NCF
export const cobrarSolicitud = asyncHandler(async (req: AuthRequest, res: Response) => {
  const solicitudId = parseInt(req.params.id);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = cobrarSolicitudSchema.parse(req.body);

  // Verificar que la cajera tiene una caja abierta
  const cajaActiva = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    }
  });

  if (!cajaActiva) {
    throw new AppError('Debes tener una caja abierta para registrar pagos', 400);
  }

  // Buscar solicitud con su categoría IRC para obtener el precio
  const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
    where: { id: solicitudId },
    include: {
      categoriaIrc: true,
      factura: true,
      estado: true
    }
  });

  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  if (solicitud.factura) {
    throw new AppError('Esta solicitud ya tiene una factura asociada', 400);
  }

  // Calcular monto (precio de la categoría IRC * años de vigencia)
  // ONDA es una institución sin fines de lucro, no cobra ITBIS
  const anosVigencia = data.anosVigencia || 1;
  const precioAnual = Number(solicitud.categoriaIrc.precio);
  const total = precioAnual * anosVigencia;

  // Generar código de factura
  const generateCodigoFactura = async (): Promise<string> => {
    const now = new Date();
    const año = now.getFullYear();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const dia = now.getDate().toString().padStart(2, '0');
    const fecha = `${año}${mes}${dia}`;

    const count = await prisma.factura.count({
      where: {
        fecha: {
          gte: new Date(año, now.getMonth(), now.getDate(), 0, 0, 0),
          lt: new Date(año, now.getMonth(), now.getDate() + 1, 0, 0, 0)
        }
      }
    });

    const numero = (count + 1).toString().padStart(4, '0');
    return `FAC-${fecha}-${numero}`;
  };

  // Generar NCF
  const generateNCF = async (tipoComprobante: string = 'B02'): Promise<string> => {
    const secuencia = await prisma.secuenciaNcf.findFirst({
      where: {
        tipoComprobante,
        activo: true,
        numeroActual: {
          lt: prisma.secuenciaNcf.fields.numeroFinal
        },
        fechaVencimiento: {
          gte: new Date()
        }
      },
      orderBy: {
        numeroActual: 'asc'
      }
    });

    if (!secuencia) {
      throw new AppError(
        `No hay secuencias NCF disponibles para el tipo ${tipoComprobante}`,
        500
      );
    }

    const siguienteNumero = secuencia.numeroActual + BigInt(1);
    const ncf = `${tipoComprobante}${secuencia.serie}${siguienteNumero.toString().padStart(8, '0')}`;

    await prisma.secuenciaNcf.update({
      where: { id: secuencia.id },
      data: { numeroActual: siguienteNumero }
    });

    return ncf;
  };

  const codigoFactura = await generateCodigoFactura();

  // Solo generar NCF si el cliente lo requiere
  let ncf: string | null = null;
  if (data.requiereNCF) {
    if (!data.rnc) {
      throw new AppError('Se requiere RNC para emitir comprobante fiscal', 400);
    }
    ncf = await generateNCF('B02'); // B02 = Factura de Consumo
  }

  // Buscar estados necesarios
  const estadoFacturaPagada = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pagada' }
  });

  const estadoSolicitudPagada = await prisma.estadoSolicitudInspeccion.findFirst({
    where: { nombre: 'PAGADA' }
  });

  if (!estadoFacturaPagada || !estadoSolicitudPagada) {
    throw new AppError('Estados no configurados en el sistema', 500);
  }

  // Crear factura y actualizar solicitud en transacción
  const resultado = await prisma.$transaction(async (tx) => {
    // Obtener datos de la empresa para la factura
    const empresa = await tx.empresaInspeccionada.findUnique({
      where: { id: solicitud.empresaId! },
      select: {
        nombreEmpresa: true,
        telefono: true,
        email: true
      }
    });

    // Preparar observaciones con datos del cliente
    const observacionesFactura = data.observaciones ||
      `Pago de Solicitud IRC ${solicitud.codigo}\nCliente: ${empresa?.nombreEmpresa || solicitud.nombreEmpresa}\nTel: ${empresa?.telefono || 'N/A'}\nEmail: ${empresa?.email || 'N/A'}`;

    // 1. Crear factura
    const factura = await tx.factura.create({
      data: {
        codigo: codigoFactura,
        ncf: ncf || null,
        rnc: data.rnc || solicitud.rnc,
        fecha: new Date(),
        subtotal: total,
        itbis: 0, // ONDA no cobra ITBIS
        descuento: 0,
        total,
        pagado: total, // Monto pagado
        fechaPago: new Date(),
        metodoPago: data.metodoPago,
        referenciaPago: data.referencia || null,
        observaciones: observacionesFactura,
        estadoId: estadoFacturaPagada.id,
        cajaId: cajaActiva.id,
        cierreId: 0, // Se asociará al cerrar la caja
        clienteId: null // IRC no tiene cliente asociado
      }
    });

    // 2. Crear item de factura
    const conceptoVigencia = anosVigencia > 1 ? ` (${anosVigencia} años)` : '';
    await tx.facturaItem.create({
      data: {
        facturaId: factura.id,
        concepto: `Solicitud de Registro IRC - ${solicitud.categoriaIrc.nombre}${conceptoVigencia}`,
        cantidad: 1,
        precioUnitario: total,
        subtotal: total,
        itbis: 0, // ONDA no cobra ITBIS
        total
      }
    });

    // 3. Vincular factura a solicitud y calcular fecha de vencimiento
    const fechaPago = new Date();
    const fechaVencimiento = new Date(fechaPago);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + anosVigencia);

    await tx.solicitudRegistroInspeccion.update({
      where: { id: solicitudId },
      data: {
        facturaId: factura.id,
        estadoId: estadoSolicitudPagada.id,
        fechaPago: fechaPago,
        anosVigencia: anosVigencia,
        fechaVencimiento: fechaVencimiento
      }
    });

    return factura;
  });

  // Obtener factura completa con sus relaciones
  const facturaCompleta = await prisma.factura.findUnique({
    where: { id: resultado.id },
    include: {
      estado: true,
      items: true,
      caja: {
        select: {
          codigo: true,
          usuario: {
            select: {
              nombrecompleto: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    message: 'Pago registrado exitosamente',
    factura: facturaCompleta,
    solicitud: {
      codigo: solicitud.codigo,
      nombreEmpresa: solicitud.nombreEmpresa,
      rnc: solicitud.rnc
    }
  });
});
