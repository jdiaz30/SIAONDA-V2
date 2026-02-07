import { api } from './api';

export interface ObraProduccion {
  titulo: string;
  campos: Array<{
    campoId: number;
    valor: string;
  }>;
}

export interface CreateProduccionData {
  tituloProduccion: string;
  productoId: number;
  clientes: Array<{
    clienteId: number;
    tipoRelacion: string;
  }>;
  obras: ObraProduccion[];
  observaciones?: string;
}

export interface Produccion {
  id: number;
  codigo: string;
  fecha: string;
  tituloProduccion: string;
  esProduccion: boolean;
  montoTotal: number;
  estado: {
    id: number;
    nombre: string;
    descripcion: string | null;
  };
  usuario: {
    id: number;
    nombrecompleto: string;
  };
  productos: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    producto: {
      id: number;
      codigo: string;
      nombre: string;
      categoria: string;
    };
  }>;
  clientes: Array<{
    id: number;
    clienteId: number;
    tipoRelacion: string;
    cliente: {
      id: number;
      codigo: string;
      nombrecompleto: string;
      identificacion: string;
    };
  }>;
  obrasHijas?: Array<{
    id: number;
    codigo: string;
    estado: {
      nombre: string;
    };
    productos: Array<{
      id: number;
      campos: Array<{
        id: number;
        valor: string;
        campo: {
          id: number;
          nombre: string;
          titulo: string;
        };
      }>;
    }>;
  }>;
  factura?: {
    id: number;
    codigo: string;
    total: number;
    estado: {
      nombre: string;
    };
  } | null;
  _count?: {
    obrasHijas: number;
  };
}

const produccionesService = {
  createProduccion: async (data: CreateProduccionData): Promise<{
    produccion: Produccion;
    obras: any[];
    totalObras: number;
  }> => {
    const response = await api.post('/producciones', data);
    return response.data.data; // Return full data object with produccion AND obras
  },

  getProducciones: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    estadoId?: number;
  }): Promise<{
    producciones: Produccion[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> => {
    const response = await api.get('/producciones', { params });
    return response.data.data;
  },

  getProduccion: async (id: number): Promise<Produccion> => {
    const response = await api.get(`/producciones/${id}`);
    return response.data.data;
  }
};

export default produccionesService;
