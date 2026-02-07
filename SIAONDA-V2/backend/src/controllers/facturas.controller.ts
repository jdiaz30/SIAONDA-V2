import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateFacturaPDF } from '../services/facturaPdf.service';

// Schema de validación para crear factura
const createFacturaSchema = z.object({
  certificadoId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  items: z.array(z.object({
    concepto: z.string().min(1),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().positive(),
    itbis: z.number().min(0).default(0)
  })),
  metodoPago: z.string(),
  ncf: z.string().optional(),
  observaciones: z.string().optional()
});

// Generar código de factura: FAC-YYYYMMDD-NNNN
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

// Generar NCF (Número de Comprobante Fiscal)
// Formato: E310000000001 (E31 = Factura de crédito fiscal, seguido de 9 dígitos secuenciales)
const generateNCF = async (tipoComprobante: string = 'B02'): Promise<string> => {
  // Buscar secuencia activa disponible para el tipo de comprobante
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
      `No hay secuencias NCF disponibles para el tipo ${tipoComprobante}. Por favor, configure una nueva secuencia.`,
      500
    );
  }

  // Verificar si la secuencia está por agotarse (menos de 10 números disponibles)
  const numerosRestantes = Number(secuencia.numeroFinal - secuencia.numeroActual);
  if (numerosRestantes < 10) {
    console.warn(
      `⚠️ ADVERTENCIA: La secuencia NCF ${tipoComprobante}${secuencia.serie} está por agotarse. Quedan ${numerosRestantes} números disponibles.`
    );
  }

  // Incrementar el número actual
  const siguienteNumero = secuencia.numeroActual + BigInt(1);

  // Actualizar la secuencia en la base de datos
  await prisma.secuenciaNcf.update({
    where: { id: secuencia.id },
    data: { numeroActual: siguienteNumero }
  });

  // Formatear NCF: TIPO + SERIE + NÚMERO (8 dígitos)
  // Ejemplo: B02E00000001
  const ncf = `${tipoComprobante}${secuencia.serie}${siguienteNumero.toString().padStart(8, '0')}`;

  return ncf;
};

// GET /api/facturas
export const getFacturas = asyncHandler(async (req: Request, res: Response) => {
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
      { ncf: { contains: search, mode: 'insensitive' } },
      { cliente: { nombrecompleto: { contains: search, mode: 'insensitive' } } }
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

  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      where,
      skip,
      take: limit,
      include: {
        estado: true,
        cliente: {
          select: {
            id: true,
            codigo: true,
            nombrecompleto: true,
            identificacion: true,
            rnc: true
          }
        },
        certificado: {
          select: {
            id: true,
            codigo: true
          }
        },
        items: true,
        caja: {
          select: {
            id: true,
            codigo: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    }),
    prisma.factura.count({ where })
  ]);

  res.json({
    facturas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/facturas/:id
export const getFactura = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      estado: true,
      cliente: true,
      certificado: {
        include: {
          formulario: {
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
      items: true,
      caja: {
        include: {
          usuario: {
            select: {
              id: true,
              nombrecompleto: true
            }
          }
        }
      }
    }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  res.json(factura);
});

// POST /api/facturas
export const createFactura = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = createFacturaSchema.parse(req.body);

  // Verificar que el certificado existe
  const certificado = await prisma.certificado.findUnique({
    where: { id: data.certificadoId },
    include: {
      facturas: true,
      formulario: {
        include: {
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
              }
            }
          }
        }
      }
    }
  });

  if (!certificado) {
    throw new AppError('Certificado no encontrado', 404);
  }

  if (certificado.facturas && certificado.facturas.length > 0) {
    throw new AppError('Este certificado ya tiene una factura', 400);
  }

  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({
    where: { id: data.clienteId }
  });

  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  // Estado inicial: Pendiente
  const estadoPendiente = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pendiente' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado Pendiente no configurado', 500);
  }

  // Generar código y NCF
  const codigo = await generateCodigoFactura();
  const ncf = data.ncf || await generateNCF();

  // Calcular totales
  let subtotal = 0;
  let totalItbis = 0;

  data.items.forEach(item => {
    const itemSubtotal = item.cantidad * item.precioUnitario;
    subtotal += itemSubtotal;
    totalItbis += item.itbis;
  });

  const total = subtotal + totalItbis;

  // Crear factura con transacción
  const factura = await prisma.$transaction(async (tx) => {
    const nuevaFactura = await tx.factura.create({
      data: {
        codigo,
        ncf,
        fecha: new Date(),
        subtotal,
        itbis: totalItbis,
        total,
        metodoPago: data.metodoPago,
        observaciones: data.observaciones || null,
        estadoId: estadoPendiente.id,
        clienteId: data.clienteId,
        certificadoId: data.certificadoId
      }
    });

    // Crear items de factura
    for (const item of data.items) {
      await tx.facturaItem.create({
        data: {
          facturaId: nuevaFactura.id,
          concepto: item.concepto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          itbis: item.itbis,
          subtotal: item.cantidad * item.precioUnitario,
          total: (item.cantidad * item.precioUnitario) + item.itbis
        }
      });
    }

    return nuevaFactura;
  });

  // Obtener factura completa
  const facturaCompleta = await prisma.factura.findUnique({
    where: { id: factura.id },
    include: {
      estado: true,
      cliente: true,
      certificado: true,
      items: true
    }
  });

  res.status(201).json(facturaCompleta);
});

