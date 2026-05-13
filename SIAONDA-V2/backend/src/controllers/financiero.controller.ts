import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * OBTENER MÉTRICAS FINANCIERAS
 * GET /api/financiero/metricas
 */
export const getMetricasFinancieras = async (req: Request, res: Response) => {
  try {
    const { periodo = 'hoy' } = req.query;

    const ahora = new Date();
    let fechaInicio: Date;

    // Calcular fecha de inicio según período
    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date(ahora);
        fechaInicio.setMonth(ahora.getMonth() - 1);
        break;
      case 'hoy':
      default:
        fechaInicio = new Date(ahora);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
    }

    // Total recaudado según período seleccionado
    const facturasPeriodo = await prisma.factura.aggregate({
      where: {
        fecha: {
          gte: fechaInicio
        },
        pagado: {
          gt: 0
        }
      },
      _sum: {
        pagado: true
      },
      _count: {
        id: true
      }
    });

    // Total recaudado HOY (siempre mostrar el día actual)
    const hoyInicio = new Date(new Date().setHours(0, 0, 0, 0));
    const facturasHoy = await prisma.factura.aggregate({
      where: {
        fecha: {
          gte: hoyInicio
        },
        pagado: {
          gt: 0
        }
      },
      _sum: {
        pagado: true
      }
    });

    // Total recaudado ESTE MES (siempre mostrar el mes actual)
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const facturasMes = await prisma.factura.aggregate({
      where: {
        fecha: {
          gte: inicioMes
        },
        pagado: {
          gt: 0
        }
      },
      _sum: {
        pagado: true
      }
    });

    // Cajas abiertas
    const cajasAbiertas = await prisma.caja.findMany({
      where: {
        estadoId: 1 // Estado: Abierta
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombrecompleto: true
          }
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        },
        facturas: {
          select: {
            id: true,
            pagado: true
          }
        }
      }
    });

    // Pagos pendientes (facturas sin pagar)
    const facturasPendientes = await prisma.factura.count({
      where: {
        estadoId: 1 // Estado: Pendiente
      }
    });

    // Mapear cajas con totales (usar facturas.pagado)
    const cajasInfo = cajasAbiertas.map(caja => {
      // Obtener el total pagado de todas las facturas de esta caja
      const facturasConPagos = caja.facturas.filter(f => parseFloat(f.pagado.toString()) > 0);
      const totalRecaudado = facturasConPagos.reduce((sum, f) => sum + parseFloat(f.pagado.toString()), 0);

      return {
        id: caja.id,
        codigo: caja.codigo,
        nombre: `Caja ${caja.codigo}`,
        estado: 'Abierta',
        sucursal: caja.sucursal?.nombre || 'Sin sucursal',
        cajero: caja.usuario?.nombrecompleto || 'Sin asignar',
        montoInicial: parseFloat(caja.montoInicial.toString()),
        totalRecaudado,
        totalTransacciones: facturasConPagos.length,
        fechaApertura: caja.horaApertura || caja.fecha
      };
    });

    // Ingresos por día (últimos 7 días) - usar facturas.pagado
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const facturasPorDia = await prisma.factura.groupBy({
      by: ['fecha'],
      where: {
        fecha: {
          gte: hace7Dias
        },
        pagado: {
          gt: 0
        }
      },
      _sum: {
        pagado: true
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    const ingresosPorDia = facturasPorDia.map(f => ({
      fecha: f.fecha.toISOString().split('T')[0],
      monto: parseFloat(f._sum.pagado?.toString() || '0')
    }));

    // Ingresos por sucursal (usar facturas.pagado en lugar de tabla pagos)
    const facturasConSucursal = await prisma.factura.findMany({
      where: {
        fecha: {
          gte: fechaInicio
        },
        pagado: {
          gt: 0
        }
      },
      select: {
        pagado: true,
        caja: {
          include: {
            sucursal: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    // Agrupar ingresos por sucursal
    const ingresosPorSucursalMap = new Map<string, number>();

    facturasConSucursal.forEach(factura => {
      const nombreSucursal = factura.caja?.sucursal?.nombre || 'Sin sucursal';
      const montoPagado = parseFloat(factura.pagado.toString());

      const montoActual = ingresosPorSucursalMap.get(nombreSucursal) || 0;
      ingresosPorSucursalMap.set(nombreSucursal, montoActual + montoPagado);
    });

    const ingresosPorSucursalAgrupados = Array.from(ingresosPorSucursalMap.entries()).map(([sucursal, monto]) => ({
      sucursal,
      monto
    }));

    const metricas = {
      totalRecaudadoHoy: parseFloat(facturasHoy._sum.pagado?.toString() || '0'),
      totalRecaudadoMes: parseFloat(facturasMes._sum.pagado?.toString() || '0'),
      totalRecaudadoPeriodo: parseFloat(facturasPeriodo._sum.pagado?.toString() || '0'),
      cajasAbiertas: cajasAbiertas.length,
      pagosPendientes: facturasPendientes,
      transaccionesHoy: facturasPeriodo._count.id,
      cajas: cajasInfo,
      ingresosPorDia,
      ingresosPorSucursal: ingresosPorSucursalAgrupados,
      periodo: periodo || 'hoy'
    };

    res.json(metricas);
  } catch (error) {
    console.error('Error al obtener métricas financieras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas financieras',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
