import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ============================================
// REPORTE: INGRESOS REALES VS POTENCIALES
// ============================================
export const getReporteIngresos = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    throw new AppError('Se requieren fechas de inicio y fin', 400);
  }

  const inicio = new Date(fechaInicio as string);
  const fin = new Date(fechaFin as string);
  fin.setHours(23, 59, 59, 999); // Incluir todo el día final

  // Obtener todas las cajas en el período
  const cajas = await prisma.caja.findMany({
    where: {
      fecha: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      facturas: {
        include: {
          estado: true
        }
      },
      usuario: {
        select: {
          nombrecompleto: true
        }
      }
    }
  });

  // Calcular totales
  let ingresosReales = 0;
  let ingresosPotenciales = 0;
  let cajasGratuitas = 0;
  let cajasNormales = 0;

  const detallesPorCaja = cajas.map(caja => {
    const facturasPagadas = caja.facturas.filter(f => f.estado.nombre === 'Pagada');
    const totalCaja = facturasPagadas.reduce((sum, f) => sum + Number(f.total), 0);

    if (caja.esGratuita) {
      cajasGratuitas++;
      // Para cajas gratuitas, el potencial es lo que se hubiera cobrado
      ingresosPotenciales += totalCaja;
    } else {
      cajasNormales++;
      ingresosReales += totalCaja;
    }

    return {
      cajaId: caja.id,
      codigo: caja.codigo,
      fecha: caja.fecha,
      usuario: caja.usuario?.nombrecompleto || 'Sin usuario asignado',
      esGratuita: caja.esGratuita,
      motivoGratuito: caja.motivoGratuito,
      totalFacturas: facturasPagadas.length,
      montoTotal: totalCaja
    };
  });

  res.json({
    success: true,
    data: {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      resumen: {
        ingresosReales,
        ingresosPotenciales,
        totalGeneral: ingresosReales + ingresosPotenciales,
        cajasGratuitas,
        cajasNormales,
        totalCajas: cajas.length
      },
      detalles: detallesPorCaja
    }
  });
});

// ============================================
// REPORTE: FORMULARIOS POR TIPO DE OBRA
// ============================================
export const getReporteFormulariosPorTipo = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    throw new AppError('Se requieren fechas de inicio y fin', 400);
  }

  const inicio = new Date(fechaInicio as string);
  const fin = new Date(fechaFin as string);
  fin.setHours(23, 59, 59, 999);

  // Usar query raw para obtener estadísticas por producto y estado
  const estadisticas: any = await prisma.$queryRaw`
    SELECT
      p.categoria,
      p.nombre as tipo,
      fe.nombre as estado,
      COUNT(fp.id) as cantidad
    FROM formularios_productos fp
    INNER JOIN formularios f ON fp.formulario_id = f.id
    INNER JOIN productos p ON fp.producto_id = p.id
    INNER JOIN formularios_estados fe ON f.estado_id = fe.id
    WHERE f.fecha >= ${inicio} AND f.fecha <= ${fin}
    GROUP BY p.categoria, p.nombre, fe.nombre
    ORDER BY p.categoria, p.nombre, fe.nombre
  `;

  // Reorganizar datos
  const resultado: any = {};
  estadisticas.forEach((row: any) => {
    const categoria = row.categoria || 'Sin categoría';
    const tipo = row.tipo;
    const estado = row.estado;
    const cantidad = Number(row.cantidad);

    if (!resultado[categoria]) {
      resultado[categoria] = {
        total: 0,
        tipos: {}
      };
    }

    if (!resultado[categoria].tipos[tipo]) {
      resultado[categoria].tipos[tipo] = {
        total: 0,
        porEstado: {}
      };
    }

    resultado[categoria].total += cantidad;
    resultado[categoria].tipos[tipo].total += cantidad;
    resultado[categoria].tipos[tipo].porEstado[estado] = cantidad;
  });

  // Contar total de formularios
  const totalFormularios = await prisma.formulario.count({
    where: {
      fecha: {
        gte: inicio,
        lte: fin
      }
    }
  });

  res.json({
    success: true,
    data: {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      totalFormularios,
      estadisticas: resultado
    }
  });
});