// PUT /api/facturas/:id/pagar - Ver línea ~805 (versión actualizada según SIAONDA V1)

// PUT /api/facturas/:id/anular
export const anularFactura = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { motivo } = req.body;

  if (!motivo) {
    throw new AppError('Motivo de anulación requerido', 400);
  }

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: { estado: true }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  if (factura.estado.nombre === 'Anulada') {
    throw new AppError('La factura ya está anulada', 400);
  }

  if (factura.estado.nombre === 'Pagada') {
    throw new AppError('No se puede anular una factura pagada. Debe emitir nota de crédito', 400);
  }

  const estadoAnulada = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Anulada' }
  });

  if (!estadoAnulada) {
    throw new AppError('Estado Anulada no configurado', 500);
  }

  const facturaActualizada = await prisma.factura.update({
    where: { id },
    data: {
      estadoId: estadoAnulada.id,
      observaciones: `ANULADA: ${motivo}. ${factura.observaciones || ''}`
    },
    include: {
      estado: true,
      cliente: true,
      certificado: true
    }
  });

  res.json({
    message: 'Factura anulada exitosamente',
    factura: facturaActualizada
  });
});

// GET /api/facturas/estados
export const getEstadosFactura = asyncHandler(async (req: Request, res: Response) => {
  const estados = await prisma.facturaEstado.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(estados);
});

// GET /api/facturas/reporte/ventas
export const getReporteVentas = asyncHandler(async (req: Request, res: Response) => {
  const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined;
  const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined;

  if (!fechaInicio || !fechaFin) {
    throw new AppError('Fechas de inicio y fin requeridas', 400);
  }

  const where: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin
    }
  };

  const facturas = await prisma.factura.findMany({
    where,
    include: {
      estado: true,
      cliente: {
        select: {
          nombrecompleto: true,
          rnc: true
        }
      },
      items: true
    },
    orderBy: { fecha: 'asc' }
  });

  // Calcular totales
  let totalGeneral = 0;
  let totalItbis = 0;
  let totalPagadas = 0;
  let totalPendientes = 0;

  facturas.forEach(f => {
    if (f.estado.nombre === 'Pagada') {
      totalPagadas += Number(f.total);
    } else if (f.estado.nombre === 'Pendiente') {
      totalPendientes += Number(f.total);
    }
    totalGeneral += Number(f.total);
    totalItbis += Number(f.itbis);
  });

  res.json({
    facturas,
    resumen: {
      totalFacturas: facturas.length,
      totalGeneral,
      totalItbis,
      totalPagadas,
      totalPendientes,
      fechaInicio,
      fechaFin
    }
  });
});

