import { Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// POST /api/usuarios/:id/mover-a-evento
// Mover temporalmente un usuario a una sucursal de evento
export const moverUsuarioAEvento = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  const { sucursalEventoId } = req.body;

  if (!sucursalEventoId) {
    throw new AppError('Se requiere sucursalEventoId', 400);
  }

  // Verificar que la sucursal existe
  const sucursalEvento = await prisma.sucursal.findUnique({
    where: { id: sucursalEventoId }
  });

  if (!sucursalEvento) {
    throw new AppError('Sucursal de evento no encontrada', 404);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { sucursal: true }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Si ya está en un evento temporal, lanzar error
  if (usuario.sucursalOriginalId) {
    throw new AppError(
      `El usuario ya está asignado temporalmente a un evento. Debe restaurarlo primero.`,
      400
    );
  }

  // Mover a evento: guardar original y cambiar actual
  const usuarioActualizado = await prisma.usuario.update({
    where: { id: userId },
    data: {
      sucursalOriginalId: usuario.sucursalId, // Guardar la original
      sucursalId: sucursalEventoId // Cambiar a evento
    },
    include: {
      sucursal: true,
      sucursalOriginal: true
    }
  });

  res.json({
    message: `Usuario movido temporalmente a ${sucursalEvento.nombre}`,
    usuario: {
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombrecompleto,
      sucursalActual: usuarioActualizado.sucursal?.nombre,
      sucursalOriginal: usuarioActualizado.sucursalOriginal?.nombre
    }
  });
});

// POST /api/usuarios/:id/restaurar-sucursal
// Restaurar usuario a su sucursal original después de un evento
export const restaurarSucursalOriginal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { sucursalOriginal: true }
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (!usuario.sucursalOriginalId) {
    throw new AppError('Este usuario no tiene sucursal original guardada (no está en evento temporal)', 400);
  }

  // Restaurar: volver a la original y limpiar
  const usuarioRestaurado = await prisma.usuario.update({
    where: { id: userId },
    data: {
      sucursalId: usuario.sucursalOriginalId, // Volver a la original
      sucursalOriginalId: null // Limpiar
    },
    include: {
      sucursal: true
    }
  });

  res.json({
    message: `Usuario restaurado a su sucursal original`,
    usuario: {
      id: usuarioRestaurado.id,
      nombre: usuarioRestaurado.nombrecompleto,
      sucursal: usuarioRestaurado.sucursal?.nombre
    }
  });
});

// GET /api/usuarios/en-eventos
// Listar usuarios que están temporalmente en eventos
export const getUsuariosEnEventos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuariosEnEventos = await prisma.usuario.findMany({
    where: {
      sucursalOriginalId: { not: null }
    },
    include: {
      sucursal: true,
      sucursalOriginal: true,
      estado: true
    },
    orderBy: { nombrecompleto: 'asc' }
  });

  res.json({
    total: usuariosEnEventos.length,
    usuarios: usuariosEnEventos.map(u => ({
      id: u.id,
      codigo: u.codigo,
      nombre: u.nombrecompleto,
      sucursalActual: u.sucursal?.nombre,
      sucursalOriginal: u.sucursalOriginal?.nombre,
      estado: u.estado.nombre
    }))
  });
});
