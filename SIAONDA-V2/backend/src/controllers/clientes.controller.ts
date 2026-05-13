import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { autoUpperCase } from '../utils/formatNombres';

// Schemas de validación
const createClienteSchema = z.object({
  identificacion: z.string().min(1, 'Identificación requerida').max(50),
  tipoIdentificacion: z.enum(['Cedula', 'Pasaporte', 'RNC', 'ActaNacimiento']).optional(),
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  apellido: z.string().max(200).optional(),
  seudonimo: z.string().max(200).optional(),
  genero: z.enum(['M', 'F']).optional(),

  // Dirección completa
  direccion: z.string().optional(),
  municipio: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),

  // Contacto
  telefono: z.string().max(50).optional(),
  movil: z.string().max(50).optional(),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),

  // Clasificación
  tipoId: z.number().int().positive(),
  nacionalidadId: z.number().int().positive(),

  // Otros
  rnc: z.string().max(50).optional(),
  fallecido: z.boolean().optional(),
  fechaFallecimiento: z.string().optional()
});

const updateClienteSchema = createClienteSchema.partial();

// Generar código único para cliente
const generateCodigoCliente = async (): Promise<string> => {
  const count = await prisma.cliente.count();
  const numero = (count + 1).toString().padStart(6, '0');
  return `CLI-${numero}`;
};

// GET /api/clientes
export const getClientes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;

  // Filtros de búsqueda
  const where: any = {};
  if (search) {
    where.OR = [
      { identificacion: { contains: search, mode: 'insensitive' } },
      { nombrecompleto: { contains: search, mode: 'insensitive' } },
      { nombre: { contains: search, mode: 'insensitive' } },
      { apellido: { contains: search, mode: 'insensitive' } },
      { codigo: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      include: {
        tipo: true,
        nacionalidad: true,
        _count: {
          select: {
            formularios: true,
            facturas: true,
            archivos: true
          }
        }
      },
      orderBy: { creadoEn: 'desc' }
    }),
    prisma.cliente.count({ where })
  ]);

  res.json({
    clientes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// GET /api/clientes/:id
export const getCliente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      tipo: true,
      nacionalidad: true,
      archivos: {
        orderBy: { creadoEn: 'desc' }
      },
      visitas: {
        orderBy: { fechaEntrada: 'desc' },
        take: 10
      },
      formularios: {
        include: {
          formulario: {
            select: {
              id: true,
              codigo: true,
              fecha: true,
              estado: true
            }
          }
        },
        take: 10,
        orderBy: {
          formulario: {
            fecha: 'desc'
          }
        }
      }
    }
  });

  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  res.json(cliente);
});

// POST /api/clientes
export const createCliente = asyncHandler(async (req: Request, res: Response) => {
  const data = createClienteSchema.parse(req.body);

  // Convertir campos de texto a mayúsculas
  const dataUpperCase = autoUpperCase(data);

  // Verificar que no exista con misma identificación
  const existente = await prisma.cliente.findUnique({
    where: { identificacion: dataUpperCase.identificacion }
  });

  if (existente) {
    throw new AppError('Ya existe un cliente con esta identificación', 400);
  }

  // Generar código único
  const codigo = await generateCodigoCliente();

  // Construir nombre completo
  const nombrecompleto = dataUpperCase.apellido
    ? `${dataUpperCase.nombre} ${dataUpperCase.apellido}`
    : dataUpperCase.nombre;

  const cliente = await prisma.cliente.create({
    data: {
      identificacion: dataUpperCase.identificacion,
      tipoIdentificacion: dataUpperCase.tipoIdentificacion,
      nombre: dataUpperCase.nombre,
      apellido: dataUpperCase.apellido,
      nombrecompleto,
      seudonimo: dataUpperCase.seudonimo,
      genero: dataUpperCase.genero,
      direccion: dataUpperCase.direccion,
      municipio: dataUpperCase.municipio,
      sector: dataUpperCase.sector,
      provincia: dataUpperCase.provincia,
      telefono: dataUpperCase.telefono,
      movil: dataUpperCase.movil,
      correo: dataUpperCase.correo || null,
      tipoId: dataUpperCase.tipoId,
      nacionalidadId: dataUpperCase.nacionalidadId,
      rnc: dataUpperCase.rnc,
      fallecido: dataUpperCase.fallecido || false,
      fechaFallecimiento: dataUpperCase.fechaFallecimiento ? new Date(dataUpperCase.fechaFallecimiento) : null,
      codigo
    },
    include: {
      tipo: true,
      nacionalidad: true
    }
  });

  res.status(201).json(cliente);
});

