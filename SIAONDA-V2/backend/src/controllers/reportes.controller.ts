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

// ============================================
// REPORTE: MÉTRICAS DE REGISTROS
// ============================================
export const getMetricasRegistros = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin, sucursalId } = req.query;

  const dateFilter: any = {};
  if (fechaInicio) dateFilter.gte = new Date(fechaInicio as string);
  if (fechaFin) {
    const fin = new Date(fechaFin as string);
    fin.setHours(23, 59, 59, 999);
    dateFilter.lte = fin;
  }

  const whereClause: any = Object.keys(dateFilter).length > 0
    ? { creadoEn: dateFilter }
    : {};

  // Filtro por sucursal (si aplica)
  if (sucursalId && sucursalId !== 'todos') {
    whereClause.formularioProducto = {
      formulario: {
        usuario: {
          sucursalId: parseInt(sucursalId as string)
        }
      }
    };
  }

  // Obtener TODOS los registros para poder agrupar producciones
  const todosLosRegistros = await prisma.registro.findMany({
    where: whereClause,
    include: {
      formularioProducto: {
        include: {
          formulario: true,
          campos: {
            include: {
              campo: true
            }
          }
        }
      }
    }
  });

  // Función helper para agrupar producciones
  const agruparProducciones = (registros: any[]) => {
    const produccionesVistas = new Set<number>();
    const registrosAgrupados: any[] = [];

    for (const registro of registros) {
      const formulario = registro.formularioProducto.formulario;
      const esProduccion = formulario.esProduccion || formulario.produccionPadreId !== null;

      if (esProduccion) {
        const formularioPadreId = formulario.produccionPadreId || formulario.id;
        if (!produccionesVistas.has(formularioPadreId)) {
          produccionesVistas.add(formularioPadreId);
          registrosAgrupados.push(registro);
        }
      } else {
        registrosAgrupados.push(registro);
      }
    }

    return registrosAgrupados;
  };

  const registrosUnicos = agruparProducciones(todosLosRegistros);
  const totalRegistros = registrosUnicos.length;

  // Registros por estado - con agrupación de producciones
  const estadosMap = new Map<number, number>();

  for (const registro of registrosUnicos) {
    const estadoId = registro.estadoId;
    estadosMap.set(estadoId, (estadosMap.get(estadoId) || 0) + 1);
  }

  const estadosData = await Promise.all(
    Array.from(estadosMap.entries()).map(async ([estadoId, cantidad]) => {
      const estado = await prisma.registroEstado.findUnique({
        where: { id: estadoId }
      });
      // Formatear nombre del estado: reemplazar guiones bajos con espacios y capitalizar
      const nombreFormateado = estado?.nombre
        ? estado.nombre.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Desconocido';
      return {
        estado: nombreFormateado,
        cantidad: cantidad
      };
    })
  );

  // Registros con IA vs sin IA - con agrupación de producciones
  let registrosConIA = 0;
  let registrosSinIA = 0;

  for (const registro of registrosUnicos) {
    const campos = registro.formularioProducto.campos;
    const campoIA = campos.find((c: any) => c.campo.campo === 'uso_ia');

    if (campoIA) {
      // El valor puede ser 'SI', 'NO', 'true', 'false' dependiendo del tipo de registro
      const valorIA = campoIA.valor?.toUpperCase();
      if (valorIA === 'SI' || valorIA === 'TRUE') {
        registrosConIA++;
      } else if (valorIA === 'NO' || valorIA === 'FALSE') {
        registrosSinIA++;
      }
    }
  }

  // Certificados generados y entregados - con agrupación de producciones
  const certificadosGenerados = registrosUnicos.filter(r => r.certificadoGenerado !== null).length;

  // Para certificados entregados, contamos desde historial_entregas con agrupación de producciones
  const whereEntregas: any = {
    tipo: 'OBRA'
  };

  // Aplicar filtro de fecha si existe
  if (Object.keys(dateFilter).length > 0) {
    whereEntregas.fechaEntrega = dateFilter;
  }

  // Aplicar filtro de sucursal si existe
  if (sucursalId && sucursalId !== 'todos') {
    whereEntregas.formulario = {
      usuario: {
        sucursalId: parseInt(sucursalId as string)
      }
    };
  }

  const entregasObras = await prisma.historialEntrega.findMany({
    where: whereEntregas,
    include: {
      formulario: true
    }
  });

  // Aplicar agrupación de producciones a entregas
  const produccionesEntregadas = new Set<number>();
  let certificadosEntregados = 0;

  for (const entrega of entregasObras) {
    if (entrega.formulario) {
      const esProduccion = entrega.formulario.esProduccion || entrega.formulario.produccionPadreId !== null;
      if (esProduccion) {
        const formularioPadreId = entrega.formulario.produccionPadreId || entrega.formulario.id;
        if (!produccionesEntregadas.has(formularioPadreId)) {
          produccionesEntregadas.add(formularioPadreId);
          certificadosEntregados++;
        }
      } else {
        certificadosEntregados++;
      }
    }
  }

  // Registros por tipo de obra - con agrupación de producciones
  const tiposMap = new Map<string, number>();

  for (const registro of registrosUnicos) {
    const tipo = registro.tipoObra || 'Sin especificar';
    tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
  }

  const tiposData = Array.from(tiposMap.entries()).map(([tipo, cantidad]) => ({
    tipo: tipo,
    cantidad: cantidad
  }));

  // Tendencia mensual (últimos 6 meses)
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  const registrosMensuales = await prisma.$queryRaw<Array<{ mes: string; cantidad: bigint }>>`
    SELECT
      TO_CHAR(creado_en, 'YYYY-MM') as mes,
      COUNT(*)::bigint as cantidad
    FROM registros
    WHERE creado_en >= ${seisMesesAtras}
    GROUP BY TO_CHAR(creado_en, 'YYYY-MM')
    ORDER BY mes ASC
  `;

  const tendenciaMensual = registrosMensuales.map(item => ({
    mes: item.mes,
    cantidad: Number(item.cantidad)
  }));

  res.json({
    success: true,
    data: {
      totalRegistros,
      registrosPorEstado: estadosData,
      usoIA: {
        conIA: registrosConIA,
        sinIA: registrosSinIA
      },
      certificados: {
        generados: certificadosGenerados,
        entregados: certificadosEntregados,
        pendientes: totalRegistros - certificadosGenerados
      },
      registrosPorTipo: tiposData,
      tendenciaMensual
    }
  });
});

