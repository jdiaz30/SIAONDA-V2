import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Schema de validación para crear una producción
const createProduccionSchema = z.object({
  // Datos de la producción
  tituloProduccion: z.string().min(1, 'El título de la producción es requerido'),
  productoId: z.number().int().positive(),

  // Autores (compartidos por todas las obras)
  clientes: z.array(z.object({
    clienteId: z.number().int().positive(),
    tipoRelacion: z.string().default('Autor')
  })).min(1, 'Debe haber al menos un autor'),

  // Obras individuales (mínimo 6, máximo 15)
  obras: z.array(z.object({
    titulo: z.string().min(1, 'El título de la obra es requerido'),
    campos: z.array(z.object({
      campoId: z.number().int().positive(),
      valor: z.string()
    }))
  })).min(6, 'Una producción debe tener mínimo 6 obras')
    .max(15, 'Una producción puede tener máximo 15 obras'),

  observaciones: z.string().optional()
});

// Generar código único de formulario
const generateCodigoFormulario = async (tx: any): Promise<string> => {
  const now = new Date();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const año = now.getFullYear();

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await tx.formulario.count();
    const numero = (count + 1 + attempt).toString().padStart(8, '0');
    const codigo = `${numero}/${mes}/${año}`;

    const existe = await tx.formulario.findUnique({
      where: { codigo }
    });

    if (!existe) {
      return codigo;
    }

    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  const timestamp = Date.now();
  return `${timestamp.toString().padStart(8, '0')}/${mes}/${año}`;
};

// POST /api/producciones
// Crear una nueva producción con sus obras hijas
export const createProduccion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = createProduccionSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError(validation.error.errors[0].message, 400);
  }

  const { tituloProduccion, productoId, clientes, obras, observaciones } = validation.data;
  const usuarioId = req.usuario!.id;

  // Obtener el producto para calcular el costo
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    include: {
      costos: {
        where: {
          fechaInicio: { lte: new Date() },
          OR: [
            { fechaFinal: null },
            { fechaFinal: { gte: new Date() } }
          ]
        },
        orderBy: { fechaInicio: 'desc' },
        take: 1
      }
    }
  });

  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  if (!producto.codigo.endsWith('-P')) {
    throw new AppError('Este producto no es una producción', 400);
  }

  const precioProduccion = Number(producto.costos[0]?.precio || 0);

  // Obtener estado inicial
  const estadoPendiente = await prisma.formularioEstado.findFirst({
    where: { nombre: 'PENDIENTE_PAGO' }
  });

  if (!estadoPendiente) {
    throw new AppError('Estado PENDIENTE_PAGO no encontrado', 500);
  }

  // Crear la producción y sus obras en una transacción
  const resultado = await prisma.$transaction(async (tx) => {
    // 1. Crear formulario PADRE (la producción)
    const codigoProduccion = await generateCodigoFormulario(tx);

    const formularioPadre = await tx.formulario.create({
      data: {
        codigo: codigoProduccion,
        estadoId: estadoPendiente.id,
        usuarioId,
        esProduccion: true,
        tituloProduccion,
        montoTotal: precioProduccion,
        observaciones,

        // Asociar producto a la producción
        productos: {
          create: {
            productoId,
            cantidad: 1
          }
        },

        // Asociar autores a la producción
        clientes: {
          create: clientes.map(c => ({
            clienteId: c.clienteId,
            tipoRelacion: c.tipoRelacion
          }))
        }
      },
      include: {
        productos: {
          include: {
            producto: true
          }
        },
        clientes: {
          include: {
            cliente: true
          }
        }
      }
    });

    // 2. Crear formularios HIJOS (cada obra individual)
    if (!formularioPadre.productos || formularioPadre.productos.length === 0) {
      throw new AppError('Error: No se pudo crear la relación producto-formulario', 500);
    }
    const formularioProductoId = formularioPadre.productos[0].id;

    // Crear obras de manera SECUENCIAL para evitar códigos duplicados
    const obrasCreadas = [];
    for (const obra of obras) {
      const codigoObra = await generateCodigoFormulario(tx);

      // Buscar el campo "titulo" o "titulo_obra" para guardar el título de esta obra específica
      const campoTitulo = await tx.formularioCampo.findFirst({
        where: {
          productoId,
          OR: [
            { campo: { contains: 'titulo', mode: 'insensitive' } },
            { titulo: { contains: 'titulo', mode: 'insensitive' } }
          ]
        }
      });

      // DEBUG: Ver qué campos vienen del frontend
      console.log(`\n=== OBRA ${obras.indexOf(obra) + 1} ===`);
      console.log('Título enviado:', obra.titulo);
      console.log('Campos enviados:', obra.campos.length);
      obra.campos.forEach(c => {
        console.log(`  - Campo ID ${c.campoId}: "${c.valor}"`);
      });

      // Preparar los campos: incluir el título como primer campo si existe
      const camposParaCrear = [...obra.campos];
      if (campoTitulo && obra.titulo) {
        // Verificar si ya existe el campo de título en los campos enviados
        const yaExisteTitulo = camposParaCrear.some(c => c.campoId === campoTitulo.id);
        if (!yaExisteTitulo) {
          // Agregar el título como primer campo
          camposParaCrear.unshift({
            campoId: campoTitulo.id,
            valor: obra.titulo
          });
        }
      }

      console.log('Campos a guardar:', camposParaCrear.length);
      console.log('====================\n');

      const obraCreada = await tx.formulario.create({
        data: {
          codigo: codigoObra,
          estadoId: estadoPendiente.id,
          usuarioId,
          esProduccion: false,
          produccionPadreId: formularioPadre.id,
          montoTotal: 0, // Las obras hijas no tienen costo individual

          // Asociar el mismo producto
          productos: {
            create: {
              productoId,
              cantidad: 1,
              campos: {
                create: camposParaCrear.map(campo => ({
                  campoId: campo.campoId,
                  valor: campo.valor
                }))
              }
            }
          },

          // Asociar los mismos autores
          clientes: {
            create: clientes.map(c => ({
              clienteId: c.clienteId,
              tipoRelacion: c.tipoRelacion
            }))
          }
        },
        include: {
          productos: {
            include: {
              campos: {
                include: {
                  campo: true
                }
              }
            }
          }
        }
      });

      obrasCreadas.push(obraCreada);
    }

    return {
      produccion: formularioPadre,
      obras: obrasCreadas
    };
  });

  res.status(201).json({
    success: true,
    message: `Producción creada exitosamente con ${resultado.obras.length} obras`,
    data: {
      produccion: resultado.produccion,
      totalObras: resultado.obras.length,
      obras: resultado.obras
    }
  });
});