// DELETE /api/facturas/:id
export const deleteFactura = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: { estado: true }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  if (factura.estado.nombre === 'Pagada') {
    throw new AppError('No se puede eliminar una factura pagada', 400);
  }

  await prisma.factura.delete({ where: { id } });

  res.json({ message: 'Factura eliminada exitosamente' });
});

// POST /api/facturas/desde-formulario
// Generar factura desde formulario (estado: ABIERTA, sin pagar todavía)
// Según flujo SIAONDA V1
export const createFacturaDesdeFormulario = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { formularioId, solicitarNCF, rnc, observaciones, descuentoPorcentaje } = req.body;

  if (!formularioId) {
    throw new AppError('ID de formulario requerido', 400);
  }

  // Validar NCF: si se solicita, debe tener RNC
  if (solicitarNCF && (!rnc || rnc.trim().length === 0)) {
    throw new AppError('Debe proporcionar el RNC del cliente para generar comprobante fiscal', 400);
  }

  // Verificar que el formulario existe y está pendiente
  const formulario = await prisma.formulario.findUnique({
    where: { id: formularioId },
    include: {
      estado: true,
      clientes: {
        include: {
          cliente: true
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
          }
        }
      },
      factura: true
    }
  });

  if (!formulario) {
    throw new AppError('Formulario no encontrado', 404);
  }

  if (formulario.factura) {
    throw new AppError('Este formulario ya tiene una factura', 400);
  }

  if (formulario.estado.nombre !== 'Pendiente') {
    throw new AppError('Solo se pueden facturar formularios pendientes', 400);
  }

  if (!formulario.clientes || formulario.clientes.length === 0) {
    throw new AppError('El formulario no tiene clientes asociados', 400);
  }

  // Usar el primer cliente como cliente de la factura
  const clienteId = formulario.clientes[0].clienteId;

  // Verificar caja abierta del usuario
  const cajaAbierta = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    }
  });

  if (!cajaAbierta) {
    throw new AppError('Debes tener una caja abierta para generar facturas', 400);
  }

  // Estado inicial: Pendiente
  const estadoPendiente = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pendiente' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado Pendiente no configurado', 500);
  }

  // Generar código de factura
  const codigo = await generateCodigoFactura();

  // Generar NCF solo si se solicitó
  const ncf = solicitarNCF ? await generateNCF() : null;

  // Calcular items y totales basados en los productos del formulario
  let subtotal = 0;
  let totalItbis = 0;
  const items: any[] = [];

  for (const productoForm of formulario.productos) {
    const producto = productoForm.producto;
    const cantidad = productoForm.cantidad || 1;

    // Obtener el costo vigente del producto según la cantidad
    // Los costos vienen ordenados por cantidadMin ascendente
    // Encontrar el costo apropiado: el mayor cantidadMin que sea <= cantidad
    const costosAplicables = producto.costos.filter(c => c.cantidadMin <= cantidad);
    const costoVigente = costosAplicables.length > 0
      ? costosAplicables[costosAplicables.length - 1]
      : null;

    if (!costoVigente) {
      throw new AppError(`No hay costo configurado para el producto ${producto.nombre} con cantidad ${cantidad}`, 400);
    }

    const precioUnitario = Number(costoVigente.precio);
    const itemSubtotal = cantidad * precioUnitario;
    const itemItbis = itemSubtotal * 0.18; // 18% ITBIS

    subtotal += itemSubtotal;
    totalItbis += itemItbis;

    items.push({
      concepto: `${producto.nombre} - ${producto.codigo}`,
      cantidad,
      precioUnitario,
      itbis: itemItbis,
      subtotal: itemSubtotal,
      total: itemSubtotal + itemItbis
    });
  }

  // Aplicar descuento si existe (según SIAONDA V1: 0%, 80% o 100%)
  const porcentaje = descuentoPorcentaje || 0;
  const totalSinDescuento = subtotal + totalItbis;
  const descuentoAplicado = (totalSinDescuento * porcentaje) / 100;
  const total = totalSinDescuento - descuentoAplicado;

  // Obtener estado "Abierta" para la factura (según SIAONDA V1)
  const estadoFacturaAbierta = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Abierta' }
  });

  if (!estadoFacturaAbierta) {
    throw new AppError('Estado Abierta no configurado para facturas', 500);
  }

  // Crear factura en estado ABIERTA (sin pagar todavía, según flujo V1)
  const factura = await prisma.$transaction(async (tx) => {
    // 1. Crear factura con estado ABIERTA
    const nuevaFactura = await tx.factura.create({
      data: {
        codigo,
        ncf,
        rnc: solicitarNCF ? rnc : null,
        fecha: new Date(),
        subtotal,
        itbis: totalItbis,
        descuento: descuentoAplicado,
        total,
        pagado: 0, // AÚN NO PAGADA
        metodoPago: null, // Se define al pagar
        fechaPago: null, // Se define al pagar
        referenciaPago: null,
        observaciones: observaciones || null,
        estadoId: estadoFacturaAbierta.id, // Estado ABIERTA
        clienteId,
        cajaId: cajaAbierta.id
      }
    });

    // 2. Crear items de factura
    for (const item of items) {
      await tx.facturaItem.create({
        data: {
          facturaId: nuevaFactura.id,
          concepto: item.concepto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          itbis: item.itbis,
          subtotal: item.subtotal,
          total: item.total
        }
      });
    }

    // 3. Vincular formulario con factura (NO cambiar estado todavía)
    await tx.formulario.update({
      where: { id: formularioId },
      data: {
        facturaId: nuevaFactura.id
      }
    });

    return nuevaFactura;
  });

  // Obtener factura completa
  const facturaCompleta = await prisma.factura.findUnique({
    where: { id: factura.id },
    include: {
      estado: true,
      cliente: true,
      formularios: {
        include: {
          productos: {
            include: {
              producto: true
            }
          }
        }
      },
      items: true,
      caja: true
    }
  });

  res.status(201).json({
    message: 'Factura generada exitosamente (Estado: ABIERTA). Proceda a pagar.',
    factura: facturaCompleta
  });
});

