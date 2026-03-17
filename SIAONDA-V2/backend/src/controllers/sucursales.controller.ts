import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/sucursales
// Obtener todas las sucursales activas
export const getSucursales = asyncHandler(async (req: Request, res: Response) => {
  const sucursales = await prisma.sucursal.findMany({
    where: {
      activo: true
    },
    orderBy: {
      nombre: 'asc'
    }
  });

  res.json(sucursales);
});
