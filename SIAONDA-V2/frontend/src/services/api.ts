import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// URL base del backend (sin /api) - para acceder a archivos estáticos
// Los archivos se sirven desde el backend en puerto 3000, no desde nginx
export const BACKEND_URL = API_URL.replace('/api', '');

// Función para obtener la URL del backend dinámicamente
// Los archivos estáticos se sirven desde el backend (puerto 3000)
const getBackendUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;

  // Si VITE_API_URL es una URL completa (http://...), usarla sin /api
  if (viteApiUrl && (viteApiUrl.startsWith('http://') || viteApiUrl.startsWith('https://'))) {
    return viteApiUrl.replace('/api', '');
  }

  // Si es ruta relativa (/api) o no está definida, construir URL completa
  // usando window.location

  // En desarrollo (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // En producción, usar el mismo host pero puerto 3000 (backend)
  const protocol = window.location.protocol;
  return `${protocol}//${window.location.hostname}:3000`;
};

export const BACKEND_URL_DYNAMIC = getBackendUrl();

// Helper para generar URLs de archivos estáticos desde el backend
export const getFileUrl = (path: string): string => {
  if (!path) return '';

  // Si ya tiene http/https, retornarlo tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Construir URL del backend con puerto 3000
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Si es localhost, usar localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const backendUrl = 'http://localhost:3000';
    return `${backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // En producción, usar la IP/hostname actual con puerto 3000
  const backendUrl = `${protocol}//${hostname}:3000`;
  return `${backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor para añadir token y Content-Type
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Solo establecer Content-Type si no es FormData
    // Axios automáticamente establece multipart/form-data con boundary para FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para manejar refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // NO intentar refresh en endpoints de auth (login, logout, etc)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        useAuthStore.getState().setAccessToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
