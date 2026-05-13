import { Request, Response, NextFunction } from 'express';
import { autoUpperCase } from '../utils/formatNombres';

/**
 * Rutas que NO deben convertir datos a mayúsculas
 * (principalmente autenticación y operaciones sensibles)
 */
const RUTAS_EXCLUIDAS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/change-password',
  '/api/usuarios/change-password'
];

/**
 * Middleware que convierte automáticamente todos los campos de texto
 * del request.body a mayúsculas antes de que lleguen a los controladores
 *
 * Se aplica ANTES de los controladores para que todos los datos
 * se guarden en mayúsculas automáticamente
 */
export const upperCaseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // No aplicar en rutas excluidas (login, cambio de contraseña, etc.)
  if (RUTAS_EXCLUIDAS.includes(req.path)) {
    return next();
  }

  // Solo aplicar en métodos que envían datos (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.body && typeof req.body === 'object') {
      req.body = autoUpperCase(req.body);
    }
  }

  next();
};