// ============================================
// REPORTE: DATOS PARA EXPORTAR REGISTROS
// ============================================
export const getDatosExportacionRegistros = asyncHandler(async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin, tipoObra, estado, usoIA } = req.query;

  // Construir filtros
  const whereClause: any = {};

  if (fechaInicio || fechaFin) {
    whereClause.creadoEn = {};
    if (fechaInicio) whereClause.creadoEn.gte = new Date(fechaInicio as string);
    if (fechaFin) {
      const fin = new Date(fechaFin as string);
      fin.setHours(23, 59, 59, 999);
      whereClause.creadoEn.lte = fin;
    }
  }

  if (tipoObra && tipoObra !== 'todos') {
    whereClause.tipoObra = tipoObra;
  }

  if (estado && estado !== 'todos') {
    const estadoObj = await prisma.registroEstado.findFirst({
      where: { nombre: estado as string }
    });
    if (estadoObj) whereClause.estadoId = estadoObj.id;
  }

  // Obtener registros
  const registros = await prisma.registro.findMany({
    where: whereClause,
    include: {
      formularioProducto: {
        include: {
          formulario: {
            include: {
              clientes: {
                include: { cliente: true }
              }
            }
          },
          producto: true,
          campos: {
            include: { campo: true }
          }
        }
      },
      estado: true
    },
    orderBy: { creadoEn: 'desc' }
  });

  // Filtrar por uso de IA si se especificó
  let registrosFiltrados = registros;
  if (usoIA && usoIA !== 'todos') {
    const usoIABool = usoIA === 'si';
    registrosFiltrados = registros.filter(registro => {
      const campoIA = registro.formularioProducto.campos.find(
        c => c.campo.campo === 'uso_ia'
      );
      return campoIA?.valor === String(usoIABool);
    });
  }

  // Formatear datos según estructura del Excel de ejemplo
  const datosExportacion = registrosFiltrados.map(registro => ({
    fecha_formulario: registro.formularioProducto.formulario.fecha,
    fecha_certificado: registro.fechaGeneracionCert,
    estado: registro.estado.nombre,
    codigo_formulario: registro.formularioProducto.formulario.codigo,
    numero_obra: registro.numeroRegistro,
    codigo_producto: registro.formularioProducto.producto.codigo,
    producto: registro.formularioProducto.producto.nombre,
    nombre_obra: registro.tituloObra
  }));

  res.json({
    success: true,
    data: datosExportacion
  });
});