// PUT /api/facturas/:id/pagar
// Pagar una factura abierta (según flujo SIAONDA V1)
export const pagarFactura = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const facturaId = parseInt(req.params.id);
  const { metodoPago, referenciaPago } = req.body;

  if (!metodoPago) {
    throw new AppError('Método de pago requerido', 400);
  }

  // Verificar caja abierta
  const cajaAbierta = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estadoId: 1 // Abierta
    }
  });

  if (!cajaAbierta) {
    throw new AppError('Debe tener una caja abierta para procesar pagos', 400);
  }

  // Buscar la factura
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      estado: true,
      formularios: true
    }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  // Verificar que la factura esté abierta (pendiente de pago)
  if (factura.estado.nombre !== 'Abierta') {
    throw new AppError(`No se puede pagar una factura con estado ${factura.estado.nombre}`, 400);
  }

  // Obtener método de pago
  const metodoPagoObj = await prisma.metodoPago.findFirst({
    where: { nombre: metodoPago }
  });

  if (!metodoPagoObj) {
    throw new AppError(`Método de pago ${metodoPago} no encontrado`, 400);
  }

  // Obtener estado "Pagada"
  const estadoPagada = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pagada' }
  });

  if (!estadoPagada) {
    throw new AppError('Estado Pagada no configurado', 500);
  }

  // Pagar factura en una transacción
  const facturaPagada = await prisma.$transaction(async (tx) => {
    // 1. Actualizar factura a estado PAGADA
    const facturaActualizada = await tx.factura.update({
      where: { id: facturaId },
      data: {
        estadoId: estadoPagada.id,
        metodoPago,
        referenciaPago,
        fechaPago: new Date(),
        pagado: factura.total
      }
    });

    // 2. Registrar el pago
    await tx.pago.create({
      data: {
        facturaId,
        metodoPagoId: metodoPagoObj.id,
        monto: factura.total,
        fecha: new Date(),
        usuarioId: req.usuario?.id || 1,
        referencia: referenciaPago || null
      }
    });

    // 3. Actualizar totales de la caja
    await tx.caja.update({
      where: { id: cajaAbierta.id },
      data: {
        totalFacturas: {
          increment: Number(factura.total)
        }
      }
    });

    // 4. Cambiar estado de formularios a "Pagado" (si existen)
    if (factura.formularios && factura.formularios.length > 0) {
      const estadoFormularioPagado = await tx.formularioEstado.findFirst({
        where: { nombre: 'Pagado' }
      });

      if (estadoFormularioPagado) {
        for (const form of factura.formularios) {
          await tx.formulario.update({
            where: { id: form.id },
            data: { estadoId: estadoFormularioPagado.id }
          });
        }
      }
    }

    return facturaActualizada;
  });

  res.json({
    message: 'Pago procesado exitosamente',
    factura: facturaPagada
  });
});

