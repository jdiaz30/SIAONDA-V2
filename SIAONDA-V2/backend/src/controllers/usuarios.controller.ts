import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const createUsuarioSchema = z.object({
  nombre: z.string().min(3).max(50),
  contrasena: z.string().min(6),
  codigo: z.string().min(1).max(20),
  nombrecompleto: z.string().min(1).max(200),
  correo: z.string().email().optional(),
  tipoId: z.number().int().positive(),
  supervisorId: z.number().int().positive().optional()
});

const updateUsuarioSchema = createUsuarioSchema.partial().omit({ contrasena: true });

const cambiarContrasenaSchema = z.object({
  contrasenaActual: z.string().min(1),
  contrasenaNueva: z.string().min(6)
});

const restablecerContrasenaSchema = z.object({
  contrasenaTemporal: z.string().min(6).optional()
});

export const getUsuarios = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      skip,
      take: limit,
      include: {
        tipo: true,
        estado: true,
        supervisor: {
          select: {
            id: true,
            nombrecompleto: true
          }
        }
      },
      orderBy: { nombrecompleto: 'asc' }
    }),
    prisma.usuario.count()
  ]);

  res.json({
    usuarios: usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre,
      codigo: u.codigo,
      nombrecompleto: u.nombrecompleto,
      correo: u.correo,
      tipo: u.tipo.nombre,
      estado: u.estado.nombre,
      supervisor: u.supervisor
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getUsuario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      tipo: true,
      estado: true,
      supervisor: {
        select: {
          id: true,
          nombrecompleto: true
        }
      }
    }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    codigo: usuario.codigo,
    nombrecompleto: usuario.nombrecompleto,
    correo: usuario.correo,
    tipo: usuario.tipo.nombre,
    tipoId: usuario.tipoId,
    estado: usuario.estado.nombre,
    estadoId: usuario.estadoId,
    supervisor: usuario.supervisor,
    supervisorId: usuario.supervisorId
  });
});

export const createUsuario = asyncHandler(async (req: Request, res: Response) => {
  const data = createUsuarioSchema.parse(req.body);

  // Verificar que no exista usuario con mismo nombre o código
  const existente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { nombre: data.nombre },
        { codigo: data.codigo }
      ]
    }
  });

  if (existente) {
    throw new AppError('Ya existe un usuario con ese nombre o código', 400);
  }

  // Hash de contraseña
  const contrasenaHash = await hashPassword(data.contrasena);

  // Estado activo por defecto
  const estadoActivo = await prisma.usuarioEstado.findFirst({
    where: { nombre: 'Activo' }
  });

  if (!estadoActivo) {
    throw new AppError('Estado activo no configurado', 500);
  }

  const usuario = await prisma.usuario.create({
    data: {
      ...data,
      contrasena: contrasenaHash,
      estadoId: estadoActivo.id
    },
    include: {
      tipo: true,
      estado: true
    }
  });

  res.status(201).json({
    id: usuario.id,
    nombre: usuario.nombre,
    codigo: usuario.codigo,
    nombrecompleto: usuario.nombrecompleto,
    tipo: usuario.tipo.nombre
  });
});

export const updateUsuario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const data = updateUsuarioSchema.parse(req.body);

  // Verificar que existe
  const existente = await prisma.usuario.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Si cambia nombre o código, verificar que no exista otro con ese valor
  if (data.nombre || data.codigo) {
    const duplicado = await prisma.usuario.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              data.nombre ? { nombre: data.nombre } : {},
              data.codigo ? { codigo: data.codigo } : {}
            ]
          }
        ]
      }
    });

    if (duplicado) {
      throw new AppError('Ya existe un usuario con ese nombre o código', 400);
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    include: {
      tipo: true,
      estado: true
    }
  });

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    codigo: usuario.codigo,
    nombrecompleto: usuario.nombrecompleto,
    tipo: usuario.tipo.nombre
  });
});

export const deleteUsuario = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  // Verificar que existe
  const existente = await prisma.usuario.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // No eliminar, sino desactivar
  const estadoInactivo = await prisma.usuarioEstado.findFirst({
    where: { nombre: 'Inactivo' }
  });

  if (!estadoInactivo) {
    throw new AppError('Estado inactivo no configurado', 500);
  }

  await prisma.usuario.update({
    where: { id },
    data: { estadoId: estadoInactivo.id }
  });

  res.json({ message: 'Usuario desactivado exitosamente' });
});

export const cambiarContrasena = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const { contrasenaActual, contrasenaNueva } = cambiarContrasenaSchema.parse(req.body);

  // Obtener usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Verificar contraseña actual
  const isValid = await comparePassword(contrasenaActual, usuario.contrasena);

  if (!isValid) {
    throw new AppError('Contraseña actual incorrecta', 400);
  }

  // Hash nueva contraseña
  const nuevaHash = await hashPassword(contrasenaNueva);

  // Actualizar y quitar flag de cambio requerido
  await prisma.usuario.update({
    where: { id: req.usuario.id },
    data: {
      contrasena: nuevaHash,
      requiereCambioContrasena: false
    }
  });

  res.json({ message: 'Contraseña actualizada exitosamente' });
});

export const restablecerContrasena = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { contrasenaTemporal } = restablecerContrasenaSchema.parse(req.body);

  // Verificar que el usuario existe
  const usuario = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Usar contraseña temporal proporcionada o la por defecto
  const nuevaContrasena = contrasenaTemporal || 'ONDA2026';

  // Hash de la nueva contraseña
  const contrasenaHash = await hashPassword(nuevaContrasena);

  // Actualizar contraseña y marcar que requiere cambio
  await prisma.usuario.update({
    where: { id },
    data: {
      contrasena: contrasenaHash,
      requiereCambioContrasena: true
    }
  });

  res.json({
    message: 'Contraseña restablecida exitosamente',
    contrasenaTemporal: nuevaContrasena
  });
});

export const getTiposUsuario = asyncHandler(async (req: Request, res: Response) => {
  const tipos = await prisma.usuarioTipo.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(tipos);
});