// ============================================
// REPORTE: PRODUCTIVIDAD POR USUARIO
// ============================================
export const getReporteProductividad = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    throw new AppError('Se requieren fechas de inicio y fin', 400);
  }

  const inicio = new Date(fechaInicio as string);
  const fin = new Date(fechaFin as string);
  fin.setHours(23, 59, 59, 999);

  // Obtener todos los usuarios
  const usuarios = await prisma.usuario.findMany({
    include: {
      tipo: true
    }
  });

  const productividad = await Promise.all(usuarios.map(async (usuario) => {
    // Formularios creados (AAU)
    const formulariosCreados = await prisma.formulario.count({
      where: {
        usuarioId: usuario.id,
        fecha: {
          gte: inicio,
          lte: fin
        }
      }
    });

    // Registros asentados (Registro)
    const registrosAsentados = await prisma.registro.count({
      where: {
        usuarioAsentamientoId: usuario.id,
        fechaAsentamiento: {
          gte: inicio,
          lte: fin
        }
      }
    });

    // Cajas abiertas (Cajero)
    const cajasAbiertas = await prisma.caja.count({
      where: {
        usuarioId: usuario.id,
        fecha: {
          gte: inicio,
          lte: fin
        }
      }
    });

    // Facturas generadas
    const facturas = await prisma.factura.findMany({
      where: {
        caja: {
          usuarioId: usuario.id
        },
        fecha: {
          gte: inicio,
          lte: fin
        }
      }
    });

    const totalFacturado = facturas.reduce((sum, f) => sum + Number(f.total), 0);

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombrecompleto,
        codigo: usuario.codigo,
        tipo: usuario.tipo?.nombre || 'Sin tipo'
      },
      metricas: {
        formulariosCreados,
        registrosAsentados,
        cajasAbiertas,
        facturasGeneradas: facturas.length,
        totalFacturado
      }
    };
  }));

  // Filtrar solo usuarios con actividad
  const usuariosActivos = productividad.filter(u =>
    u.metricas.formulariosCreados > 0 ||
    u.metricas.registrosAsentados > 0 ||
    u.metricas.cajasAbiertas > 0
  );

  res.json({
    success: true,
    data: {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      totalUsuariosActivos: usuariosActivos.length,
      productividad: usuariosActivos
    }
  });
});

// ============================================
// REPORTE: TIEMPOS DE PROCESAMIENTO
// ============================================
export const getReporteTiempos = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    throw new AppError('Se requieren fechas de inicio y fin', 400);
  }

  const inicio = new Date(fechaInicio as string);
  const fin = new Date(fechaFin as string);
  fin.setHours(23, 59, 59, 999);

  // Obtener registros completados en el período
  const registros = await prisma.registro.findMany({
    where: {
      fechaAsentamiento: {
        gte: inicio,
        lte: fin
      }
    },
    include: {
      formularioProducto: {
        include: {
          formulario: true
        }
      }
    }
  });

  const tiempos: any = {
    asentamiento: [],
    generacionCertificado: [],
    firma: [],
    entrega: [],
    total: []
  };

  registros.forEach(reg => {
    const fechaCreacion = reg.formularioProducto.formulario.fecha;

    // Tiempo hasta asentamiento
    if (reg.fechaAsentamiento) {
      const diffAsentamiento = reg.fechaAsentamiento.getTime() - fechaCreacion.getTime();
      const diasAsentamiento = diffAsentamiento / (1000 * 60 * 60 * 24);
      tiempos.asentamiento.push(diasAsentamiento);
    }

    // Tiempo hasta generación de certificado
    if (reg.fechaGeneracionCert && reg.fechaAsentamiento) {
      const diffCert = reg.fechaGeneracionCert.getTime() - reg.fechaAsentamiento.getTime();
      const diasCert = diffCert / (1000 * 60 * 60 * 24);
      tiempos.generacionCertificado.push(diasCert);
    }

    // Tiempo hasta firma
    if (reg.fechaFirmaCert && reg.fechaGeneracionCert) {
      const diffFirma = reg.fechaFirmaCert.getTime() - reg.fechaGeneracionCert.getTime();
      const diasFirma = diffFirma / (1000 * 60 * 60 * 24);
      tiempos.firma.push(diasFirma);
    }

    // Tiempo hasta entrega
    if (reg.fechaEntregado && fechaCreacion) {
      const diffTotal = reg.fechaEntregado.getTime() - fechaCreacion.getTime();
      const diasTotal = diffTotal / (1000 * 60 * 60 * 24);
      tiempos.total.push(diasTotal);
    }
  });

  // Calcular promedios
  const calcularPromedio = (arr: number[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  };

  const promedios = {
    asentamiento: calcularPromedio(tiempos.asentamiento),
    generacionCertificado: calcularPromedio(tiempos.generacionCertificado),
    firma: calcularPromedio(tiempos.firma),
    entrega: calcularPromedio(tiempos.total)
  };

  res.json({
    success: true,
    data: {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      registrosProcesados: registros.length,
      promediosDias: promedios
    }
  });
});

