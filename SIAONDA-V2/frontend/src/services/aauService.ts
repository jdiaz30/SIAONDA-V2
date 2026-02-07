import { api } from './api';

// Tipos
export interface Formulario {
  id: number;
  codigo: string;
  fecha: string;
  estadoId: number;
  estado: {
    id: number;
    nombre: string;
  };
  usuarioId: number;
  usuario: {
    id: number;
    nombrecompleto: string;
  };
  facturaId?: number;
  factura?: {
    id: number;
    numeroFactura: string;
    total: number;
  };
  firma?: string;
  observaciones?: string;
  mensajeDevolucion?: string;
  fechaDevolucion?: string;
  montoTotal: number;

  // Relaciones
  clientes: FormularioCliente[];
  productos: FormularioProducto[];
  archivos: FormularioArchivo[];

  // Vinculación con solicitudes IRC
  solicitudIrc?: {
    id: number;
    codigo: string;
    tipoSolicitud: string;
    nombreEmpresa: string;
    rnc: string;
    estadoId: number;
    estado: {
      id: number;
      nombre: string;
    };
    categoriaIrc?: {
      id: number;
      codigo: string;
      nombre: string;
      precio: number;
    };
    factura?: {
      id: number;
      total: number;
    };
  };
}

export interface FormularioCliente {
  id: number;
  clienteId: number;
  cliente: {
    id: number;
    codigo: string;
    nombrecompleto: string;
    identificacion: string;
  };
  tipoRelacion: string;
}

export interface FormularioProducto {
  id: number;
  productoId: number;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    categoria: string;
  };
  cantidad: number;
}

export interface FormularioArchivo {
  id: number;
  nombreOriginal: string;
  nombreSistema: string;
  ruta: string;
  tamano: number;
  mimeType: string;
}

export interface EstadisticasDashboard {
  pendientes: number;
  enRevision: number;
  devueltos: number;
  certificados: number;
  recibidosMes: number;
  asentadosMes: number;
  entregadosMes: number;
  devueltosMes: number;
}

export interface HistorialFormulario {
  id: number;
  accion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  mensaje?: string;
  camposModificados?: any;
  usuario: {
    id: number;
    nombrecompleto: string;
  };
  createdAt: string;
}

// Servicio
const aauService = {
  // Obtener estadísticas del dashboard
  async getEstadisticasDashboard(): Promise<EstadisticasDashboard> {
    const response = await api.get('/aau/estadisticas/dashboard');
    return response.data;
  },

  // Obtener formularios con filtros
  async getFormularios(params?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    buscar?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/aau/formularios', { params });
    return response.data;
  },

  // Obtener un formulario por ID
  async getFormulario(id: number): Promise<Formulario> {
    const response = await api.get(`/aau/formularios/${id}`);
    return response.data;
  },

  // Crear nuevo formulario
  async createFormulario(data: any) {
    const response = await api.post('/aau/formularios', data);
    return response.data;
  },

  // Actualizar formulario
  async updateFormulario(id: number, data: any) {
    const response = await api.put(`/aau/formularios/${id}`, data);
    return response.data;
  },

  // Eliminar formulario
  async deleteFormulario(id: number) {
    const response = await api.delete(`/aau/formularios/${id}`);
    return response.data;
  },

  // Enviar formulario a Registro
  async enviarARegistro(id: number) {
    const response = await api.post(`/aau/formularios/${id}/enviar-registro`);
    return response.data;
  },

  // Corregir y reenviar formulario devuelto
  async corregirYReenviar(id: number, data: any) {
    const response = await api.post(`/aau/formularios/${id}/corregir-reenviar`, data);
    return response.data;
  },

  // Registrar entrega de certificado
  async registrarEntrega(id: number, data: { firmaCliente?: string }) {
    const response = await api.post(`/aau/formularios/${id}/entregar`, data);
    return response.data;
  },

  // Obtener formularios devueltos
  async getFormulariosDevueltos() {
    const response = await api.get('/aau/formularios/devueltos');
    return response.data;
  },

  // Obtener formularios en revisión
  async getFormulariosEnRevision() {
    const response = await api.get('/aau/formularios/en-revision');
    return response.data;
  },

  // Obtener certificados pendientes de entrega (obras + IRC)
  async getCertificadosPendientes() {
    const response = await api.get('/aau/formularios/pendientes-entrega');
    return response.data;
  },

  // Entregar certificado (unificado para obras e IRC)
  async entregarCertificado(id: number, tipo: 'OBRA' | 'IRC', formData?: FormData) {
    if (formData) {
      // Si hay formData, usarlo (incluye nombre, cédula y documento legal)
      const response = await api.post(`/aau/certificados/${id}/entregar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      // Versión anterior sin formData
      const response = await api.post(`/aau/certificados/${id}/entregar`, { tipo });
      return response.data;
    }
  },

  // Obtener historial de un formulario
  async getHistorial(id: number): Promise<HistorialFormulario[]> {
    const response = await api.get(`/aau/formularios/${id}/historial`);
    return response.data;
  },

  // Obtener historial de entregas de certificados
  async getHistorialEntregas(params?: { tipo?: 'OBRA' | 'IRC'; fechaDesde?: string; fechaHasta?: string }) {
    const response = await api.get('/aau/historial-entregas', { params });
    return response.data.data;
  },
};

export default aauService;
