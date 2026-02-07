import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';

// Extender el tipo Request para incluir usuario
export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    nombre: string;
    nombrecompleto: string;
    codigo: string;
    tipo: string;
    tipoId: number;
    correo?: string;
  };
}

/**
 * Middleware para verificar que el usuario tenga al menos uno de los permisos especificados
 *
 * @param permissions - Array de códigos de permisos (ej: ['atu.formularios.create', 'atu.formularios.update'])
 * @returns Middleware function
 *
 * @example
 * router.get('/formularios', authenticate, requirePermission('atu.formularios.view_all'), getFormularios);
 */
export const requirePermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.usuario) {
        return next(new AppError('No autenticado', 401));
      }

      // ADMINISTRADOR tiene acceso a todo (bypass)
      if (req.usuario.tipo.toLowerCase() === 'administrador') {
        return next();
      }

      // Verificar si el usuario tiene al menos uno de los permisos requeridos
      const tienePermiso = await verificarPermisosUsuario(
        req.usuario.tipoId,
        permissions
      );

      if (!tienePermiso) {
        return next(
          new AppError(
            `No tiene permisos para esta acción. Permisos requeridos: ${permissions.join(' o ')}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verifica si un rol tiene al menos uno de los permisos especificados
 *
 * @param tipoId - ID del tipo de usuario (rol)
 * @param permissions - Array de códigos de permisos
 * @returns true si tiene al menos un permiso, false si no
 */
async function verificarPermisosUsuario(
  tipoId: number,
  permissions: string[]
): Promise<boolean> {
  const permisos = await prisma.rolPermiso.findMany({
    where: {
      rolId: tipoId,
      permiso: {
        codigo: { in: permissions },
        activo: true
      }
    },
    include: {
      permiso: true
    }
  });

  return permisos.length > 0;
}

/**
 * Obtiene todos los permisos de un usuario (para enviar en login)
 *
 * @param tipoId - ID del tipo de usuario (rol)
 * @returns Array de códigos de permisos
 */
export async function obtenerPermisosUsuario(tipoId: number): Promise<string[]> {
  const permisos = await prisma.rolPermiso.findMany({
    where: {
      rolId: tipoId,
      permiso: {
        activo: true
      }
    },
    include: {
      permiso: {
        select: {
          codigo: true
        }
      }
    }
  });

  return permisos.map(rp => rp.permiso.codigo);
}

/**
 * Middleware para verificar múltiples condiciones de permisos
 * Útil para casos donde se necesita verificar permisos Y restricciones adicionales
 *
 * @example
 * // Verificar permiso Y que sea el usuario creador
 * router.put('/formularios/:id', authenticate,
 *   requirePermissionWithCondition(
 *     'atu.formularios.update_own_draft',
 *     async (req) => {
 *       const formulario = await prisma.formulario.findUnique({
 *         where: { id: parseInt(req.params.id) }
 *       });
 *       return formulario?.usuarioCreadorId === req.usuario?.id;
 *     }
 *   ),
 *   updateFormulario
 * );
 */
export const requirePermissionWithCondition = (
  permission: string,
  condition: (req: AuthRequest) => Promise<boolean>
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.usuario) {
        return next(new AppError('No autenticado', 401));
      }

      // ADMINISTRADOR tiene acceso a todo
      if (req.usuario.tipo.toLowerCase() === 'administrador') {
        return next();
      }

      // Verificar permiso
      const tienePermiso = await verificarPermisosUsuario(
        req.usuario.tipoId,
        [permission]
      );

      if (!tienePermiso) {
        return next(
          new AppError(`No tiene el permiso: ${permission}`, 403)
        );
      }

      // Verificar condición adicional
      const cumpleCondicion = await condition(req);
      if (!cumpleCondicion) {
        return next(
          new AppError('No tiene autorización para realizar esta acción', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper para verificar permisos en controladores
 * Útil cuando necesitas verificar permisos dentro de la lógica del controlador
 *
 * @example
 * const puedeFirmar = await tienePermiso(req.usuario.tipoId, 'registro.certificados.firmar');
 * if (!puedeFirmar) {
 *   throw new AppError('Solo el Encargado de Registro puede firmar certificados', 403);
 * }
 */
export async function tienePermiso(tipoId: number, permission: string): Promise<boolean> {
  return verificarPermisosUsuario(tipoId, [permission]);
}

/**
 * Helper para verificar si tiene TODOS los permisos especificados
 */
export async function tieneTodosLosPermisos(
  tipoId: number,
  permissions: string[]
): Promise<boolean> {
  const permisos = await prisma.rolPermiso.findMany({
    where: {
      rolId: tipoId,
      permiso: {
        codigo: { in: permissions },
        activo: true
      }
    }
  });

  return permisos.length === permissions.length;
}
