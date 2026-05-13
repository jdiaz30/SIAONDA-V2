import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * LISTAR CASOS JURÍDICOS
 */
export const listarCasosJuridicos = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, estadoId, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (estadoId) {
      where.estadoJuridicoId = Number(estadoId);
    }

    if (search) {
      where.casoInspeccion = {
        codigo: {
          contains: String(search),
          mode: 'insensitive'
        }
      };
    }

    const [casos, total] = await Promise.all([
      prisma.casoJuridico.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { fechaRecepcion: 'desc' },
        include: {
          estadoJuridico: true,
          recibidoPor: {
            select: {
              id: true,
              nombrecompleto: true
            }
          },
          casoInspeccion: {
            include: {
              empresa: {
                select: {
                  id: true,
                  nombreEmpresa: true,
                  rnc: true
                }
              },
              estadoCaso: true,
              inspectorAsignado: {
                select: {
                  id: true,
                  nombrecompleto: true
                }
              },
              actaInspeccion: {
                select: {
                  id: true,
                  numeroActa: true,
                  creadoEn: true
                }
              },
              actaInfraccion: {
                select: {
                  id: true,
                  numeroActa: true,
                  creadoEn: true
                }
              }
            }
          }
        }
      }),
      prisma.casoJuridico.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        casos,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar casos jurídicos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar casos jurídicos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER CASO JURÍDICO POR ID
 */
