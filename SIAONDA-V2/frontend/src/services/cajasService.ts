import { api } from './api';

export interface CajaEstado {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Usuario {
  id: number;
  codigo: string;
  nombrecompleto: string;
}

export interface Caja {
  id: number;
  codigo: string;
  descripcion: string;
  fecha: string;
  horaApertura: string;
  horaCierre: string | null;
  montoInicial: number;
  montoFinal: number | null;
  totalFacturas: number | null;
  diferencia: number | null;
  observaciones: string | null;
  esGratuita: boolean;
  motivoGratuito: string | null;
  estadoId: number;
  usuarioId: number;
  estado: CajaEstado;
  usuario: Usuario;
  _count?: {
    facturas: number;
  };
}

export interface AbrirCajaData {
  descripcion: string;
  observaciones?: string;
  esGratuita?: boolean;
  motivoGratuito?: string;
}

const cajasService = {
  // Obtener todas las cajas con paginación y filtros
  getCajas: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    estadoId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    const response = await api.get('/cajas', { params });
    return response.data;
  },

  // Obtener una caja por ID
  getCaja: async (id: number) => {
    const response = await api.get(`/cajas/${id}`);
    return response.data;
  },

  // Obtener caja activa del usuario actual
  getCajaActiva: async (): Promise<Caja | null> => {
    const response = await api.get('/cajas/usuario/activa');
    return response.data;
  },

  // Abrir una caja
  abrirCaja: async (data: AbrirCajaData) => {
    const response = await api.post('/cajas/abrir', data);
    return response.data;
  },

  // Cerrar una caja (simplificado como en V1)
  cerrarCaja: async (id: number) => {
    const response = await api.post(`/cajas/${id}/cerrar`, {});
    return response.data;
  },

  // Obtener reporte de cierre de caja
  getReporteCierre: async (id: number) => {
    const response = await api.get(`/cajas/${id}/reporte`);
    return response.data;
  },

  // Obtener estados de caja
  getEstadosCaja: async (): Promise<CajaEstado[]> => {
    const response = await api.get('/cajas/estados');
    return response.data;
  },

  // Eliminar una caja
  deleteCaja: async (id: number) => {
    const response = await api.delete(`/cajas/${id}`);
    return response.data;
  }
};

export default cajasService;
