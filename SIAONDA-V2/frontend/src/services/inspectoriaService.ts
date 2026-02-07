import { api } from './api';

// ==================== TIPOS ====================

export interface CategoriaIRC {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
}

export interface Provincia {
  id: number;
  nombre: string;
  codigo: string;
}

export interface StatusInspeccion {
  id: number;
  nombre: string;
}

export interface EstadoJuridico {
  id: number;
  nombre: string;
}

export interface Conclusion {
  id: number;
  nombre: string;
}

export interface EstadoRegistrado {
  id: number;
  nombre: string;
}

export interface EstadoExistencia {
  id: number;
  nombre: string;
}

export interface EstadoSolicitud {
  id: number;
  nombre: string;
  orden: number;
}

export interface EstadoCaso {
  id: number;
  nombre: string;
  orden: number;
}

export interface Catalogos {
  categoriasIRC: CategoriaIRC[];
  statusInspeccion: StatusInspeccion[];
  estadosJuridicos: EstadoJuridico[];
  conclusiones: Conclusion[];
  estadosRegistrado: EstadoRegistrado[];
  estadosExistencia: EstadoExistencia[];
  provincias: Provincia[];
  estadosSolicitud: EstadoSolicitud[];
  estadosCaso: EstadoCaso[];
}

export interface ConsejoAdministracion {
  id?: number;
  nombreCompleto: string;
  cargo: string; // Presidente, Vicepresidente, Secretario, Tesorero, Administrador
  cedula?: string;
  domicilio?: string;
  telefono?: string;
  celular?: string;
  email?: string;
}

export interface ClienteEmpresa {
  id?: number;
  nombreCliente: string;
  descripcion?: string;
}

export interface EmpresaInspeccionada {
  id?: number;
  nombreEmpresa: string;
  nombreComercial?: string;
  rnc: string;
  categoriaIrcId: number;
  tipoPersona: 'MORAL' | 'FISICA';
  nombrePropietario?: string;
  cedulaPropietario?: string;
  personaContacto?: string;  // Representante Legal - se muestra en el listado
  descripcionActividades: string;
  direccion: string;
  provinciaId: number;
  sector?: string;
  telefono?: string;
  telefonoSecundario?: string;
  correoElectronico?: string;
  paginaWeb?: string;
  cantidadEmpleados?: number;
  fechaConstitucion?: Date | string;
  documentoConstitucionUrl?: string;
  documentoRncUrl?: string;
  documentoIdPropietarioUrl?: string;
  registrado: boolean;
  fechaRegistro?: Date | string;
  fechaRenovacion?: Date | string;
  fechaVencimiento?: Date | string;
  statusId: number;
  estadoJuridicoId: number;
  conclusionId: number;
  registradoId: number;
  existenciaId: number;
  fechaNotificacion?: Date | string;
  fechaActaInfraccion?: Date | string;
  statusExternoId?: number;
  observaciones?: string;
  consejoAdministracion?: ConsejoAdministracion[];
  principalesClientes?: ClienteEmpresa[];
  categoriaIrc?: CategoriaIRC;
  status?: StatusInspeccion;
  provincia?: Provincia;
}

export interface SolicitudRegistro {
  id?: number;
  codigo?: string;
  empresaId?: number;
  tipoSolicitud: 'REGISTRO_NUEVO' | 'RENOVACION';
  estadoId: number;
  recibidoPorId?: number;
  fechaRecepcion?: Date | string;
  validadoPorId?: number;
  fechaValidacion?: Date | string;
  facturaId?: number;
  fechaPago?: Date | string;
  asentadoPorId?: number;
  fechaAsentamiento?: Date | string;
  numeroAsiento?: string;
  libroAsiento?: string;
  certificadoId?: number;
  firmadoPorId?: number;
  fechaFirma?: Date | string;
  entregadoPorId?: number;
  fechaEntrega?: Date | string;
  observaciones?: string;
  empresa?: EmpresaInspeccionada;
  estado?: EstadoSolicitud;
}

