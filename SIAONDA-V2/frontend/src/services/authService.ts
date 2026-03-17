import { api } from './api';

export interface LoginCredentials {
  nombre: string;
  contrasena: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    nombrecompleto: string;
    codigo: string;
    tipo: string;
    tipoId: number;
    correo: string | null;
  };
  permisos: string[];
  requiereCambioContrasena: boolean;
}

export interface CambiarContrasenaRequest {
  contrasenaActual?: string;
  contrasenaNueva: string;
  confirmarContrasena: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  cambiarContrasena: async (data: CambiarContrasenaRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/cambiar-contrasena', data);
    return response.data;
  },
};
