import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    nombre: string;
    tipo: string;
    codigo: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Intentar obtener token del header o del query parameter
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    } else {
      throw new AppError('Token no proporcionado', 401);
    }

    if (!token) {
      throw new AppError('Token no proporcionado', 401);
    }
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Configuración de JWT inválida', 500);
    }

    const decoded = jwt.verify(token, secret) as {
      id: number;
      nombre: string;
      tipo: string;
      codigo: string;
    };

    // Verificar que el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: {
        tipo: true,
        estado: true
      }
    });

    if (!usuario || usuario.estado.nombre !== 'Activo') {
      throw new AppError('Usuario no autorizado', 401);
    }

    req.usuario = {
      id: decoded.id,
      nombre: decoded.nombre,
      tipo: usuario.tipo.nombre,
      codigo: decoded.codigo
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return next(new AppError('No autenticado', 401));
    }

    // Comparación case-insensitive de roles
    const userRole = req.usuario.tipo.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError('No tiene permisos para esta acción', 403));
    }

    next();
  };
};