// GET /api/facturas/metodos-pago
// Obtener métodos de pago disponibles
export const getMetodosPago = asyncHandler(async (req: Request, res: Response) => {
  const metodos = await prisma.metodoPago.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  });

  res.json(metodos);
});

// POST /api/facturas/generica
// Crear factura genérica (para denuncias, inspecciones de oficio, etc.)
const createFacturaGenericaSchema = z.object({
  monto: z.number().positive(),
  concepto: z.string().min(1).default('Servicio ONDA'),
  metodoPago: z.string(),
  referenciaPago: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  requiereNCF: z.boolean().default(false),
  rnc: z.string().nullable().optional()
});

export const createFacturaGenerica = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const data = createFacturaGenericaSchema.parse(req.body);

  // Obtener estado "Pendiente"
  const estadoPendiente = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Pendiente' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado Pendiente no encontrado', 500);
  }

  // Generar código de factura
  const codigo = await generateCodigoFactura();

  // Generar NCF si se requiere
  let ncf = null;
  if (data.requiereNCF) {
    if (!data.rnc) {
      throw new AppError('RNC requerido para emitir NCF', 400);
    }
    ncf = await generateNCF('B01'); // Factura de Crédito Fiscal
  }

  // Crear factura
  const factura = await prisma.factura.create({
    data: {
      codigo,
      fecha: new Date(),
      total: data.monto,
      itbis: 0,
      subtotal: data.monto,
      estadoId: estadoPendiente.id,
      metodoPago: data.metodoPago,
      referenciaPago: data.referenciaPago || null,
      ncf: ncf,
      rnc: data.rnc || null,
      observaciones: data.observaciones || null,
      usuarioId: req.usuario.id,
      items: {
        create: [
          {
            concepto: data.concepto,
            cantidad: 1,
            precioUnitario: data.monto,
            itbis: 0,
            total: data.monto
          }
        ]
      }
    },
    include: {
      items: true,
      estado: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Factura creada exitosamente',
    data: factura
  });
});

