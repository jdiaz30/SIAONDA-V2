import api from './api';

// ============================================
// TIPOS Y INTERFACES
// ============================================

// Tipo para producciones agrupadas
export interface ProduccionAgrupada {
  id: number; // ID del formulario padre
  esProduccion: true;
  tituloProduccion: string;
  tipoProducto: string;
  clientes: Array<{
    tipoRelacion: string;
    cliente: {
      id: number;
      nombrecompleto: string;
      identificacion: string;
      telefono?: string;
      correo?: string;
    };
  }>;
  obras: Registro[]; // Array de registros individuales
}

// Union type para el listado que puede tener producciones u obras individuales
export type ObraPendiente = ProduccionAgrupada | Registro;

export interface Registro {
  id: number;
  numeroRegistro: string;
  formularioProductoId: number;
  fechaAsentamiento: string;
  tipoObra: string;
  tituloObra: string;
  libroNumero: number | null;
  hojaNumero: number | null;
  certificadoGenerado: string | null;
  certificadoFirmado: string | null;
  urlFirmaGob: string | null;
  estadoId: number;
  usuarioAsentamientoId: number;
  fechaGeneracionCert: string | null;
  fechaEnvioFirma: string | null;
  fechaFirmaCert: string | null;
  fechaEnviadoAAU: string | null;
  fechaEntregado: string | null;
  observaciones: string | null;
  creadoEn: string;
  actualizadoEn: string;
  estado: {
    id: number;
    nombre: string;
    descripcion: string | null;
    orden: number;
  };
  usuarioAsentamiento: {
    nombrecompleto: string;
    correo?: string;
  };
  formularioProducto: {
    id: number;
    producto: {
      id: number;
      nombre: string;
      codigo: string;
      categoria: string;
    };
    formulario: {
      id: number;
      codigo: string;
      clientes: Array<{
        tipoRelacion: string;
        cliente: {
          id: number;
          nombrecompleto: string;
          identificacion: string;
          telefono?: string;
          correo?: string;
          archivos?: Array<{
            id: number;
            nombre: string;
            ruta: string;
            tipo: string;
            tamano: number;
          }>;
        };
      }>;
      archivos?: Array<{
        id: number;
        nombreOriginal: string;
        nombreSistema: string;
        ruta: string;
        tamano: number;
        mimeType: string;
        creadoEn: string;
      }>;
    };
    campos?: Array<{
      campo: {
        id: number;
        nombre: string;
        titulo: string;
        campo: string;
      };
      valor: string;
    }>;
    archivos?: Array<{
      id: number;
      nombreOriginal: string;
      nombreSistema: string;
      ruta: string;
      tamano: number;
      mimeType: string;
      creadoEn: string;
    }>;
  };
}

export interface EstadisticaDashboard {
  estado: string;
  cantidad: number;
}

export interface DashboardData {
  estadisticas: EstadisticaDashboard[];
  registrosRecientes: Registro[];
  totalAnioActual: number;
  anioActual: number;
}

export interface FiltrosRegistro {
  estadoId?: number;
  tipoObra?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

// ============================================
// SERVICIOS
// ============================================

// Dashboard
export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/registro/dashboard');
  return response.data.data;
};

// Obras pendientes
export const getObrasPendientes = async (): Promise<ObraPendiente[]> => {
  const response = await api.get('/registro/pendientes');
  return response.data.data.obras;
};

// Asentar obra
export const asentarObra = async (
  registroId: number,
  libroNumero: number,
  hojaNumero: number,
  observaciones?: string
): Promise<Registro> => {
  const response = await api.post('/registro/asentar', {
    registroId,
    libroNumero,
    hojaNumero,
    observaciones
  });
  return response.data.data;
};

// Asentar producción completa
export const asentarProduccion = async (
  produccionPadreId: number,
  obras: Array<{ registroId: number; libroNumero: number; hojaNumero: number }>,
  observaciones?: string
): Promise<any> => {
  const response = await api.post('/registro/asentar-produccion', {
    produccionPadreId,
    obras,
    observaciones
  });
  return response.data.data;
};

// Devolver obra a AAU
export const devolverAAAU = async (registroId: number, comentario: string): Promise<Registro> => {
  const response = await api.post('/registro/devolver-aau', {
    registroId,
    comentario
  });
  return response.data.data;
};

// Crear registros desde formulario
export const crearRegistrosDesdeFormulario = async (formularioId: number): Promise<Registro[]> => {
  const response = await api.post('/registro/crear-desde-formulario', {
    formularioId
  });
  return response.data.data.registros;
};

// Listar registros con filtros
export const getRegistros = async (filtros: FiltrosRegistro = {}) => {
  const params = new URLSearchParams();

  if (filtros.estadoId) params.append('estadoId', filtros.estadoId.toString());
  if (filtros.tipoObra) params.append('tipoObra', filtros.tipoObra);
  if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros.page) params.append('page', filtros.page.toString());
  if (filtros.limit) params.append('limit', filtros.limit.toString());

  const response = await api.get(`/registro?${params.toString()}`);
  return response.data.data;
};

// Detalle de registro
export const getRegistroDetalle = async (id: number): Promise<Registro> => {
  const response = await api.get(`/registro/${id}`);
  return response.data.data;
};

// Actualizar estado
export const actualizarEstadoRegistro = async (
  id: number,
  estadoId: number,
  observaciones?: string
): Promise<Registro> => {
  const response = await api.put(`/registro/${id}/estado`, {
    estadoId,
    observaciones
  });
  return response.data.data;
};

// Generar certificado
export const generarCertificado = async (id: number): Promise<{ registro: Registro; certificadoUrl: string }> => {
  const response = await api.post(`/registro/${id}/generar-certificado`);
  return response.data.data;
};

// Subir certificado firmado
export const subirCertificadoFirmado = async (id: number, file: File): Promise<{ registro: Registro; certificadoFirmadoUrl: string }> => {
  const formData = new FormData();
  formData.append('certificado', file);

  const response = await api.post(`/registro/${id}/subir-firmado`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

// Obtener registros listos para generar certificados
export const getRegistrosParaCertificados = async (): Promise<Registro[]> => {
  const response = await api.get('/registro/para-certificados');
  return response.data.data.registros;
};

// Obtener certificados listos para enviar a AAU
export const getCertificadosListosAAU = async (): Promise<Registro[]> => {
  const response = await api.get('/registro/listos-aau');
  return response.data.data.registros;
};

// Enviar certificados a AAU
export const enviarAAAU = async (ids: number[]): Promise<number> => {
  const response = await api.post('/registro/enviar-aau', { ids });
  return response.data.data.cantidadEnviados;
};

export default {
  getDashboard,
  getObrasPendientes,
  asentarObra,
  devolverAAAU,
  crearRegistrosDesdeFormulario,
  getRegistros,
  getRegistroDetalle,
  actualizarEstadoRegistro,
  generarCertificado,
  subirCertificadoFirmado,
  getRegistrosParaCertificados,
  getCertificadosListosAAU,
  enviarAAAU
};
