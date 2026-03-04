import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// GET /api/productos
export const getProductos = asyncHandler(async (req: Request, res: Response) => {
  const activos = req.query.activos === 'true';
  const conPrecios = req.query.conPrecios === 'true';

  const where: any = {};
  if (activos) {
    where.estado = { nombre: 'Activo' };
  }

  const productos = await prisma.producto.findMany({
    where,
    include: {
      estado: true,
      costos: {
        where: {
          OR: [
            { fechaFinal: null },
            { fechaFinal: { gte: new Date() } }
          ],
          fechaInicio: { lte: new Date() }
        },
        orderBy: { cantidadMin: 'asc' },
        take: 1 // Solo el precio base (cantidad = 1)
      }
    },
    orderBy: { nombre: 'asc' }
  });

  // Si se solicita conPrecios, agregar el precio actual al objeto
  if (conPrecios) {
    const productosConPrecio = productos.map(producto => ({
      ...producto,
      precio: producto.costos[0]?.precio || 0
    }));
    return res.json(productosConPrecio);
  }

  res.json(productos);
});

// GET /api/productos/:id
export const getProducto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      estado: true,
      costos: {
        orderBy: { fechaInicio: 'desc' }
      }
    }
  });

  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  res.json(producto);
});

// GET /api/productos/:id/campos
export const getCamposProducto = asyncHandler(async (req: Request, res: Response) => {
  const productoId = parseInt(req.params.id);

  // Verificar que el producto existe
  const producto = await prisma.producto.findUnique({
    where: { id: productoId }
  });

  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  // Si es un producto de producción (-P), buscar el producto base
  let productoParaCampos = productoId;

  if (producto.codigo.endsWith('-P')) {
    // Obtener código del producto base (ej: MUS-02-P -> MUS-02)
    const codigoBase = producto.codigo.replace(/-P$/, '');

    // Buscar producto base
    const productoBase = await prisma.producto.findFirst({
      where: { codigo: codigoBase }
    });

    if (productoBase) {
      productoParaCampos = productoBase.id;
    }
    // Si no encuentra el producto base, usa el productoId original (fallback)
  }

  // Obtener campos específicos del producto y campos globales
  const campos = await prisma.formularioCampo.findMany({
    where: {
      OR: [
        { productoId: productoParaCampos },
        { productoId: null } // Campos globales
      ],
      activo: true
    },
    include: {
      tipo: true
    },
    orderBy: { orden: 'asc' }
  });

  res.json(campos);
});

// GET /api/productos/:id/costo
// Calcula el costo según cantidad
export const getCostoProducto = asyncHandler(async (req: Request, res: Response) => {
  const productoId = parseInt(req.params.id);
  const cantidad = parseInt(req.query.cantidad as string) || 1;

  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    include: {
      costos: {
        where: {
          OR: [
            { fechaFinal: null },
            { fechaFinal: { gte: new Date() } }
          ],
          fechaInicio: { lte: new Date() },
          cantidadMin: { lte: cantidad }
        },
        orderBy: { cantidadMin: 'desc' },
        take: 1
      }
    }
  });

  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  const costo = producto.costos[0];

  if (!costo) {
    throw new AppError('No se encontró precio para este producto', 404);
  }

  res.json({
    productoId: producto.id,
    cantidad,
    costoUnidad: costo.precio,
    total: Number(costo.precio) * cantidad
  });
});

// GET /api/productos/categorias
export const getCategorias = asyncHandler(async (req: Request, res: Response) => {
  const categorias = await prisma.producto.findMany({
    select: {
      categoria: true
    },
    distinct: ['categoria'],
    orderBy: { categoria: 'asc' }
  });

  res.json(categorias.map(c => c.categoria));
});