// PUT /api/clientes/:id
export const updateCliente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const data = updateClienteSchema.parse(req.body);

  // Verificar que existe
  const existente = await prisma.cliente.findUnique({ where: { id } });

  if (!existente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  // Si cambia identificación, verificar que no exista otra con ese valor
  if (data.identificacion && data.identificacion !== existente.identificacion) {
    const duplicado = await prisma.cliente.findUnique({
      where: { identificacion: data.identificacion }
    });

    if (duplicado) {
      throw new AppError('Ya existe un cliente con esta identificación', 400);
    }
  }

  // Actualizar nombre completo si cambia nombre o apellido
  let nombrecompleto = existente.nombrecompleto;
  if (data.nombre || data.apellido) {
    const nombre = data.nombre || existente.nombre;
    const apellido = data.apellido !== undefined ? data.apellido : existente.apellido;
    nombrecompleto = apellido ? `${nombre} ${apellido}` : nombre;
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...data,
      nombrecompleto,
      correo: data.correo || null,
      fechaFallecimiento: data.fechaFallecimiento ? new Date(data.fechaFallecimiento) : undefined
    },
    include: {
      tipo: true,
      nacionalidad: true
    }
  });

  res.json(cliente);
});

// DELETE /api/clientes/:id
export const deleteCliente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  // Verificar que existe
  const existente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          formularios: true,
          facturas: true
        }
      }
    }
  });

  if (!existente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  // Verificar que no tenga formularios o facturas
  if (existente._count.formularios > 0 || existente._count.facturas > 0) {
    throw new AppError(
      'No se puede eliminar el cliente porque tiene formularios o facturas asociadas',
      400
    );
  }

  await prisma.cliente.delete({ where: { id } });

  res.json({ message: 'Cliente eliminado exitosamente' });
});

// GET /api/clientes/buscar?q=...
export const buscarClientes = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.length < 3) {
    return res.json([]);
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { identificacion: { contains: query, mode: 'insensitive' } },
        { nombrecompleto: { contains: query, mode: 'insensitive' } },
        { nombre: { contains: query, mode: 'insensitive' } },
        { apellido: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      tipo: true,
      nacionalidad: true
    },
    take: 10,
    orderBy: { nombrecompleto: 'asc' }
  });

  res.json(clientes);
});

// GET /api/clientes/buscar/identificacion/:identificacion
export const buscarPorIdentificacion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { identificacion } = req.params;

  const cliente = await prisma.cliente.findUnique({
    where: { identificacion },
    include: {
      tipo: true,
      nacionalidad: true
    }
  });

  if (!cliente) {
    res.status(404).json({ message: 'Cliente no encontrado' });
    return;
  }

  res.json(cliente);
});

// GET /api/clientes/tipos
export const getTiposCliente = asyncHandler(async (req: Request, res: Response) => {
  const tipos = await prisma.clienteTipo.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(tipos);
});

// GET /api/clientes/nacionalidades
export const getNacionalidades = asyncHandler(async (req: Request, res: Response) => {
  const nacionalidades = await prisma.clienteNacionalidad.findMany({
    orderBy: { nombre: 'asc' }
  });

  res.json(nacionalidades);
});

// POST /api/clientes/:id/archivos
export const uploadArchivo = asyncHandler(async (req: Request, res: Response) => {
  const clienteId = parseInt(req.params.id);
  const file = (req as any).file;

  if (!file) {
    throw new AppError('No se proporcionó ningún archivo', 400);
  }

  // Verificar que el cliente existe
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  // Convertir ruta absoluta a ruta relativa desde uploads
  const rutaRelativa = file.path.replace(/\\/g, '/').split('uploads/')[1] || file.path;

  // Crear registro del archivo en la BD
  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId,
      nombre: file.originalname,
      ruta: `uploads/${rutaRelativa}`,
      tipo: file.mimetype,
      tamano: file.size
    }
  });

  res.status(201).json(archivo);
});

// DELETE /api/clientes/:id/archivos/:archivoId
export const deleteArchivo = asyncHandler(async (req: Request, res: Response) => {
  const clienteId = parseInt(req.params.id);
  const archivoId = parseInt(req.params.archivoId);

  // Verificar que el archivo pertenece al cliente
  const archivo = await prisma.clienteArchivo.findFirst({
    where: {
      id: archivoId,
      clienteId
    }
  });

  if (!archivo) {
    throw new AppError('Archivo no encontrado', 404);
  }

  // Eliminar archivo físico del servidor
  const fs = require('fs');
  const path = require('path');

  // Construir ruta completa del archivo
  let rutaCompleta = archivo.ruta;

  // Si la ruta es relativa (empieza con uploads/), construir ruta absoluta
  if (archivo.ruta.startsWith('uploads/')) {
    rutaCompleta = path.join(process.cwd(), archivo.ruta);
  }
  // Si no es absoluta ni empieza con uploads/, asumir que es una ruta vieja
  else if (!path.isAbsolute(archivo.ruta)) {
    rutaCompleta = path.join(process.cwd(), 'uploads', archivo.ruta);
  }

  if (fs.existsSync(rutaCompleta)) {
    fs.unlinkSync(rutaCompleta);
  }

  await prisma.clienteArchivo.delete({ where: { id: archivoId } });

  res.json({ message: 'Archivo eliminado exitosamente' });
});