// ============================================
// REPORTE: CUELLOS DE BOTELLA
// ============================================
export const getReporteCuellosBotella = asyncHandler(async (req: Request, res: Response) => {
  // Obtener conteo de formularios por estado
  const estadosFormularios = await prisma.formularioEstado.findMany({
    include: {
      _count: {
        select: {
          formularios: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });

  // Obtener conteo de registros por estado
  const estadosRegistros = await prisma.registroEstado.findMany({
    include: {
      _count: {
        select: {
          registros: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });

  // Formularios devueltos con motivos
  const formulariosDevueltos = await prisma.formulario.findMany({
    where: {
      estado: {
        nombre: 'DEVUELTO'
      }
    },
    select: {
      id: true,
      codigo: true,
      observaciones: true,
      fecha: true
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 20
  });

  res.json({
    success: true,
    data: {
      formulariosPorEstado: estadosFormularios.map(e => ({
        estado: e.nombre,
        cantidad: e._count.formularios
      })),
      registrosPorEstado: estadosRegistros.map(e => ({
        estado: e.nombre,
        cantidad: e._count.registros
      })),
      formulariosDevueltos
    }
  });
});

// ============================================
// REPORTE: DASHBOARD GENERAL
// ============================================
export const getDashboardGeneral = asyncHandler(async (req: Request, res: Response) => {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  // Totales del mes
  const [
    formulariosEsteMes,
    registrosEsteMes,
    facturasEsteMes,
    cajasAbiertas
  ] = await Promise.all([
    prisma.formulario.count({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes
        }
      }
    }),
    prisma.registro.count({
      where: {
        fechaAsentamiento: {
          gte: inicioMes,
          lte: finMes
        }
      }
    }),
    prisma.factura.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes
        },
        estado: {
          nombre: 'Pagada'
        }
      }
    }),
    prisma.caja.count({
      where: {
        estado: {
          nombre: 'Abierta'
        }
      }
    })
  ]);

  const totalFacturadoMes = facturasEsteMes.reduce((sum, f) => sum + Number(f.total), 0);

  // Pendientes
  const [
    formulariosPendientesPago,
    registrosPendientesAsentamiento,
    certificadosPendientesFirma
  ] = await Promise.all([
    prisma.formulario.count({
      where: {
        estado: {
          nombre: {
            in: ['PENDIENTE_PAGO', 'PAGADO_PARCIAL']
          }
        }
      }
    }),
    prisma.registro.count({
      where: {
        estado: {
          nombre: 'PENDIENTE_ASENTAMIENTO'
        }
      }
    }),
    prisma.registro.count({
      where: {
        estado: {
          nombre: 'ENVIADO_FIRMA'
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      estadisticasMes: {
        formularios: formulariosEsteMes,
        registros: registrosEsteMes,
        facturas: facturasEsteMes.length,
        totalFacturado: totalFacturadoMes
      },
      pendientes: {
        formulariosPendientesPago,
        registrosPendientesAsentamiento,
        certificadosPendientesFirma
      },
      cajasAbiertas
    }
  });
});
