import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { obtenerPermisosUsuario } from '../middleware/permissions';

const loginSchema = z.object({
  nombre: z.string().min(1, 'El usuario o correo es requerido'),
  contrasena: z.string().min(1, 'La contraseña es requerida')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido')
});

/**
 * Controlador de autenticación de usuarios
 * Valida credenciales, genera tokens JWT y gestiona sesiones
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, contrasena } = loginSchema.parse(req.body);

  // Buscar usuario por nombre o correo
  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [
        { nombre: nombre },
        { correo: nombre }
      ]
    },
    include: {
      tipo: true,
      estado: true
    }
  });

  if (!usuario) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Verificar estado
  if (usuario.estado.nombre !== 'Activo') {
    throw new AppError('Usuario inactivo', 401);
  }

  // Verificar contraseña
  const isValidPassword = await comparePassword(contrasena, usuario.contrasena);

  if (!isValidPassword) {
    // Incrementar intentos fallidos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: { increment: 1 }
      }
    });

    throw new AppError('Credenciales inválidas', 401);
  }

  // Resetear intentos fallidos
  if (usuario.intentosFallidos > 0) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0 }
    });
  }

  // Generar tokens
  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    tipo: usuario.tipo.nombre,
    codigo: usuario.codigo
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Guardar refresh token en BD
  const tokenExpiracion = new Date();
  tokenExpiracion.setDate(tokenExpiracion.getDate() + 7);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      token: refreshToken,
      tokenExpiracion
    }
  });

  // Obtener permisos del usuario
  const permisos = await obtenerPermisosUsuario(usuario.tipoId);

  res.json({
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      nombrecompleto: usuario.nombrecompleto,
      codigo: usuario.codigo,
      tipo: usuario.tipo.nombre,
      tipoId: usuario.tipoId,
      correo: usuario.correo
    },
    permisos,
    requiereCambioContrasena: usuario.requiereCambioContrasena || false
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  // Verificar token
  const decoded = verifyRefreshToken(refreshToken);

  // Buscar usuario y verificar token
  const usuario = await prisma.usuario.findUnique({
    where: { id: decoded.id },
    include: {
      tipo: true,
      estado: true
    }
  });

  if (!usuario || usuario.token !== refreshToken) {
    throw new AppError('Token inválido', 401);
  }

  if (usuario.estado.nombre !== 'Activo') {
    throw new AppError('Usuario inactivo', 401);
  }

  // Verificar expiración
  if (usuario.tokenExpiracion && usuario.tokenExpiracion < new Date()) {
    throw new AppError('Token expirado', 401);
  }

  // Generar nuevo access token
  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    tipo: usuario.tipo.nombre,
    codigo: usuario.codigo
  };

  const accessToken = generateAccessToken(payload);

  res.json({ accessToken });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Eliminar token de BD
  await prisma.usuario.update({
    where: { id: req.usuario.id },
    data: {
      token: null,
      tokenExpiracion: null
    }
  });

  res.json({ message: 'Sesión cerrada exitosamente' });
});

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    include: {
      tipo: true,
      estado: true
    }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    nombrecompleto: usuario.nombrecompleto,
    codigo: usuario.codigo,
    tipo: usuario.tipo.nombre,
    correo: usuario.correo
  });
});
