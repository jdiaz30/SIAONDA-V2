import { api } from './api';

export interface Usuario {
  id: number;
  nombre: string;
  codigo: string;
  nombrecompleto: string;
  correo?: string;
  tipo: string;
  tipoId?: number;
  estado: string;
  estadoId?: number;
  supervisor?: {
    id: number;
    nombrecompleto: string;
  };
  supervisorId?: number;
}

export interface UsuarioTipo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface CreateUsuarioData {
  nombre: string;
  contrasena: string;
  codigo: string;
  nombrecompleto: string;
  correo?: string;
  tipoId: number;
  supervisorId?: number;
}

export interface UpdateUsuarioData {
  nombrecompleto?: string;
  correo?: string;
  tipoId?: number;
  supervisorId?: number;
  estadoId?: number;
}

export interface CambiarContrasenaData {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface RestablecerContrasenaData {
  contrasenaTemporal?: string;
}

const usuariosService = {
  /**
   * Obtener lista de usuarios con paginación
   */
  async getUsuarios(page: number = 1, limit: number = 20) {
    const response = await api.get('/usuarios', {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Obtener detalles de un usuario
   */
  async getUsuario(id: number) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Crear nuevo usuario
   */
  async createUsuario(data: CreateUsuarioData) {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  /**
   * Actualizar usuario existente
   */
  async updateUsuario(id: number, data: UpdateUsuarioData) {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  /**
   * Desactivar usuario (soft delete)
   */
  async deleteUsuario(id: number) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Restablecer contraseña de un usuario (solo admin)
   */
  async restablecerContrasena(id: number, data?: RestablecerContrasenaData) {
    const response = await api.post(`/usuarios/${id}/restablecer-contrasena`, data || {});
    return response.data;
  },

  /**
   * Cambiar propia contraseña
   */
  async cambiarContrasena(data: CambiarContrasenaData) {
    const response = await api.post('/usuarios/cambiar-contrasena', data);
    return response.data;
  },

  /**
   * Obtener tipos de usuario (roles)
   */
  async getTiposUsuario(): Promise<UsuarioTipo[]> {
    // Este endpoint asume que existe en el backend
    // Si no existe, podríamos hacer hardcode de los tipos
    try {
      const response = await api.get('/usuarios/tipos');
      return response.data;
    } catch (error) {
      // Fallback: tipos hardcoded
      return [
        { id: 1, nombre: 'Cajero' },
        { id: 2, nombre: 'Contable' },
        { id: 3, nombre: 'Administrador' },
        { id: 4, nombre: 'Servicio al Cliente' },
        { id: 5, nombre: 'Admin Serv Cliente' },
        { id: 6, nombre: 'Regional' },
        { id: 7, nombre: 'Digitador' },
        { id: 8, nombre: 'Recepción Clientes' },
        { id: 9, nombre: 'Asentamiento' },
        { id: 10, nombre: 'Registro' },
        { id: 11, nombre: 'Admin Registro' },
        { id: 12, nombre: 'Administrativo' },
        { id: 13, nombre: 'Inspectoría' }
      ];
    }
  }
};

export default usuariosService;
