import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: number;
  nombre: string;
  nombrecompleto: string;
  codigo: string;
  tipo: string;
  tipoId: number;
  correo: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  permisos: string[];
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, usuario: Usuario, permisos: string[]) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      permisos: [],
      isAuthenticated: false,

      setAuth: (accessToken, refreshToken, usuario, permisos) =>
        set({
          accessToken,
          refreshToken,
          usuario,
          permisos,
          isAuthenticated: true,
        }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          usuario: null,
          permisos: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'siaonda-auth',
    }
  )
);
