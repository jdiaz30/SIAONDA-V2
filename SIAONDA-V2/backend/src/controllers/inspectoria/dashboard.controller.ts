import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Dashboard principal de Inspectoría
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date();
    finMes.setMonth(finMes.getMonth() + 1);
    finMes.setDate(0);
    finMes.setHours(23, 59, 59, 999);

    // Ejecutar todas las queries en paralelo
    const [
      empresasVencidas,
      empresasPorVencer,
      solicitudesPendientesValidacion,
      solicitudesPendientesAsentamiento,
      solicitudesPendientesFirma,
      casosPendientesAsignacion,
      casosEnPlazoGracia,
      casosParaSegundaVisita,
      totalEmpresas,
      totalSolicitudes,
      totalCasos,
      ingresosDelMes
    ] = await Promise.all([
      // Empresas vencidas
      prisma.empresaInspeccionada.count({
        where: {
          fechaVencimiento: { lt: hoy },
          registrado: true
        }
      }),

      // Empresas por vencer (30 días)
      prisma.empresaInspeccionada.count({
        where: {
          fechaVencimiento: { gte: hoy, lte: en30Dias },
          registrado: true
        }
      }),

      // Solicitudes pendientes validación
      prisma.solicitudRegistroInspeccion.count({
        where: { estadoId: 1 } // PENDIENTE
      }),

      // Solicitudes pendientes asentamiento
      prisma.solicitudRegistroInspeccion.count({
        where: { estadoId: 3 } // PAGADA
      }),

      // Solicitudes pendientes certificado (asentadas, sin certificado generado)
      prisma.solicitudRegistroInspeccion.count({
        where: { estadoId: 5 } // ASENTADA (pendientes de generar certificado)
      }),

      // Casos pendientes asignación
      prisma.casoInspeccion.count({
        where: { estadoCasoId: 1 } // PENDIENTE_ASIGNACION
      }),

      // Casos en plazo de gracia
      prisma.casoInspeccion.count({
        where: { estadoCasoId: 3 } // EN_PLAZO_GRACIA
      }),

      // Casos para 2da visita (reactivados)
      prisma.casoInspeccion.count({
        where: { estadoCasoId: 4 } // REACTIVADO
      }),

      // Total de empresas
      prisma.empresaInspeccionada.count(),

      // Total de solicitudes
      prisma.solicitudRegistroInspeccion.count(),

      // Total de casos
      prisma.casoInspeccion.count(),

      // Ingresos del mes
      prisma.factura.aggregate({
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          solicitudInspeccion: { isNot: null },
          estadoId: 2 // PAGADA
        },
        _sum: {
          total: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        alertasRenovacion: {
          vencidas: empresasVencidas,
          porVencer30Dias: empresasPorVencer
        },
        solicitudesPendientes: {
          validacion: solicitudesPendientesValidacion,
          asentamiento: solicitudesPendientesAsentamiento,
          certificado: solicitudesPendientesFirma
        },
        casosPendientes: {
          pendientesAsignacion: casosPendientesAsignacion,
          enPlazoGracia: casosEnPlazoGracia,
          paraSegundaVisita: casosParaSegundaVisita
        },
        estadisticas: {
          totalEmpresas,
          totalSolicitudes,
          totalCasos,
          ingresosMensuales: ingresosDelMes._sum.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Estadísticas del mes actual
 */
export const getEstadisticasMes = async (req: Request, res: Response) => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date();
    finMes.setMonth(finMes.getMonth() + 1);
    finMes.setDate(0);
    finMes.setHours(23, 59, 59, 999);

    const [
      solicitudesCreadas,
      certificadosEmitidos,
      casosCreados,
      casosCerrados,
      ingresosDelMes
    ] = await Promise.all([
      prisma.solicitudRegistroInspeccion.count({
        where: {
          creadoEn: { gte: inicioMes, lte: finMes }
        }
      }),

      prisma.certificadoInspeccion.count({
        where: {
          fechaEmision: { gte: inicioMes, lte: finMes }
        }
      }),

      prisma.casoInspeccion.count({
        where: {
          creadoEn: { gte: inicioMes, lte: finMes }
        }
      }),

      prisma.casoInspeccion.count({
        where: {
          fechaCierre: { gte: inicioMes, lte: finMes }
        }
      }),

      prisma.factura.aggregate({
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          solicitudInspeccion: { isNot: null },
          estadoId: 2 // PAGADA
        },
        _sum: {
          total: true
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        mes: inicioMes.toLocaleString('es-DO', { month: 'long', year: 'numeric' }),
        solicitudesCreadas,
        certificadosEmitidos,
        casosCreados,
        casosCerrados,
        ingresos: ingresosDelMes._sum.total || 0
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del mes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del mes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Empresas por Provincia
 */
export const getEmpresasPorProvincia = async (req: Request, res: Response) => {
  try {
    const empresasPorProvincia = await prisma.empresaInspeccionada.groupBy({
      by: ['provinciaId'],
      _count: true,
      where: {
        provinciaId: { not: null }
      }
    });

    const provincias = await prisma.provincia.findMany();

    const resultado = empresasPorProvincia.map(item => {
      const provincia = provincias.find(p => p.id === item.provinciaId);
      return {
        provinciaId: item.provinciaId,
        provincia: provincia?.nombre || 'Desconocida',
        total: item._count
      };
    }).sort((a, b) => b.total - a.total);

    return res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al obtener empresas por provincia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresas por provincia',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Casos por Tipo
 */
export const getCasosPorTipo = async (req: Request, res: Response) => {
  try {
    const casosPorTipo = await prisma.casoInspeccion.groupBy({
      by: ['tipoCaso'],
      _count: true
    });

    const resultado = casosPorTipo.map(item => ({
      tipo: item.tipoCaso,
      total: item._count
    })).sort((a, b) => b.total - a.total);

    return res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al obtener casos por tipo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener casos por tipo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Renovaciones del Mes
 */
export const getRenovacionesDelMes = async (req: Request, res: Response) => {
  try {
    const { mes, anio } = req.query;

    const fechaInicio = new Date();
    const fechaFin = new Date();

    if (mes && anio) {
      fechaInicio.setFullYear(Number(anio), Number(mes) - 1, 1);
      fechaFin.setFullYear(Number(anio), Number(mes), 0);
    } else {
      // Mes actual
      fechaInicio.setDate(1);
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      fechaFin.setDate(0);
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const renovaciones = await prisma.solicitudRegistroInspeccion.findMany({
      where: {
        tipoSolicitud: 'RENOVACION',
        creadoEn: { gte: fechaInicio, lte: fechaFin }
      },
      include: {
        empresa: {
          include: {
            categoriaIrc: true
          }
        },
        estado: true
      },
      orderBy: { creadoEn: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        periodo: `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`,
        total: renovaciones.length,
        renovaciones
      }
    });
  } catch (error) {
    console.error('Error al obtener renovaciones del mes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener renovaciones del mes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Ingresos por Categoría IRC
 */
export const getIngresosPorCategoria = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where: any = {
      solicitudInspeccion: { isNot: null },
      estadoId: 2 // PAGADA
    };

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(String(fechaInicio)),
        lte: new Date(String(fechaFin))
      };
    }

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        solicitudInspeccion: {
          include: {
            categoriaIrc: true
          }
        }
      }
    });

    // Agrupar por categoría
    const ingresosPorCategoria = facturas.reduce((acc: any, factura) => {
      const categoria = factura.solicitudInspeccion?.categoriaIrc;
      if (categoria) {
        if (!acc[categoria.codigo]) {
          acc[categoria.codigo] = {
            codigo: categoria.codigo,
            nombre: categoria.nombre,
            totalFacturas: 0,
            ingresoTotal: 0
          };
        }
        acc[categoria.codigo].totalFacturas++;
        acc[categoria.codigo].ingresoTotal += Number(factura.total);
      }
      return acc;
    }, {});

    const resultado = Object.values(ingresosPorCategoria)
      .sort((a: any, b: any) => b.ingresoTotal - a.ingresoTotal);

    return res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al obtener ingresos por categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ingresos por categoría',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Empresas con Infracciones Pendientes
 */
export const getEmpresasConInfracciones = async (req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresaInspeccionada.findMany({
      where: {
        statusId: { in: [4, 7] }, // NOTIFICACION, INTIMADA
        casosInspeccion: {
          some: {
            estadoCasoId: { in: [3, 4] } // EN_PLAZO_GRACIA, REACTIVADO
          }
        }
      },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true,
        estadoJuridico: true,
        casosInspeccion: {
          where: {
            estadoCasoId: { in: [3, 4] }
          },
          include: {
            estadoCaso: true,
            actaInspeccion: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: empresas,
      total: empresas.length
    });
  } catch (error) {
    console.error('Error al obtener empresas con infracciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresas con infracciones',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Reporte: Empresas en Proceso Jurídico
 */
export const getEmpresasEnProcesoJuridico = async (req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresaInspeccionada.findMany({
      where: {
        estadoJuridicoId: 3, // REMITIDA DEP. JURIDICO
      },
      include: {
        categoriaIrc: true,
        provincia: true,
        estadoJuridico: true,
        statusExterno: true,
        casosInspeccion: {
          where: {
            estadoCasoId: 6 // TRAMITADO_JURIDICO
          },
          include: {
            actaInspeccion: true,
            actaInfraccion: true
          },
          orderBy: { creadoEn: 'desc' }
        }
      }
    });

    return res.json({
      success: true,
      data: empresas,
      total: empresas.length
    });
  } catch (error) {
    console.error('Error al obtener empresas en proceso jurídico:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresas en proceso jurídico',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
