import { api } from './api';

export interface ReporteIngresos {
  periodo: {
    inicio: string;
    fin: string;
  };
  resumen: {
    ingresosReales: number;
    ingresosPotenciales: number;
    totalGeneral: number;
    cajasGratuitas: number;
    cajasNormales: number;
    totalCajas: number;
  };
  detalles: Array<{
    cajaId: number;
    codigo: string;
    fecha: string;
    usuario: string;
    esGratuita: boolean;
    motivoGratuito: string | null;
    totalFacturas: number;
    montoTotal: number;
  }>;
}

export interface ReporteFormularios {
  periodo: {
    inicio: string;
    fin: string;
  };
  totalFormularios: number;
  estadisticas: any;
}

export interface ReporteProductividad {
  periodo: {
    inicio: string;
    fin: string;
  };
  totalUsuariosActivos: number;
  productividad: Array<{
    usuario: {
      id: number;
      nombre: string;
      codigo: string;
      tipo: string;
    };
    metricas: {
      formulariosCreados: number;
      registrosAsentados: number;
      cajasAbiertas: number;
      facturasGeneradas: number;
      totalFacturado: number;
    };
  }>;
}

export interface ReporteTiempos {
  periodo: {
    inicio: string;
    fin: string;
  };
  registrosProcesados: number;
  promediosDias: {
    asentamiento: number;
    generacionCertificado: number;
    firma: number;
    entrega: number;
  };
}

export interface ReporteCuellosBotella {
  formulariosPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
  registrosPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
  formulariosDevueltos: Array<{
    id: number;
    codigo: string;
    observaciones: string | null;
    fecha: string;
  }>;
}

export interface DashboardGeneral {
  estadisticasMes: {
    formularios: number;
    registros: number;
    facturas: number;
    totalFacturado: number;
  };
  pendientes: {
    formulariosPendientesPago: number;
    registrosPendientesAsentamiento: number;
    certificadosPendientesFirma: number;
  };
  cajasAbiertas: number;
}

export interface MetricasRegistros {
  totalRegistros: number;
  registrosPorEstado: Array<{ estado: string; cantidad: number }>;
  usoIA: {
    conIA: number;
    sinIA: number;
  };
  certificados: {
    generados: number;
    entregados: number;
    pendientes: number;
  };
  registrosPorTipo: Array<{ tipo: string; cantidad: number }>;
  tendenciaMensual: Array<{ mes: string; cantidad: number }>;
}

export interface DatosExportacion {
  fecha_formulario: string;
  fecha_certificado: string | null;
  estado: string;
  codigo_formulario: string;
  numero_obra: string;
  codigo_producto: string;
  producto: string;
  nombre_obra: string;
}

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  tipoObra?: string;
  estado?: string;
  usoIA?: string;
}

const reportesService = {
  getDashboardGeneral: async (): Promise<DashboardGeneral> => {
    const response = await api.get('/reportes/dashboard');
    return response.data.data;
  },

  getReporteIngresos: async (fechaInicio: string, fechaFin: string): Promise<ReporteIngresos> => {
    const response = await api.get('/reportes/ingresos', {
      params: { fechaInicio, fechaFin }
    });
    return response.data.data;
  },

  getReporteFormulariosPorTipo: async (fechaInicio: string, fechaFin: string): Promise<ReporteFormularios> => {
    const response = await api.get('/reportes/formularios-por-tipo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data.data;
  },

  getReporteProductividad: async (fechaInicio: string, fechaFin: string): Promise<ReporteProductividad> => {
    const response = await api.get('/reportes/productividad', {
      params: { fechaInicio, fechaFin }
    });
    return response.data.data;
  },

  getReporteTiempos: async (fechaInicio: string, fechaFin: string): Promise<ReporteTiempos> => {
    const response = await api.get('/reportes/tiempos', {
      params: { fechaInicio, fechaFin }
    });
    return response.data.data;
  },

  getReporteCuellosBotella: async (): Promise<ReporteCuellosBotella> => {
    const response = await api.get('/reportes/cuellos-botella');
    return response.data.data;
  },

  // NUEVOS ENDPOINTS PARA REPORTERÍA DE REGISTROS

  getMetricasRegistros: async (filtros?: FiltrosReporte): Promise<MetricasRegistros> => {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);

    const response = await api.get(`/reportes/metricas-registros?${params.toString()}`);
    return response.data.data;
  },

  getDatosExportacion: async (filtros?: FiltrosReporte): Promise<DatosExportacion[]> => {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipoObra) params.append('tipoObra', filtros.tipoObra);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.usoIA) params.append('usoIA', filtros.usoIA);

    const response = await api.get(`/reportes/exportacion-registros?${params.toString()}`);
    return response.data.data;
  },

  exportarExcel: async (filtros?: FiltrosReporte): Promise<void> => {
    const datos = await reportesService.getDatosExportacion(filtros);

    // Convertir a formato CSV compatible con Excel
    const headers = [
      'fecha_formulario',
      'fecha_certificado',
      'estado',
      'codigo_formulario',
      'numero_obra',
      'codigo_producto',
      'producto',
      'nombre_obra'
    ];

    const csvContent = [
      headers.join(','),
      ...datos.map(row => [
        row.fecha_formulario ? new Date(row.fecha_formulario).toISOString().split('T')[0] : '',
        row.fecha_certificado ? new Date(row.fecha_certificado).toISOString().split('T')[0] : '',
        `"${row.estado}"`,
        row.codigo_formulario,
        row.numero_obra,
        row.codigo_producto,
        `"${row.producto}"`,
        `"${row.nombre_obra}"`
      ].join(','))
    ].join('\n');

    // Crear el blob y descargarlo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Registros_${fechaActual}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default reportesService;