export interface CasoInspeccion {
  id?: number;
  codigo?: string;
  empresaId: number;
  tipoCaso: 'OFICIO' | 'DENUNCIA' | 'OPERATIVO';
  origen?: string;
  descripcion?: string;
  estadoCasoId: number;
  encargadoId?: number;
  inspectorAsignadoId?: number;
  fechaAsignacion?: Date | string;
  fechaPrimeraVisita?: Date | string;
  fechaSegundaVisita?: Date | string;
  plazoCorreccionDias?: number;
  fechaLimiteCorreccion?: Date | string;
  actaInspeccionId?: number;
  actaInfraccionId?: number;
  fechaCierre?: Date | string;
  resolucion?: string;
  motivoCierre?: string;
  statusId?: number;
  estadoJuridicoId?: number;
  observaciones?: string;
  empresa?: EmpresaInspeccionada;
  estadoCaso?: EstadoCaso;
}

export interface DashboardData {
  alertasRenovacion: {
    vencidas: number;
    porVencer30Dias: number;
  };
  solicitudesPendientes: {
    validacion: number;
    asentamiento: number;
    certificado: number;
  };
  casosPendientes: {
    pendientesAsignacion: number;
    enPlazoGracia: number;
    paraSegundaVisita: number;
  };
  estadisticas: {
    totalEmpresas: number;
    totalSolicitudes: number;
    totalCasos: number;
    ingresosMensuales: number;
  };
}

// ==================== CATÁLOGOS ====================

export const obtenerTodosCatalogos = async (): Promise<Catalogos> => {
  const response = await api.get(`/inspectoria/catalogos`);
  return response.data.data;
};

export const obtenerCategoriasIRC = async (): Promise<CategoriaIRC[]> => {
  const response = await api.get(`/inspectoria/catalogos/categorias-irc`);
  return response.data.data;
};

export const obtenerProvincias = async (): Promise<Provincia[]> => {
  const response = await api.get(`/inspectoria/catalogos/provincias`);
  return response.data.data;
};

// ==================== EMPRESAS ====================

export const obtenerEmpresas = async (filtros?: {
  search?: string;
  rnc?: string;
  nombreEmpresa?: string;
  categoriaIrcId?: number;
  provinciaId?: number;
  statusId?: number;
  registrado?: boolean;
  vencidas?: boolean;
  porVencer?: boolean;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get(`/inspectoria/empresas`, { params: filtros });
  // El backend devuelve { success, data: empresas[], pagination }
  return {
    empresas: response.data.data || [],
    total: response.data.pagination?.total || 0,
    page: response.data.pagination?.page || 1,
    limit: response.data.pagination?.limit || 10,
    totalPages: response.data.pagination?.totalPages || 0
  };
};

export const obtenerEmpresaPorId = async (id: number): Promise<EmpresaInspeccionada> => {
  const response = await api.get(`/inspectoria/empresas/${id}`);
  return response.data.data;
};

export const crearEmpresa = async (empresa: EmpresaInspeccionada): Promise<EmpresaInspeccionada> => {
  const response = await api.post(`/inspectoria/empresas`, empresa);
  return response.data.data;
};

export const actualizarEmpresa = async (id: number, empresa: Partial<EmpresaInspeccionada>): Promise<EmpresaInspeccionada> => {
  const response = await api.put(`/inspectoria/empresas/${id}`, empresa);
  return response.data.data;
};

export const eliminarEmpresa = async (id: number): Promise<void> => {
  await api.delete(`/inspectoria/empresas/${id}`);
};

export const buscarEmpresaPorRNC = async (rnc: string): Promise<EmpresaInspeccionada | null> => {
  const response = await api.get(`/inspectoria/empresas`, {
    params: { rnc, limit: 1 }
  });
  const empresas = response.data.data?.empresas || [];
  return empresas.length > 0 ? empresas[0] : null;
};

// ==================== SOLICITUDES ====================

export const obtenerSolicitudes = async (filtros?: {
  estadoId?: number;
  tipoSolicitud?: string;
  empresaId?: number;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get(`/inspectoria/solicitudes`, { params: filtros });
  return response.data.data;
};

export const obtenerSolicitudPorId = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.get(`/inspectoria/solicitudes/${id}`);
  return response.data.data;
};

export const crearSolicitud = async (solicitud: Partial<SolicitudRegistro>): Promise<SolicitudRegistro> => {
  const response = await api.post(`/inspectoria/solicitudes`, solicitud);
  return response.data.data;
};

export const generarFactura = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.post(`/inspectoria/solicitudes/${id}/generar-factura`);
  return response.data.data;
};