// GET /api/producciones/:id
// Obtener una producción con todas sus obras hijas
export const getProduccion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const produccion = await prisma.formulario.findUnique({
    where: {
      id: parseInt(id),
      esProduccion: true
    },
    include: {
      estado: true,
      usuario: {
        select: {
          id: true,
          nombrecompleto: true
        }
      },
      productos: {
        include: {
          producto: true
        }
      },
      clientes: {
        include: {
          cliente: true
        }
      },
      obrasHijas: {
        include: {
          estado: true,
          productos: {
            include: {
              campos: {
                include: {
                  campo: true
                }
              }
            }
          }
        },
        orderBy: {
          codigo: 'asc'
        }
      },
      factura: {
        include: {
          estado: true
        }
      }
    }
  });

  if (!produccion) {
    throw new AppError('Producción no encontrada', 404);
  }

  res.json({
    success: true,
    data: produccion
  });
});

// GET /api/producciones
// Listar todas las producciones
export const getProducciones = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const estadoId = req.query.estadoId ? parseInt(req.query.estadoId as string) : undefined;

  const where: any = {
    esProduccion: true
  };

  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: 'insensitive' } },
      { tituloProduccion: { contains: search, mode: 'insensitive' } },
      { clientes: { some: { cliente: { nombrecompleto: { contains: search, mode: 'insensitive' } } } } }
    ];
  }

  if (estadoId) {
    where.estadoId = estadoId;
  }

  const [producciones, total] = await Promise.all([
    prisma.formulario.findMany({
      where,
      skip,
      take: limit,
      include: {
        estado: true,
        usuario: {
          select: {
            id: true,
            nombrecompleto: true
          }
        },
        productos: {
          include: {
            producto: true
          }
        },
        clientes: {
          include: {
            cliente: {
              select: {
                id: true,
                codigo: true,
                nombrecompleto: true,
                identificacion: true
              }
            }
          }
        },
        _count: {
          select: {
            obrasHijas: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    }),
    prisma.formulario.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      producciones,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
