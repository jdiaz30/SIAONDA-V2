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
  requiereCambioContrasena: boolean;
  setAuth: (accessToken: string, refreshToken: string, usuario: Usuario, permisos: string[], requiereCambioContrasena?: boolean) => void;
  setAccessToken: (accessToken: string) => void;
  setRequiereCambioContrasena: (requiere: boolean) => void;
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
      requiereCambioContrasena: false,

      setAuth: (accessToken, refreshToken, usuario, permisos, requiereCambioContrasena = false) =>
        set({
          accessToken,
          refreshToken,
          usuario,
          permisos,
          isAuthenticated: true,
          requiereCambioContrasena,
        }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      setRequiereCambioContrasena: (requiere) =>
        set({ requiereCambioContrasena: requiere }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          usuario: null,
          permisos: [],
          isAuthenticated: false,
          requiereCambioContrasena: false,
        }),
    }),
    {
      name: 'siaonda-auth',
    }
  )
);