export const aprobarRevision = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.put(`/inspectoria/solicitudes/${id}/aprobar-revision`);
  return response.data.data;
};

export const devolverSolicitud = async (id: number, motivo: string): Promise<SolicitudRegistro> => {
  const response = await api.put(`/inspectoria/solicitudes/${id}/devolver`, { motivo });
  return response.data.data;
};

export const asentarSolicitud = async (
  id: number,
  data: { numeroLibro: string; numeroHoja: string }
): Promise<SolicitudRegistro> => {
  const response = await api.put(`/inspectoria/solicitudes/${id}/asentar`, data);
  return response.data.data;
};

export const generarCertificado = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.post(`/inspectoria/solicitudes/${id}/generar-certificado`);
  return response.data.data;
};

export const firmarCertificado = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.put(`/inspectoria/solicitudes/${id}/firmar`);
  return response.data.data;
};

export const subirCertificadoFirmado = async (id: number, archivo: File): Promise<SolicitudRegistro> => {
  const formData = new FormData();
  formData.append('certificado', archivo);

  const response = await api.post(`/inspectoria/solicitudes/${id}/subir-certificado-firmado`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const entregarCertificado = async (id: number): Promise<SolicitudRegistro> => {
  const response = await api.post(`/inspectoria/solicitudes/${id}/entregar`);
  return response.data.data;
};

// ==================== CASOS ====================

export const obtenerCasos = async (filtros?: {
  estadoCasoId?: number;
  tipoCaso?: string;
  empresaId?: number;
  inspectorAsignadoId?: number;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get(`/inspectoria/casos`, { params: filtros });
  return response.data.data;
};

export const obtenerCasoPorId = async (id: number): Promise<CasoInspeccion> => {
  const response = await api.get(`/inspectoria/casos/${id}`);
  return response.data.data;
};

export const crearCaso = async (caso: Partial<CasoInspeccion>): Promise<CasoInspeccion> => {
  const response = await api.post(`/inspectoria/casos`, caso);
  return response.data.data;
};

export const asignarInspector = async (id: number, inspectorId: number): Promise<CasoInspeccion> => {
  const response = await api.post(`/inspectoria/casos/${id}/asignar-inspector`, { inspectorId });
  return response.data.data;
};

export const reportarPrimeraVisita = async (
  id: number,
  data: {
    fechaVisita: Date | string;
    cumplimiento: boolean;
    hallazgos?: string;
    plazoCorreccion?: number;
  }
): Promise<CasoInspeccion> => {
  const response = await api.post(`/inspectoria/casos/${id}/primera-visita`, data);
  return response.data.data;
};

export const reportarSegundaVisita = async (
  id: number,
  data: {
    fechaVisita: Date | string;
    corrigioInfracciones: boolean;
    hallazgos?: string;
  }
): Promise<CasoInspeccion> => {
  const response = await api.post(`/inspectoria/casos/${id}/segunda-visita`, data);
  return response.data.data;
};

export const cerrarCaso = async (
  id: number,
  data: { resolucion: string; motivoCierre: string }
): Promise<CasoInspeccion> => {
  const response = await api.post(`/inspectoria/casos/${id}/cerrar`, data);
  return response.data.data;
};

// ==================== DASHBOARD ====================

export const obtenerDashboard = async (): Promise<DashboardData> => {
  const response = await api.get(`/inspectoria/dashboard`);
  return response.data.data;
};

export const obtenerEstadisticasMes = async (mes: number, anio: number) => {
  const response = await api.get(`/inspectoria/dashboard/estadisticas-mes`, {
    params: { mes, anio }
  });
  return response.data.data;
};

export const obtenerEmpresasPorProvincia = async () => {
  const response = await api.get(`/inspectoria/dashboard/empresas-por-provincia`);
  return response.data.data;
};

export const obtenerCasosPorTipo = async () => {
  const response = await api.get(`/inspectoria/dashboard/casos-por-tipo`);
  return response.data.data;
};

export const obtenerIngresosPorCategoria = async () => {
  const response = await api.get(`/inspectoria/dashboard/ingresos-por-categoria`);
  return response.data.data;
};
