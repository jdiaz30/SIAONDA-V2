import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * REGISTRAR DENUNCIA (AuU)
 */
export const registrarDenuncia = async (req: AuthRequest, res: Response) => {
  try {
    const {
      denuncianteNombre,
      denuncianteTelefono,
      denuncianteEmail,
      denuncianteDireccion,
      empresaDenunciada,
      direccionEmpresa,
      descripcionHechos
    } = req.body;

    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar archivos
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.cedulaDenunciante || !files.comunicacion) {
      return res.status(400).json({
        success: false,
        message: 'Debe cargar la cédula del denunciante y la comunicación'
      });
    }

    // Validaciones de campos
    if (!denuncianteNombre || !empresaDenunciada || !descripcionHechos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    // Generar código: DEN-YYYY-NNNN
    const año = new Date().getFullYear();
    const ultimaDenuncia = await prisma.denuncia.findFirst({
      where: {
        codigo: {
          startsWith: `DEN-${año}-`
        }
      },
      orderBy: { id: 'desc' }
    });

    let numero = 1;
    if (ultimaDenuncia) {
      const match = ultimaDenuncia.codigo.match(/DEN-\d{4}-(\d{4})/);
      if (match) {
        numero = parseInt(match[1]) + 1;
      }
    }

    const codigo = `DEN-${año}-${numero.toString().padStart(4, '0')}`;

    // Obtener estado PENDIENTE_PAGO
    const estadoPendiente = await prisma.estadoDenuncia.findFirst({
      where: { nombre: 'PENDIENTE_PAGO' }
    });

    if (!estadoPendiente) {
      return res.status(500).json({
        success: false,
        message: 'Estado PENDIENTE_PAGO no encontrado'
      });
    }

    // Crear denuncia
    const denuncia = await prisma.denuncia.create({
      data: {
        codigo,
        denuncianteNombre,
        denuncianteTelefono,
        denuncianteEmail,
        denuncianteDireccion,
        rutaCedulaDenunciante: files.cedulaDenunciante[0].path,
        rutaComunicacion: files.comunicacion[0].path,
        empresaDenunciada,
        direccionEmpresa,
        descripcionHechos,
        estadoDenunciaId: estadoPendiente.id,
        recibidoPorId: usuarioId
      },
      include: {
        estadoDenuncia: true,
        recibidoPor: {
          select: {
            id: true,
            nombrecompleto: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Denuncia registrada. Debe proceder a Caja para pagar RD$3,000',
      data: denuncia
    });
  } catch (error) {
    console.error('Error al registrar denuncia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar denuncia',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * LISTAR DENUNCIAS
 */
export const listarDenuncias = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, estadoId, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (estadoId) {
      where.estadoDenunciaId = Number(estadoId);
    }

    if (search) {
      where.OR = [
        { codigo: { contains: String(search), mode: 'insensitive' } },
        { denuncianteNombre: { contains: String(search), mode: 'insensitive' } },
        { empresaDenunciada: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [denuncias, total] = await Promise.all([
      prisma.denuncia.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { id: 'desc' },
        include: {
          estadoDenuncia: true,
          factura: {
            select: {
              id: true,
              codigo: true,
              total: true,
              estadoId: true
            }
          },
          recibidoPor: {
            select: {
              id: true,
              nombrecompleto: true
            }
          },
          casoGenerado: {
            select: {
              id: true,
              codigo: true,
              estadoCaso: true
            }
          }
        }
      }),
      prisma.denuncia.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        denuncias,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar denuncias:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar denuncias',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER DENUNCIA POR ID
 */
export const obtenerDenuncia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: Number(id) },
      include: {
        estadoDenuncia: true,
        factura: {
          include: {
            estado: true
          }
        },
        recibidoPor: {
          select: {
            id: true,
            nombrecompleto: true,
            correo: true
          }
        },
        casoGenerado: {
          include: {
            estadoCaso: true,
            inspectorAsignado: {
              select: {
                id: true,
                nombrecompleto: true
              }
            }
          }
        }
      }
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada'
      });
    }

    return res.json({
      success: true,
      data: denuncia
    });
  } catch (error) {
    console.error('Error al obtener denuncia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener denuncia',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * ASOCIAR FACTURA A DENUNCIA (Después del pago en Caja)
 */
export const asociarFactura = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { facturaId } = req.body;

    if (!facturaId) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar el ID de la factura'
      });
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: Number(id) }
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada'
      });
    }

    // Obtener estado PAGADA
    const estadoPagada = await prisma.estadoDenuncia.findFirst({
      where: { nombre: 'PAGADA' }
    });

    if (!estadoPagada) {
      return res.status(500).json({
        success: false,
        message: 'Estado PAGADA no encontrado'
      });
    }

    // Actualizar denuncia
    const denunciaActualizada = await prisma.denuncia.update({
      where: { id: Number(id) },
      data: {
        facturaId: Number(facturaId),
        estadoDenunciaId: estadoPagada.id
      },
      include: {
        estadoDenuncia: true,
        factura: true
      }
    });

    return res.json({
      success: true,
      message: 'Pago asociado correctamente. Denuncia lista para planificación',
      data: denunciaActualizada
    });
  } catch (error) {
    console.error('Error al asociar factura:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asociar factura',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * ASIGNAR INSPECTOR A DENUNCIA
 */
export const asignarInspector = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { inspectorId } = req.body;

    if (!inspectorId) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar el ID del inspector'
      });
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: Number(id) },
      include: { estadoDenuncia: true }
    });

    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denuncia no encontrada'
      });
    }

    // Verificar que esté pagada
    if (denuncia.estadoDenuncia.nombre !== 'PAGADA' &&
        denuncia.estadoDenuncia.nombre !== 'EN_PLANIFICACION') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden asignar denuncias pagadas o en planificación'
      });
    }

    // Generar caso de inspección
    const año = new Date().getFullYear();
    const ultimoCaso = await prisma.casoInspeccion.findFirst({
      where: {
        codigo: {
          startsWith: `CASO-INSP-${año}-`
        }
      },
      orderBy: { id: 'desc' }
    });

    let numero = 1;
    if (ultimoCaso) {
      const match = ultimoCaso.codigo.match(/CASO-INSP-\d{4}-(\d{4})/);
      if (match) {
        numero = parseInt(match[1]) + 1;
      }
    }

    const codigo = `CASO-INSP-${año}-${numero.toString().padStart(4, '0')}`;

    // Buscar o crear empresa denunciada
    let empresa = await prisma.empresaInspeccionada.findFirst({
      where: { nombreEmpresa: { contains: denuncia.empresaDenunciada, mode: 'insensitive' } }
    });

    if (!empresa) {
      const statusActivo = await prisma.statusInspeccion.findFirst({
        where: { nombre: 'ACTIVA' }
      });

      const categoriaDefecto = await prisma.categoriaIrc.findFirst();

      if (!statusActivo || !categoriaDefecto) {
        return res.status(500).json({
          success: false,
          message: 'Configuración del sistema incompleta'
        });
      }

      const usuarioId = req.usuario?.id;

      empresa = await prisma.empresaInspeccionada.create({
        data: {
          nombreEmpresa: denuncia.empresaDenunciada,
          rnc: `DEN-${Date.now()}`,
          direccion: denuncia.direccionEmpresa || 'Pendiente',
          telefono: 'N/A',
          email: 'pendiente@onda.gov.do',
          categoriaIrcId: categoriaDefecto.id,
          tipoPersona: 'MORAL',
          descripcionActividades: 'Empresa denunciada',
          registrado: false,
          statusId: statusActivo.id,
          creadoPorId: usuarioId || 1
        }
      });
    }

    // Obtener estados
    const estadoAsignado = await prisma.estadoCasoInspeccion.findFirst({
      where: { nombre: 'ASIGNADO' }
    });

    const statusActivo = await prisma.statusInspeccion.findFirst({
      where: { nombre: 'ACTIVA' }
    });

    const estadoDenunciaAsignada = await prisma.estadoDenuncia.findFirst({
      where: { nombre: 'ASIGNADA' }
    });

    if (!estadoAsignado || !statusActivo || !estadoDenunciaAsignada) {
      return res.status(500).json({
        success: false,
        message: 'Estados del sistema no encontrados'
      });
    }

    // Crear caso de inspección
    const caso = await prisma.casoInspeccion.create({
      data: {
        codigo,
        empresaId: empresa.id,
        tipoCaso: 'DENUNCIA',
        origenCaso: 'DENUNCIA_CIUDADANA',
        estadoCasoId: estadoAsignado.id,
        statusId: statusActivo.id,
        prioridad: 'ALTA',
        inspectorAsignadoId: Number(inspectorId),
        fechaAsignacion: new Date(),
        facturaId: denuncia.facturaId,
        denuncianteNombre: denuncia.denuncianteNombre,
        denuncianteTelefono: denuncia.denuncianteTelefono,
        denuncianteEmail: denuncia.denuncianteEmail,
        detallesDenuncia: denuncia.descripcionHechos
      },
      include: {
        empresa: true,
        estadoCaso: true,
        inspectorAsignado: {
          select: {
            id: true,
            nombrecompleto: true
          }
        }
      }
    });

    // Actualizar denuncia
    const denunciaActualizada = await prisma.denuncia.update({
      where: { id: Number(id) },
      data: {
        casoGeneradoId: caso.id,
        estadoDenunciaId: estadoDenunciaAsignada.id
      },
      include: {
        estadoDenuncia: true,
        casoGenerado: true
      }
    });

    return res.json({
      success: true,
      message: 'Inspector asignado y caso generado exitosamente',
      data: {
        denuncia: denunciaActualizada,
        caso
      }
    });
  } catch (error) {
    console.error('Error al asignar inspector:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asignar inspector',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
