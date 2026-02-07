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
  }
};

export default reportesService;
