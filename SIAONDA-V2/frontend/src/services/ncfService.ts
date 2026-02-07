import { api } from './api';

export interface SecuenciaNcf {
  id: number;
  tipoComprobante: string;
  serie: string;
  numeroInicial: bigint;
  numeroFinal: bigint;
  numeroActual: bigint;
  fechaVencimiento: string;
  activo: boolean;
  observaciones: string | null;
  creadoEn: string;
}

export interface SecuenciaNcfInput {
  tipoComprobante: string;
  serie: string;
  numeroInicial: string;
  numeroFinal: string;
  fechaVencimiento: string;
  observaciones?: string;
}

export interface EstadisticasNcf {
  tipoComprobante: string;
  serie: string;
  numeroInicial: string;
  numeroFinal: string;
  numeroActual: string;
  disponibles: number;
  utilizados: number;
  porcentajeUtilizado: number;
  fechaVencimiento: string;
  diasRestantes: number;
  activo: boolean;
}

const ncfService = {
  // Obtener todas las secuencias NCF
  async getSecuencias(): Promise<SecuenciaNcf[]> {
    const response = await api.get('/ncf');
    return response.data;
  },

  // Obtener una secuencia específica
  async getSecuencia(id: number): Promise<SecuenciaNcf> {
    const response = await api.get(`/ncf/${id}`);
    return response.data;
  },

  // Crear nueva secuencia NCF
  async crearSecuencia(data: SecuenciaNcfInput): Promise<SecuenciaNcf> {
    const payload = {
      ...data,
      numeroInicial: parseInt(data.numeroInicial),
      numeroFinal: parseInt(data.numeroFinal)
    };
    const response = await api.post('/ncf', payload);
    return response.data;
  },

  // Desactivar secuencia NCF
  async desactivarSecuencia(id: number): Promise<{ message: string }> {
    const response = await api.put(`/ncf/${id}/desactivar`);
    return response.data;
  },

  // Obtener estadísticas de uso de NCF
  async getEstadisticas(): Promise<EstadisticasNcf[]> {
    const response = await api.get('/ncf/estadisticas');
    return response.data;
  },

  // Obtener siguiente NCF disponible (sin consumir)
  async obtenerSiguienteNcf(tipo: string): Promise<{ ncf: string; disponibles: number }> {
    const response = await api.get(`/ncf/siguiente/${tipo}`);
    return response.data;
  }
};

export default ncfService;
