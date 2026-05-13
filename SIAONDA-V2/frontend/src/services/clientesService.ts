import { api } from './api';

export interface Cliente {
  id: number;
  codigo: string;
  identificacion: string;
  tipoIdentificacion: string | null;
  nombre: string;
  apellido: string | null;
  nombrecompleto: string;
  seudonimo: string | null;
  genero: string | null;

  // Dirección
  direccion: string | null;
  municipio: string | null;
  sector: string | null;
  provincia: string | null;

  // Contacto
  telefono: string | null;
  movil: string | null;
  correo: string | null;

  // Clasificación
  tipoId: number;
  nacionalidadId: number;

  // Otros
  fechaFallecimiento: string | null;

  tipo: {
    id: number;
    nombre: string;
  };
  nacionalidad: {
    id: number;
    nombre: string;
  };
  visitas?: Array<{
    id: number;
    fechaEntrada: string;
    fechaSalida: string | null;
    tipoVisita: string;
    departamento: string | null;
  }>;
  archivos?: Array<{
    id: number;
    nombre: string;
    ruta: string;
    tipo: string;
    tamano: number;
    creadoEn: string;
  }>;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ClienteTipo {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface ClienteNacionalidad {
  id: number;
  nombre: string;
  codigo: string | null;
}

export interface CreateClienteDto {
  identificacion: string;
  tipoIdentificacion?: string;
  nombre: string;
  apellido?: string;
  seudonimo?: string;
  genero?: string;

  // Dirección
  direccion?: string;
  municipio?: string;
  sector?: string;
  provincia?: string;

  // Contacto
  telefono?: string;
  movil?: string;
  correo?: string;

  // Clasificación
  tipoId: number;
  nacionalidadId: number;

  // Otros
  fechaFallecimiento?: string;
}

export interface UpdateClienteDto extends Partial<CreateClienteDto> {}

export const clientesService = {
  getClientes: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/clientes', { params });
    return response.data;
  },

  getCliente: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  createCliente: async (data: CreateClienteDto): Promise<Cliente> => {
    const response = await api.post('/clientes', data);
    return response.data;
  },

  updateCliente: async (id: number, data: UpdateClienteDto): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },

  deleteCliente: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },

  buscarPorIdentificacion: async (identificacion: string): Promise<Cliente | null> => {
    try {
      const response = await api.get(`/clientes/buscar/identificacion/${identificacion}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  buscarClientes: async (query: string): Promise<Cliente[]> => {
    const response = await api.get(`/clientes/buscar?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getTipos: async (): Promise<ClienteTipo[]> => {
    const response = await api.get('/clientes/tipos');
    return response.data;
  },

  getNacionalidades: async (): Promise<ClienteNacionalidad[]> => {
    const response = await api.get('/clientes/nacionalidades');
    const nacionalidades = response.data;

    // Poner República Dominicana primero
    const rdIndex = nacionalidades.findIndex((n: ClienteNacionalidad) =>
      n.nombre.toLowerCase().includes('dominicana') ||
      n.nombre.toLowerCase().includes('república dominicana')
    );

    if (rdIndex > 0) {
      const rd = nacionalidades.splice(rdIndex, 1)[0];
      nacionalidades.unshift(rd);
    }

    return nacionalidades;
  }
};

export default clientesService;