// GET /api/facturas/:id/imprimir
// Generar PDF de factura para impresión - Formato ONDA (80mm térmico)
export const imprimirFactura = asyncHandler(async (req: Request, res: Response) => {
  const PDFDocument = require('pdfkit');
  const facturaId = parseInt(req.params.id);

  // Obtener factura completa con todas las relaciones, incluyendo solicitud de inspectoría, denuncia y formularios
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      cliente: true,
      items: true,
      caja: {
        include: {
          usuario: true,
          sucursal: true
        }
      },
      estado: true,
      solicitudInspeccion: {
        include: {
          empresa: true,
          categoriaIrc: true,
          estado: true
        }
      },
      denuncia: true,
      formularios: {
        include: {
          clientes: {
            include: {
              cliente: true
            }
          }
        }
      }
    }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  // Crear documento PDF - Formato papel térmico 80mm x altura automática
  // 80mm = 226.77 puntos (1mm = 2.834645669 puntos)
  // Altura estimada basada en el contenido (se ajusta dinámicamente)
  const doc = new PDFDocument({
    margin: 10,
    size: [226.77, 600], // 80mm ancho x altura suficiente para el contenido típico
  });

  // Configurar respuesta HTTP
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=factura-${factura.codigo}.pdf`);

  // Pipe del PDF a la respuesta
  doc.pipe(res);

  const pageWidth = 226.77;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // ENCABEZADO - LOGO ONDA
  const logoPath = require('path').join(__dirname, '../../public/logo-onda.png');
  const fs = require('fs');

  if (fs.existsSync(logoPath)) {
    try {
      // Agregar logo centrado (100px de ancho para mejor visibilidad)
      const logoWidth = 100;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.image(logoPath, logoX, doc.y, { width: logoWidth });
      doc.moveDown(1.2);
    } catch (error) {
      console.error('Error al cargar logo:', error);
      // Si falla, mostrar texto
      doc.fontSize(10).font('Helvetica-Bold').text('ONDA', { align: 'center' });
    }
  } else {
    // Si no existe el logo, mostrar texto
    doc.fontSize(10).font('Helvetica-Bold').text('ONDA', { align: 'center' });
  }

  doc.fontSize(7).font('Helvetica').text('Oficina Nacional de Derecho de Autor', { align: 'center' });
  doc.fontSize(6).text('RNC: 401-50879-6', { align: 'center' });
  doc.moveDown(0.5);

  // Línea separadora
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // FACTURA - Título y código
  doc.fontSize(9).font('Helvetica-Bold').text('FACTURA', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(factura.codigo, { align: 'center' });

  // NCF si existe
  if (factura.ncf) {
    doc.fontSize(7).text(`NCF: ${factura.ncf}`, { align: 'center' });
  }

  doc.moveDown(0.4);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // INFORMACIÓN DE TRANSACCIÓN (compacta)
  const fechaFormateada = new Date(factura.fecha).toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  doc.fontSize(6).font('Helvetica')
     .text(`Fecha: ${fechaFormateada}`, margin, doc.y);

  // Código de formulario (si existe)
  // Puede venir de solicitudInspeccion IRC o de formularios normales
  let codigoFormulario = null;
  if (factura.solicitudInspeccion) {
    codigoFormulario = factura.solicitudInspeccion.codigo;
  } else if (factura.formularios && factura.formularios.length > 0) {
    codigoFormulario = factura.formularios[0].codigo;
  }

  if (codigoFormulario) {
    doc.text(`Form: ${codigoFormulario}`, margin, doc.y);
  }

  doc.text(`Cajero: ${factura.caja?.usuario?.nombrecompleto || 'N/A'}`, margin, doc.y);
  doc.text(`Sucursal: ${factura.caja?.sucursal?.nombre || 'Principal'}`, margin, doc.y);

  doc.moveDown(0.4);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // DATOS DEL CLIENTE
  // Prioridad:
  // 1. Cliente directo en la factura (IRC, denuncias)
  // 2. Empresa de solicitud IRC
  // 3. Formulario de obras
  // 4. Denuncia
  let nombreCliente = 'N/A';
  let telefonoCliente = 'N/A';
  let emailCliente = 'N/A';

  if (factura.cliente) {
    // Cliente directo en la factura (IRC, etc)
    nombreCliente = factura.cliente.nombrecompleto || factura.cliente.nombre || 'N/A';
    telefonoCliente = factura.cliente.telefono || 'N/A';
    emailCliente = factura.cliente.correo || 'N/A';
  } else if (factura.solicitudInspeccion?.empresa) {
    // Solicitud IRC - obtener datos de la empresa
    const empresa = factura.solicitudInspeccion.empresa;
    nombreCliente = empresa.nombreEmpresa || empresa.nombreComercial || 'N/A';
    telefonoCliente = empresa.telefono || 'N/A';
    emailCliente = empresa.email || 'N/A';
  } else if (factura.formularios && factura.formularios.length > 0) {
    // Extraer desde formulario de obras (NUEVO)
    const formulario = factura.formularios[0];
    if (formulario.clientes && formulario.clientes.length > 0) {
      const clientePrincipal = formulario.clientes[0].cliente;
      nombreCliente = `${clientePrincipal.nombre} ${clientePrincipal.apellido}`;
      telefonoCliente = clientePrincipal.telefono || 'N/A';
      emailCliente = clientePrincipal.correo || 'N/A';
    }
  } else if (factura.denuncia) {
    // Extraer desde la denuncia
    nombreCliente = factura.denuncia.denuncianteNombre;
    telefonoCliente = factura.denuncia.denuncianteTelefono || 'N/A';
    emailCliente = factura.denuncia.denuncianteEmail || 'N/A';
  }

  doc.fontSize(7).font('Helvetica-Bold').text('CLIENTE');
  doc.fontSize(6).font('Helvetica')
     .text(nombreCliente)
     .text(`Tel: ${telefonoCliente}`)
     .text(`Email: ${emailCliente}`);

  if (factura.rnc) {
    doc.text(`RNC: ${factura.rnc}`);
  }

  doc.moveDown(0.4);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // DETALLE DE PRODUCTOS
  doc.fontSize(7).font('Helvetica-Bold').text('DETALLE', { align: 'center' });
  doc.moveDown(0.3);

  doc.fontSize(6).font('Helvetica');
  factura.items.forEach((item) => {
    // Nombre del producto
    doc.font('Helvetica-Bold').text(item.concepto, { width: contentWidth });

    // Detalles: cantidad x precio = total
    doc.font('Helvetica')
       .text(`  ${item.cantidad} x RD$ ${Number(item.precioUnitario).toFixed(2)} = RD$ ${Number(item.subtotal).toFixed(2)}`);

    doc.moveDown(0.2);
  });

  doc.moveDown(0.3);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // TOTALES
  doc.fontSize(7).font('Helvetica');

  // Subtotal
  doc.text(`Subtotal:`, margin, doc.y, { continued: true })
     .text(`RD$ ${Number(factura.subtotal).toFixed(2)}`, { align: 'right' });

  // Descuento (si existe)
  if (factura.descuento && Number(factura.descuento) > 0) {
    doc.text(`Descuento:`, margin, doc.y, { continued: true })
       .text(`- RD$ ${Number(factura.descuento).toFixed(2)}`, { align: 'right' });
  }

  doc.moveDown(0.2);

  // TOTAL (destacado)
  doc.fontSize(9).font('Helvetica-Bold')
     .text(`TOTAL:`, margin, doc.y, { continued: true })
     .text(`RD$ ${Number(factura.total).toFixed(2)}`, { align: 'right' });

  doc.moveDown(0.3);
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.4);

  // INFORMACIÓN DE PAGO
  doc.fontSize(6).font('Helvetica')
     .text(`Forma de Pago: ${factura.metodoPago || 'N/A'}`, { align: 'center' });

  if (factura.referenciaPago) {
    doc.text(`Ref: ${factura.referenciaPago}`, { align: 'center' });
  }

  doc.text(`Estado: ${factura.estado.nombre.toUpperCase()}`, { align: 'center' });

  // Monto pagado y restante
  const montoPagado = Number(factura.pagado || factura.total);
  const totalFacturado = Number(factura.total);
  const restante = totalFacturado - montoPagado;

  doc.text(`Pagado: RD$ ${montoPagado.toFixed(2)}`, { align: 'center' });

  if (restante > 0) {
    doc.text(`Restante: RD$ ${restante.toFixed(2)}`, { align: 'center' });
  }

  doc.moveDown(0.5);

  // OBSERVACIONES (si existen)
  if (factura.observaciones) {
    doc.fontSize(6).font('Helvetica-Bold').text('Observaciones:');
    doc.fontSize(5).font('Helvetica').text(factura.observaciones, { width: contentWidth });
    doc.moveDown(0.4);
  }

  // PIE DE PÁGINA
  doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
  doc.moveDown(0.3);

  doc.fontSize(5).font('Helvetica')
     .text('La factura debe estar firmada y sellada para tener validez', { align: 'center' })
     .moveDown(0.2)
     .text('Av. Ing. Roberto Pastoriza 317, Ensanche Naco, D.N.', { align: 'center' })
     .text('Tel: (829)553-6632 | info@onda.gob.do', { align: 'center' });

  // Finalizar documento
  doc.end();
});

// GET /api/facturas/:id/pdf - Generar PDF de factura con logo ONDA
export const generateFacturaPDFEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          nombrecompleto: true,
          identificacion: true,
          rnc: true,
          telefono: true,
          correo: true
        }
      },
      items: true
    }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  // Preparar datos para el PDF
  const facturaData = {
    id: factura.id,
    codigo: factura.codigo,
    ncf: factura.ncf,
    fecha: factura.fecha,
    subtotal: Number(factura.subtotal),
    itbis: Number(factura.itbis),
    descuento: Number(factura.descuento),
    total: Number(factura.total),
    cliente: factura.cliente ? {
      nombrecompleto: factura.cliente.nombrecompleto,
      identificacion: factura.cliente.identificacion,
      rnc: factura.cliente.rnc,
      telefono: factura.cliente.telefono,
      correo: factura.cliente.correo
    } : undefined,
    items: factura.items.map(item => ({
      descripcion: item.concepto,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal)
    })),
    metodoPago: factura.metodoPago || undefined,
    observaciones: factura.observaciones
  };

  const pdfBuffer = await generateFacturaPDF(facturaData);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="factura-${factura.codigo}.pdf"`);
  res.send(pdfBuffer);
});

