import { api } from './api';

// ============================================
// INTERFACES
// ============================================

export interface FormularioEstado {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface FormularioCliente {
  id: number;
  formularioId: number;
  clienteId: number;
  rol: string; // "Autor", "Compositor", "Intérprete", "Editor", "Productor"
  cliente: {
    id: number;
    codigo: string;
    identificacion: string;
    nombre: string;
    apellido: string | null;
    nombrecompleto: string;
    correo: string | null;
    telefono: string | null;
    tipo: {
      nombre: string;
    };
  };
}

export interface CampoDinamico {
  id: number;
  productoId: number | null;
  tipoId: number;
  titulo: string;
  campo: string;
  descripcion: string | null;
  requerido: boolean;
  orden: number;
  activo: boolean;
  tipo: {
    id: number;
    nombre: string; // 'texto' | 'numerico' | 'listado' | 'fecha' | 'archivo' | 'checkbox' | 'divisor'
    descripcion: string | null;
  };
}

export interface FormularioProductoCampo {
  id: number;
  formularioProductoId: number;
  campoId: number;
  valor: string | null;
  campo: CampoDinamico;
}

export interface FormularioProducto {
  id: number;
  formularioId: number;
  productoId: number;
  indice: number;
  indiceMadre: number | null; // Para sub-productos (ej: pistas en un álbum)
  precio: number;
  cantidad: number;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    categoria: string;
    descripcion: string | null;
  };
  campos: FormularioProductoCampo[];
}

export interface FormularioArchivo {
  id: number;
  formularioId: number;
  nombre: string;
  ruta: string;
  tipo: string;
  tamano: number;
  creadoEn: string;
}

export interface Formulario {
  id: number;
  codigo: string; // FORM-2025-0001
  fecha: string;
  estadoId: number;
  usuarioId: number;
  facturaId: number | null;
  firma: string | null; // Base64 de la firma digital
  observaciones: string | null;
  creadoEn: string;
  actualizadoEn: string;

  estado: FormularioEstado;
  usuario: {
    id: number;
    codigo: string;
    nombrecompleto: string;
  };

  // Relaciones
  clientes: FormularioCliente[];
  productos: FormularioProducto[];
  archivos: FormularioArchivo[];

  factura?: {
    id: number;
    codigo: string;
    total: number;
    estado: {
      id: number;
      nombre: string;
    };
  };
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

export interface CreateFormularioDto {
  observaciones?: string;
  firma?: string; // Base64

  productos: Array<{
    productoId: number;
    indice: number;
    indiceMadre?: number | null;
    cantidad?: number;
    campos: Array<{
      campoId: number;
      valor: string;
    }>;
  }>;

  clientes: Array<{
    clienteId: number;
    rol: string;
  }>;
}

export interface UpdateFormularioDto {
  observaciones?: string;
  estadoId?: number;
  firma?: string;
}

export interface FormularioFilters {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  clienteId?: number;
  page?: number;
  limit?: number;
}

// ============================================
// SERVICIO
// ============================================

export const formulariosService = {
  /**
   * Obtener lista de formularios con filtros opcionales
   */
  getFormularios: async (filters?: FormularioFilters): Promise<Formulario[]> => {
    const params = new URLSearchParams();

    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters?.busqueda) params.append('busqueda', filters.busqueda);
    if (filters?.clienteId) params.append('clienteId', filters.clienteId.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/formularios?${params.toString()}`);
    return response.data.formularios || [];
  },

  /**
   * Obtener un formulario específico por ID con todas sus relaciones
   */
  getFormulario: async (id: number): Promise<Formulario> => {
    const response = await api.get(`/formularios/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo formulario con productos y clientes
   */
  createFormulario: async (data: CreateFormularioDto): Promise<Formulario> => {
    const response = await api.post('/formularios', data);
    return response.data;
  },

  /**
   * Crear un formulario de registro de obra (nuevo flujo simplificado - solo campos dinámicos)
   */
  createFormularioObra: async (data: {
    autores: Array<{ clienteId: number; rol: string }>;
    productoId: number;
    datosObra: {
      camposEspecificos: Record<string, any>;
    };
  }): Promise<Formulario> => {
    const response = await api.post('/formularios/obras', data);
    return response.data.formulario;
  },

  /**
   * Crear un formulario con MÚLTIPLES obras (sistema de carrito)
   */
  createFormularioObrasMultiple: async (data: {
    autores: Array<{ clienteId: number; rol: string }>;
    obras: Array<{
      productoId: number;
      datosObra: {
        camposEspecificos: Record<string, any>;
      };
    }>;
  }): Promise<{
    formulario: Formulario;
    totalObras: number;
    montoTotal: number;
  }> => {
    const response = await api.post('/formularios/obras-multiple', data);
    return response.data;
  },

  /**
   * Actualizar un formulario existente
   */
  updateFormulario: async (id: number, data: UpdateFormularioDto): Promise<Formulario> => {
    const response = await api.put(`/formularios/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un formulario
   */
  deleteFormulario: async (id: number): Promise<void> => {
    await api.delete(`/formularios/${id}`);
  },

  /**
   * Asentar un formulario (cambiar estado a "Asentado")
   * Solo usuarios con rol ASENTAMIENTO pueden hacer esto
   */
  asentarFormulario: async (id: number): Promise<Formulario> => {
    const response = await api.post(`/formularios/${id}/asentar`);
    return response.data;
  },

  /**
   * Obtener todos los estados disponibles para formularios
   */
  getEstados: async (): Promise<FormularioEstado[]> => {
    const response = await api.get('/formularios/estados');
    return response.data;
  },

  /**
   * Obtener campos dinámicos para un tipo de producto específico
   */
  getCamposPorProducto: async (productoId: number): Promise<CampoDinamico[]> => {
    const response = await api.get(`/productos/${productoId}/campos`);
    return response.data;
  },

  /**
   * Subir múltiples archivos a un formulario
   */
  uploadArchivos: async (formularioId: number, archivos: File[], formularioProductoId?: number): Promise<FormularioArchivo[]> => {
    const formData = new FormData();
    archivos.forEach((archivo) => {
      formData.append('archivos', archivo);
    });

    // Agregar formularioProductoId si se proporciona
    if (formularioProductoId) {
      formData.append('formularioProductoId', formularioProductoId.toString());
    }

    const response = await api.post(`/formularios/${formularioId}/archivos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.archivos || response.data;
  },

  /**
   * Eliminar un archivo específico de un formulario
   */
  deleteArchivo: async (formularioId: number, archivoId: number): Promise<void> => {
    await api.delete(`/formularios/${formularioId}/archivos/${archivoId}`);
  },

  /**
   * Obtener URL para descargar/visualizar un archivo
   */
  getArchivoUrl: (ruta: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (ruta.startsWith('uploads/')) {
      return `${baseUrl}/${ruta}`;
    }
    return `${baseUrl}/uploads/${ruta}`;
  },
};
