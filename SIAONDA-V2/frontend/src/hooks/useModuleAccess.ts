import { useAuthStore } from '../store/authStore';

/**
 * Hook para verificar acceso a módulos basado en permisos
 */
export const useModuleAccess = () => {
  const { permisos } = useAuthStore();

  const tienePermisoEnModulo = (prefijo: string): boolean => {
    return permisos.some(p => p.startsWith(prefijo));
  };

  return {
    // Módulos principales
    puedeVerATU: () => tienePermisoEnModulo('atu.'),
    puedeVerRegistro: () => tienePermisoEnModulo('registro.'),
    puedeVerCajas: () => tienePermisoEnModulo('cajas.'),
    puedeVerInspectoria: () => tienePermisoEnModulo('inspectoria.'),
    puedeVerJuridico: () => tienePermisoEnModulo('juridico.'),
    puedeVerReportes: () => tienePermisoEnModulo('reportes.'),
    puedeVerUsuarios: () => permisos.includes('usuarios.read') || permisos.includes('usuarios.create'),
  };
};