// PUT /api/facturas/:id/anular-pagada - Anular una factura que ya fue pagada
export const anularFacturaPagada = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Solo administradores pueden anular facturas pagadas
  if (req.usuario.tipo !== 'ADMINISTRADOR' && req.usuario.tipo !== 'SUPERVISOR') {
    throw new AppError('No tiene permisos para anular facturas pagadas', 403);
  }

  const { motivo } = req.body;

  if (!motivo || motivo.trim().length < 10) {
    throw new AppError('Debe proporcionar un motivo detallado (mínimo 10 caracteres)', 400);
  }

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      estado: true,
      cliente: true,
      items: true
    }
  });

  if (!factura) {
    throw new AppError('Factura no encontrada', 404);
  }

  if (factura.estado.nombre === 'Anulada') {
    throw new AppError('La factura ya está anulada', 400);
  }

  if (factura.estado.nombre !== 'Pagada' && factura.estado.nombre !== 'Cerrada') {
    throw new AppError('Solo se pueden anular facturas pagadas o cerradas', 400);
  }

  const estadoAnulada = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Anulada' }
  });

  if (!estadoAnulada) {
    throw new AppError('Estado Anulada no configurado', 500);
  }

  // Realizar la anulación en una transacción
  const resultado = await prisma.$transaction(async (tx) => {
    // Actualizar la factura a estado Anulada
    const facturaActualizada = await tx.factura.update({
      where: { id },
      data: {
        estadoId: estadoAnulada.id,
        observaciones: `ANULADA (FACTURA PAGADA) - Fecha: ${new Date().toLocaleDateString()} - Usuario: ${req.usuario!.nombrecompleto} - Motivo: ${motivo}. ${factura.observaciones || ''}`
      },
      include: {
        estado: true,
        cliente: true,
        items: {
          include: {
            producto: true
          }
        }
      }
    });

    return facturaActualizada;
  });

  res.json({
    message: 'Factura pagada anulada exitosamente',
    factura: resultado,
    advertencia: 'Esta operación quedó registrada en el sistema. El NCF (si existe) no puede ser reutilizado según normativa DGII.'
  });
});
