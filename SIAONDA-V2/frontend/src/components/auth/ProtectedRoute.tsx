import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Requiere al menos uno de estos permisos */
  requiredPermissions?: string[];
  /** Requiere al menos uno de estos roles */
  requiredRoles?: string[];
  /** Componente a mostrar si no tiene acceso */
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rutas según permisos y roles
 *
 * @example
 * // Proteger por permiso
 * <Route
 *   path="/aau/solicitudes"
 *   element={
 *     <ProtectedRoute requiredPermissions={['atu.formularios.view_all', 'atu.formularios.view_own']}>
 *       <SolicitudesPage />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Proteger por rol
 * <Route
 *   path="/usuarios"
 *   element={
 *     <ProtectedRoute requiredRoles={['administrador']}>
 *       <UsuariosPage />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Proteger con fallback personalizado
 * <ProtectedRoute
 *   requiredPermissions={['registro.certificados.firmar']}
 *   fallback={<div>Solo el Encargado de Registro puede firmar certificados</div>}
 * >
 *   <FirmarCertificadosPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = <Navigate to="/unauthorized" replace />
}: ProtectedRouteProps) {
  const {
    hasAnyPermission,
    hasAnyRole,
    isAdmin
  } = usePermissions();

  // ADMINISTRADOR tiene acceso a todo
  if (isAdmin()) {
    return <>{children}</>;
  }

  // Verificar roles (si se especificaron)
  if (requiredRoles.length > 0) {
    const tieneRol = hasAnyRole(requiredRoles);
    if (!tieneRol) {
      return <>{fallback}</>;
    }
  }

  // Verificar permisos (si se especificaron)
  if (requiredPermissions.length > 0) {
    const tienePermiso = hasAnyPermission(requiredPermissions);
    if (!tienePermiso) {
      return <>{fallback}</>;
    }
  }

  // Si no se especificaron requisitos o los cumple todos, mostrar el contenido
  return <>{children}</>;
}
