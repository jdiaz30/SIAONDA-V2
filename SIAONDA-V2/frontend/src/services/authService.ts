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
};
