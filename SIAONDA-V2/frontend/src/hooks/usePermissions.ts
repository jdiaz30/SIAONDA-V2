import { useAuthStore } from '../store/authStore';

/**
 * Hook para verificar permisos del usuario autenticado
 *
 * @example
 * const { hasPermission, hasAnyPermission, hasRole, isAdmin } = usePermissions();
 *
 * if (hasPermission('atu.formularios.create')) {
 *   // Mostrar botón "Crear Formulario"
 * }
 *
 * if (hasAnyPermission(['registro.certificados.firmar', 'registro.certificados.enviar'])) {
 *   // Mostrar botón "Firmar y Enviar"
 * }
 */
export function usePermissions() {
  const { usuario, permisos } = useAuthStore();

  /**
   * Verifica si el usuario tiene un permiso específico
   *
   * @param permission - Código del permiso (ej: 'atu.formularios.create')
   * @returns true si tiene el permiso, false si no
   */
  const hasPermission = (permission: string): boolean => {
    // ADMINISTRADOR tiene todos los permisos
    if (isAdmin()) return true;

    return permisos?.includes(permission) || false;
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   *
   * @param permissions - Array de códigos de permisos
   * @returns true si tiene al menos un permiso, false si no
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    // ADMINISTRADOR tiene todos los permisos
    if (isAdmin()) return true;

    return permissions.some(p => permisos?.includes(p));
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   *
   * @param permissions - Array de códigos de permisos
   * @returns true si tiene todos los permisos, false si no
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    // ADMINISTRADOR tiene todos los permisos
    if (isAdmin()) return true;

    return permissions.every(p => permisos?.includes(p));
  };

  /**
   * Verifica si el usuario tiene un rol específico (case-insensitive)
   *
   * @param role - Nombre del rol (ej: 'ENCARGADO_ATU', 'TECNICO_ATU')
   * @returns true si tiene el rol, false si no
   */
  const hasRole = (role: string): boolean => {
    return usuario?.tipo?.toLowerCase() === role.toLowerCase();
  };

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   *
   * @param roles - Array de nombres de roles
   * @returns true si tiene al menos un rol, false si no
   */
  const hasAnyRole = (roles: string[]): boolean => {
    const userRole = usuario?.tipo?.toLowerCase();
    return roles.some(role => userRole === role.toLowerCase());
  };

  /**
   * Verifica si el usuario es ADMINISTRADOR
   *
   * @returns true si es administrador, false si no
   */
  const isAdmin = (): boolean => {
    return usuario?.tipo?.toLowerCase() === 'administrador';
  };

  /**
   * Verifica si el usuario es DIRECTOR (solo lectura de todo)
   *
   * @returns true si es director, false si no
   */
  const isDirector = (): boolean => {
    return usuario?.tipo?.toLowerCase() === 'director';
  };

  /**
   * Obtiene el módulo principal del usuario según su rol
   *
   * @returns Nombre del módulo ('ATU', 'REGISTRO', 'CAJAS', 'INSPECTORIA', 'JURIDICO', 'TODOS')
   */
  const getModuloPrincipal = (): string => {
    const tipo = usuario?.tipo?.toUpperCase() || '';

    if (tipo === 'ADMINISTRADOR' || tipo === 'DIRECTOR') return 'TODOS';
    if (tipo.includes('ATU') || tipo.includes('RECEPCIONISTA')) return 'ATU';
    if (tipo.includes('REGISTRO') || tipo.includes('ASENTAMIENTO') || tipo.includes('CERTIFICACION')) return 'REGISTRO';
    if (tipo.includes('CAJERO')) return 'CAJAS';
    if (tipo.includes('INSPECTORIA') || tipo.includes('PARALEGAL')) return 'INSPECTORIA';
    if (tipo.includes('JURIDICO')) return 'JURIDICO';

    return 'NINGUNO';
  };

  /**
   * Verifica si el usuario puede acceder a un módulo específico
   *
   * @param modulo - Nombre del módulo ('ATU', 'REGISTRO', 'CAJAS', 'INSPECTORIA', 'JURIDICO')
   * @returns true si puede acceder, false si no
   */
  const canAccessModule = (modulo: string): boolean => {
    if (isAdmin() || isDirector()) return true;

    const moduloUpper = modulo.toUpperCase();
    const moduloPrincipal = getModuloPrincipal();

    return moduloPrincipal === moduloUpper;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isDirector,
    getModuloPrincipal,
    canAccessModule,
    // Exponer datos del usuario y permisos
    usuario,
    permisos
  };
}
