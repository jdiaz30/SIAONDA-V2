import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * REGISTRAR ACTA DE INSPECCIÓN DE OFICIO
 */
export const registrarActa = async (req: AuthRequest, res: Response) => {
  try {
    const {
      viajeId,
      numeroActa,
      inspectorId,
      empresaRnc,
      empresaNombre,
      resultadoInspeccion,
      requiereSeguimiento
    } = req.body;

    const file = req.file;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validaciones
    if (!viajeId || !inspectorId || !file) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos (viajeId, inspectorId, PDF del acta)'
      });
    }

    if (!empresaRnc && !empresaNombre) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos el RNC o el nombre de la empresa'
      });
    }

    // Verificar que el viaje existe y está ABIERTO
    const viaje = await prisma.viajeOficio.findUnique({
      where: { id: Number(viajeId) },
      include: { estadoViaje: true }
    });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    if (viaje.estadoViaje.nombre !== 'ABIERTO') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden registrar actas en viajes ABIERTOS'
      });
    }

    // Generar número de acta automáticamente en formato XXX-XX (3 dígitos + 2 dígitos de año)
    // Ejemplo: 001-25, 002-25, ... 001-26
    let numeroActaGenerado: string;

    if (numeroActa && numeroActa.trim()) {
      // Si el usuario proporcionó un número, validar formato
      const formatoValido = /^\d{3}-\d{2}$/.test(numeroActa.trim());
      if (!formatoValido) {
        return res.status(400).json({
          success: false,
          message: 'El número de acta debe tener el formato XXX-XX (ej: 001-25)'
        });
      }
      numeroActaGenerado = numeroActa.trim();

      // Verificar que no esté duplicado
      const actaExistente = await prisma.actaInspeccionOficio.findUnique({
        where: { numeroActa: numeroActaGenerado }
      });

      if (actaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Este número de acta ya está registrado'
        });
      }
    } else {
      // Generar automáticamente
      const año = new Date().getFullYear();
      const añoCorto = año.toString().slice(-2); // Últimos 2 dígitos (25, 26, etc.)

      // Buscar el último número de acta del año actual
      const ultimaActa = await prisma.actaInspeccionOficio.findFirst({
        where: {
          numeroActa: {
            endsWith: `-${añoCorto}`
          }
        },
        orderBy: {
          numeroActa: 'desc'
        }
      });

      let numeroSecuencial = 1;
      if (ultimaActa) {
        const partes = ultimaActa.numeroActa.split('-');
        numeroSecuencial = parseInt(partes[0]) + 1;
      }

      numeroActaGenerado = `${numeroSecuencial.toString().padStart(3, '0')}-${añoCorto}`;
    }

    // Buscar o crear empresa
    let empresa = null;

    if (empresaRnc) {
      empresa = await prisma.empresaInspeccionada.findFirst({
        where: { rnc: empresaRnc }
      });
    }

    // Si no existe, crear empresa básica
    if (!empresa) {
      const statusActivo = await prisma.statusInspeccion.findFirst({
        where: { nombre: 'ACTIVA' }
      });

      if (!statusActivo) {
        return res.status(500).json({
          success: false,
          message: 'Status ACTIVA no encontrado en el sistema'
        });
      }

      // Necesitamos una categoría IRC por defecto
      const categoriaDefecto = await prisma.categoriaIrc.findFirst();

      if (!categoriaDefecto) {
        return res.status(500).json({
          success: false,
          message: 'No hay categorías IRC en el sistema'
        });
      }

      empresa = await prisma.empresaInspeccionada.create({
        data: {
          nombreEmpresa: empresaNombre || 'Pendiente de actualizar',
          rnc: empresaRnc || `SIN-RNC-${Date.now()}`,
          direccion: 'Pendiente de actualizar',
          telefono: 'N/A',
          email: 'pendiente@onda.gov.do',
          categoriaIrcId: categoriaDefecto.id,
          tipoPersona: 'MORAL',
          descripcionActividades: 'Empresa detectada en inspección de oficio',
          registrado: false,
          statusId: statusActivo.id,
          creadoPorId: usuarioId
        }
      });
    }

    // Crear acta
    const requiereSeguimientoBool = requiereSeguimiento === true || requiereSeguimiento === 'true';

    const acta = await prisma.actaInspeccionOficio.create({
      data: {
        numeroActa: numeroActaGenerado,
        viajeId: Number(viajeId),
        inspectorId: Number(inspectorId),
        empresaId: empresa.id,
        rutaPdfActa: file.path,
        resultadoInspeccion: resultadoInspeccion || 'Pendiente de revisión',
        requiereSeguimiento: requiereSeguimientoBool,
        fechaInspeccion: new Date()
      },
      include: {
        viaje: {
          include: {
            provincia: true
          }
        },
        inspector: {
          select: {
            id: true,
            nombrecompleto: true,
            codigo: true
          }
        },
        empresa: {
          select: {
            id: true,
            nombreEmpresa: true,
            rnc: true,
            direccion: true
          }
        }
      }
    });

    // Si requiere seguimiento, generar caso automáticamente
    let casoGenerado = null;
    if (requiereSeguimientoBool) {
      // Generar código de caso: CASO-INSP-YYYY-NNNN
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

      // Obtener estados necesarios
      const estadoPendiente = await prisma.estadoCasoInspeccion.findFirst({
        where: { nombre: 'PENDIENTE_ASIGNACION' }
      });

      const statusActivo = await prisma.statusInspeccion.findFirst({
        where: { nombre: 'ACTIVA' }
      });

      if (estadoPendiente && statusActivo) {
        casoGenerado = await prisma.casoInspeccion.create({
          data: {
            codigo,
            empresaId: empresa.id,
            tipoCaso: 'OFICIO',
            origenCaso: 'OPERATIVO_PLANIFICADO',
            estadoCasoId: estadoPendiente.id,
            statusId: statusActivo.id,
            prioridad: 'MEDIA',
            observaciones: `Generado automáticamente desde acta ${numeroActa}`
          }
        });

        // Actualizar acta para referenciar el caso
        await prisma.actaInspeccionOficio.update({
          where: { id: acta.id },
          data: { casoGeneradoId: casoGenerado.id }
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: requiereSeguimientoBool
        ? `Acta registrada y caso ${casoGenerado?.codigo} generado exitosamente`
        : 'Acta registrada exitosamente',
      data: {
        ...acta,
        casoGenerado
      }
    });
  } catch (error) {
    console.error('Error al registrar acta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar acta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * LISTAR ACTAS DE UN VIAJE
 */
export const listarActasDeViaje = async (req: AuthRequest, res: Response) => {
  try {
    const { viajeId } = req.params;

    const actas = await prisma.actaInspeccionOficio.findMany({
      where: { viajeId: Number(viajeId) },
      orderBy: { fechaInspeccion: 'desc' },
      include: {
        inspector: {
          select: {
            id: true,
            nombrecompleto: true,
            codigo: true
          }
        },
        empresa: {
          select: {
            id: true,
            nombreEmpresa: true,
            rnc: true
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
    });

    return res.json({
      success: true,
      data: actas
    });
  } catch (error) {
    console.error('Error al listar actas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar actas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * OBTENER ACTA POR ID
 */
export const obtenerActa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const acta = await prisma.actaInspeccionOficio.findUnique({
      where: { id: Number(id) },
      include: {
        viaje: {
          include: {
            provincia: true,
            estadoViaje: true
          }
        },
        inspector: {
          select: {
            id: true,
            nombrecompleto: true,
            codigo: true,
            correo: true
          }
        },
        empresa: true,
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

    if (!acta) {
      return res.status(404).json({
        success: false,
        message: 'Acta no encontrada'
      });
    }

    return res.json({
      success: true,
      data: acta
    });
  } catch (error) {
    console.error('Error al obtener acta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener acta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * GENERAR CASO DE INSPECCIÓN DESDE ACTA DE OFICIO
 */
export const generarCasoDesdeActa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const acta = await prisma.actaInspeccionOficio.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: true,
        casoGenerado: true
      }
    });

    if (!acta) {
      return res.status(404).json({
        success: false,
        message: 'Acta no encontrada'
      });
    }

    if (acta.casoGenerado) {
      return res.status(400).json({
        success: false,
        message: 'Esta acta ya tiene un caso generado'
      });
    }

    // Generar código de caso: CASO-INSP-YYYY-NNNN
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

    // Obtener estados necesarios
    const estadoPendiente = await prisma.estadoCasoInspeccion.findFirst({
      where: { nombre: 'PENDIENTE_ASIGNACION' }
    });

    const statusActivo = await prisma.statusInspeccion.findFirst({
      where: { nombre: 'ACTIVA' }
    });

    if (!estadoPendiente || !statusActivo) {
      return res.status(500).json({
        success: false,
        message: 'Estados del sistema no encontrados'
      });
    }

    // Crear caso
    const caso = await prisma.casoInspeccion.create({
      data: {
        codigo,
        empresaId: acta.empresaId,
        tipoCaso: 'OFICIO',
        origenCaso: 'OPERATIVO_PLANIFICADO',
        estadoCasoId: estadoPendiente.id,
        statusId: statusActivo.id,
        prioridad: 'MEDIA',
        observaciones: `Generado desde acta ${acta.numeroActa}`
      },
      include: {
        empresa: true,
        estadoCaso: true,
        status: true
      }
    });

    // Actualizar acta para referenciar el caso
    await prisma.actaInspeccionOficio.update({
      where: { id: Number(id) },
      data: { casoGeneradoId: caso.id }
    });

    return res.status(201).json({
      success: true,
      message: 'Caso de inspección generado exitosamente',
      data: caso
    });
  } catch (error) {
    console.error('Error al generar caso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar caso',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * EDITAR ACTA DE INSPECCIÓN
 */
export const editarActa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      numeroActa,
      inspectorId,
      empresaRnc,
      empresaNombre,
      resultadoInspeccion,
      requiereSeguimiento
    } = req.body;

    const usuarioId = req.usuario?.id;
    const file = req.file; // PDF es opcional en edición

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el acta existe
    const actaExistente = await prisma.actaInspeccionOficio.findUnique({
      where: { id: Number(id) },
      include: { casoGenerado: true }
    });

    if (!actaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Acta no encontrada'
      });
    }

    // Validar número de acta único (si se cambió)
    if (numeroActa && numeroActa !== actaExistente.numeroActa) {
      const actaDuplicada = await prisma.actaInspeccionOficio.findUnique({
        where: { numeroActa }
      });

      if (actaDuplicada) {
        return res.status(400).json({
          success: false,
          message: 'Este número de acta ya está registrado'
        });
      }
    }

    // Preparar datos para actualización
    const dataToUpdate: any = {};

    if (numeroActa) dataToUpdate.numeroActa = numeroActa;
    if (inspectorId) dataToUpdate.inspectorId = Number(inspectorId);
    if (resultadoInspeccion) dataToUpdate.resultadoInspeccion = resultadoInspeccion;
    if (file) dataToUpdate.rutaPdfActa = file.path;
    if (requiereSeguimiento !== undefined) {
      dataToUpdate.requiereSeguimiento = requiereSeguimiento === true || requiereSeguimiento === 'true';
    }

    // Manejar empresa (si cambió RNC o nombre)
    if (empresaRnc || empresaNombre) {
      let empresa = null;

      if (empresaRnc) {
        empresa = await prisma.empresaInspeccionada.findFirst({
          where: { rnc: empresaRnc }
        });
      }

      // Si no existe, crear empresa
      if (!empresa && (empresaRnc || empresaNombre)) {
        const statusActivo = await prisma.statusInspeccion.findFirst({
          where: { nombre: 'ACTIVA' }
        });
        const categoriaDefecto = await prisma.categoriaIrc.findFirst();

        if (statusActivo && categoriaDefecto) {
          empresa = await prisma.empresaInspeccionada.create({
            data: {
              nombreEmpresa: empresaNombre || 'Pendiente de actualizar',
              rnc: empresaRnc || `SIN-RNC-${Date.now()}`,
              direccion: 'Pendiente de actualizar',
              telefono: 'N/A',
              email: 'pendiente@onda.gov.do',
              categoriaIrcId: categoriaDefecto.id,
              tipoPersona: 'MORAL',
              descripcionActividades: 'Empresa actualizada desde acta de oficio',
              registrado: false,
              statusId: statusActivo.id,
              creadoPorId: usuarioId
            }
          });
        }
      }

      if (empresa) {
        dataToUpdate.empresaId = empresa.id;
      }
    }

    // Actualizar acta
    const actaActualizada = await prisma.actaInspeccionOficio.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      include: {
        viaje: {
          include: {
            provincia: true
          }
        },
        inspector: {
          select: {
            id: true,
            nombrecompleto: true,
            codigo: true
          }
        },
        empresa: {
          select: {
            id: true,
            nombreEmpresa: true,
            rnc: true,
            direccion: true
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
    });

    return res.json({
      success: true,
      message: 'Acta actualizada exitosamente',
      data: actaActualizada
    });
  } catch (error) {
    console.error('Error al editar acta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al editar acta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