export const obtenerCasoJuridico = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caso = await prisma.casoJuridico.findUnique({
      where: { id: Number(id) },
      include: {
        estadoJuridico: true,
        recibidoPor: {
          select: {
            id: true,
            nombrecompleto: true,
            correo: true
          }
        },
        casoInspeccion: {
          include: {
            empresa: true,
            estadoCaso: true,
            status: true,
            inspectorAsignado: {
              select: {
                id: true,
                nombrecompleto: true,
                codigo: true,
                correo: true
              }
            },
            actaInspeccion: {
              include: {
                inspector: {
                  select: {
                    id: true,
                    nombrecompleto: true
                  }
                }
              }
            },
            actaInfraccion: {
              include: {
                inspector: {
                  select: {
                    id: true,
                    nombrecompleto: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!caso) {
      return res.status(404).json({
        success: false,
        message: 'Caso jurídico no encontrado'
      });
    }

    return res.json({
      success: true,
      data: caso
    });
  } catch (error) {
    console.error('Error al obtener caso jurídico:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener caso jurídico',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * MARCAR CASO COMO EN ATENCIÓN
 */
export const marcarEnAtencion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const caso = await prisma.casoJuridico.findUnique({
      where: { id: Number(id) }
    });

    if (!caso) {
      return res.status(404).json({
        success: false,
        message: 'Caso jurídico no encontrado'
      });
    }

    // Obtener estado EN_ATENCION
    const estadoEnAtencion = await prisma.estadoCasoJuridico.findFirst({
      where: { nombre: 'EN_ATENCION' }
    });

    if (!estadoEnAtencion) {
      return res.status(500).json({
        success: false,
        message: 'Estado EN_ATENCION no encontrado'
      });
    }

    const casoActualizado = await prisma.casoJuridico.update({
      where: { id: Number(id) },
      data: {
        estadoJuridicoId: estadoEnAtencion.id,
        recibidoPorId: usuarioId
      },
      include: {
        estadoJuridico: true,
        recibidoPor: {
          select: {
            id: true,
            nombrecompleto: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Caso marcado como en atención',
      data: casoActualizado
    });
  } catch (error) {
    console.error('Error al marcar caso en atención:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al marcar caso en atención',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * CERRAR CASO JURÍDICO
 */
export const cerrarCasoJuridico = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const caso = await prisma.casoJuridico.findUnique({
      where: { id: Number(id) }
    });

    if (!caso) {
      return res.status(404).json({
        success: false,
        message: 'Caso jurídico no encontrado'
      });
    }

    // Obtener estado CERRADO
    const estadoCerrado = await prisma.estadoCasoJuridico.findFirst({
      where: { nombre: 'CERRADO' }
    });

    if (!estadoCerrado) {
      return res.status(500).json({
        success: false,
        message: 'Estado CERRADO no encontrado'
      });
    }

    const casoActualizado = await prisma.casoJuridico.update({
      where: { id: Number(id) },
      data: {
        estadoJuridicoId: estadoCerrado.id,
        fechaCierre: new Date(),
        observaciones: observaciones || caso.observaciones
      },
      include: {
        estadoJuridico: true,
        casoInspeccion: {
          include: {
            empresa: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Caso jurídico cerrado',
      data: casoActualizado
    });
  } catch (error) {
    console.error('Error al cerrar caso jurídico:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar caso jurídico',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER ESTADOS DE CASO JURÍDICO
 */
export const obtenerEstados = async (req: Request, res: Response) => {
  try {
    const estados = await prisma.estadoCasoJuridico.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    console.error('Error al obtener estados:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estados',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER LISTADO DE ACTOS Y CONTRATOS
 * GET /api/juridico/actos-contratos
 */
export const getActosContratos = async (req: Request, res: Response) => {
  try {
    const formularios = await prisma.formulario.findMany({
      where: {
        productos: {
          some: {
            producto: {
              categoria: 'ACTOS_CONTRATOS'
            }
          }
        }
      },
      include: {
        estado: true,
        productos: {
          include: {
            producto: true
          }
        },
        clientes: {
          include: {
            cliente: true
          },
          take: 1 // Solo el primer cliente para el listado
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    const actosContratos = formularios.map(form => {
      const primerProducto = form.productos[0];
      const primerCliente = form.clientes[0]?.cliente;

      return {
        id: form.id,
        codigo: form.codigo,
        fecha: form.fecha,
        productoNombre: primerProducto?.producto.nombre || '',
        productoCategoria: primerProducto?.producto.categoria || '',
        clienteNombre: primerCliente?.nombrecompleto || 'Sin cliente',
        estado: form.estado.nombre,
        montoTotal: parseFloat(form.montoTotal.toString())
      };
    });

    res.json(actosContratos);
  } catch (error) {
    console.error('Error cargando actos y contratos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar actos y contratos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER DETALLE DE UN ACTO O CONTRATO
 * GET /api/juridico/actos-contratos/:id
 */
export const getActoContratoDetalle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const formulario = await prisma.formulario.findUnique({
      where: { id: parseInt(id) },
      include: {
        estado: true,
        productos: {
          include: {
            producto: true,
            campos: {
              include: {
                campo: true
              }
            },
            archivos: true
          }
        },
        clientes: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!formulario) {
      return res.status(404).json({
        success: false,
        message: 'Acto o contrato no encontrado'
      });
    }

    const primerProducto = formulario.productos[0];
    const primerCliente = formulario.clientes[0]?.cliente;

    // Mapear campos específicos del formulario
    const campos = primerProducto?.campos.map(c => ({
      titulo: c.campo.titulo,
      valor: c.valor
    })) || [];

    const detalle = {
      id: formulario.id,
      codigo: formulario.codigo,
      fecha: formulario.fecha,
      productoNombre: primerProducto?.producto.nombre || '',
      productoCategoria: primerProducto?.producto.categoria || '',
      estado: formulario.estado.nombre,
      montoTotal: parseFloat(formulario.montoTotal.toString()),
      observaciones: formulario.observaciones || '',
      cliente: {
        nombrecompleto: primerCliente?.nombrecompleto || '',
        identificacion: primerCliente?.identificacion || '',
        telefono: primerCliente?.telefono || '',
        correo: primerCliente?.correo || ''
      },
      campos,
      archivos: primerProducto?.archivos.map(a => ({
        id: a.id,
        nombreOriginal: a.nombreOriginal,
        ruta: a.ruta
      })) || []
    };

    res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de acto/contrato',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
