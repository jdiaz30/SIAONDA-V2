import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Validar formato de RNC dominicano (XXX-XXXXX-X)
 */
const validarRNC = (rnc: string): boolean => {
  const rncRegex = /^\d{3}-?\d{5}-?\d{1}$/;
  return rncRegex.test(rnc);
};

/**
 * Normalizar RNC (quitar guiones)
 */
const normalizarRNC = (rnc: string): string => {
  return rnc.replace(/-/g, '');
};

/**
 * Crear nueva empresa
 */
export const crearEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nombreEmpresa,
      nombreComercial,
      rnc,
      direccion,
      telefono,
      fax,
      email,
      correoElectronico, // Alias del frontend
      paginaWeb,
      categoriaIrcId,
      tipoPersona,
      nombrePropietario,
      cedulaPropietario,
      descripcionActividades,
      provinciaId,
      personaContacto,
      statusId,
      estadoJuridicoId,
      conclusionId,
      statusExternoId,
      consejoAdministracion,
      principalesClientes
    } = req.body;

    // Mapear correoElectronico a email
    const emailFinal = email || correoElectronico || '';

    // Validaciones
    if (!rnc || !validarRNC(rnc)) {
      return res.status(400).json({
        success: false,
        message: 'RNC inválido. Formato esperado: XXX-XXXXX-X'
      });
    }

    const rncNormalizado = normalizarRNC(rnc);

    // Verificar si el RNC ya existe
    const empresaExistente = await prisma.empresaInspeccionada.findUnique({
      where: { rnc: rncNormalizado }
    });

    if (empresaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una empresa registrada con este RNC'
      });
    }

    // Validar campos según tipo de persona
    if (tipoPersona === 'MORAL' && (!consejoAdministracion || consejoAdministracion.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Las Personas Morales deben tener al menos un miembro del Consejo de Administración'
      });
    }

    if (tipoPersona === 'FISICA' && (!nombrePropietario || !cedulaPropietario)) {
      return res.status(400).json({
        success: false,
        message: 'Las Personas Físicas deben tener nombre y cédula del propietario'
      });
    }

    // Obtener ID del usuario autenticado
    const usuarioId = req.usuario?.id || 1; // TODO: Obtener del middleware de auth

    // Crear empresa con relaciones
    const empresa = await prisma.empresaInspeccionada.create({
      data: {
        nombreEmpresa,
        nombreComercial,
        rnc: rncNormalizado,
        direccion,
        telefono,
        fax,
        email: emailFinal,
        paginaWeb,
        categoriaIrcId,
        tipoPersona,
        nombrePropietario,
        cedulaPropietario,
        descripcionActividades,
        provinciaId,
        personaContacto,
        statusId: statusId || 2, // Default: NO NOTIFICADA
        estadoJuridicoId: estadoJuridicoId || 1, // Default: STATUS OK
        conclusionId: conclusionId || 2, // Default: PENDIENTE
        statusExternoId: statusExternoId || 8, // Default: NO APLICA
        registrado: false,
        existeEnSistema: true,
        creadoPorId: usuarioId,
        // Crear consejo de administración si es Persona Moral
        ...(tipoPersona === 'MORAL' && consejoAdministracion && {
          consejoAdministracion: {
            create: consejoAdministracion.map((miembro: any) => ({
              cargo: miembro.cargo,
              nombre: miembro.nombre,
              cedula: miembro.cedula
            }))
          }
        }),
        // Crear principales clientes
        ...(principalesClientes && principalesClientes.length > 0 && {
          principalesClientes: {
            create: principalesClientes.map((cliente: any, index: number) => ({
              nombreCliente: cliente.nombreCliente,
              orden: index + 1
            }))
          }
        })
      },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true,
        estadoJuridico: true,
        conclusion: true,
        statusExterno: true,
        consejoAdministracion: true,
        principalesClientes: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: empresa
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Listar empresas con filtros
 */
export const listarEmpresas = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      categoriaIrcId,
      provinciaId,
      statusId,
      vencidas,
      porVencer,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { rnc: { contains: String(search), mode: 'insensitive' } },
        { nombreEmpresa: { contains: String(search), mode: 'insensitive' } },
        { nombreComercial: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (categoriaIrcId) {
      where.categoriaIrcId = Number(categoriaIrcId);
    }

    if (provinciaId) {
      where.provinciaId = Number(provinciaId);
    }

    if (statusId) {
      where.statusId = Number(statusId);
    }

    // Filtro de empresas vencidas
    if (vencidas === 'true') {
      where.fechaVencimiento = {
        lt: new Date()
      };
    }

    // Filtro de empresas por vencer (próximos 30 días)
    if (porVencer === 'true') {
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      where.fechaVencimiento = {
        gte: hoy,
        lte: en30Dias
      };
    }

    // Ejecutar query
    const [empresas, total] = await Promise.all([
      prisma.empresaInspeccionada.findMany({
        where,
        include: {
          categoriaIrc: true,
          provincia: true,
          status: true,
          estadoJuridico: true,
          conclusion: true,
          statusExterno: true
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.empresaInspeccionada.count({ where })
    ]);

    return res.json({
      success: true,
      data: empresas,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar empresas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar empresas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener empresa por ID
 */
export const obtenerEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresaInspeccionada.findUnique({
      where: { id: Number(id) },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true,
        estadoJuridico: true,
        conclusion: true,
        statusExterno: true,
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            nombrecompleto: true
          }
        },
        consejoAdministracion: true,
        principalesClientes: {
          orderBy: { orden: 'asc' }
        },
        documentos: {
          orderBy: { cargadoEn: 'desc' }
        },
        certificadosInspeccion: {
          orderBy: { fechaEmision: 'desc' },
          take: 5
        },
        solicitudesRegistro: {
          orderBy: { creadoEn: 'desc' },
          take: 5,
          include: {
            estado: true
          }
        },
        casosInspeccion: {
          orderBy: { creadoEn: 'desc' },
          take: 5,
          include: {
            estadoCaso: true,
            status: true
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    return res.json({
      success: true,
      data: empresa
    });
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Buscar empresa por RNC
 */
export const buscarPorRNC = async (req: AuthRequest, res: Response) => {
  try {
    const { rnc } = req.params;

    if (!validarRNC(rnc)) {
      return res.status(400).json({
        success: false,
        message: 'RNC inválido. Formato esperado: XXX-XXXXX-X'
      });
    }

    const rncNormalizado = normalizarRNC(rnc);

    const empresa = await prisma.empresaInspeccionada.findUnique({
      where: { rnc: rncNormalizado },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true,
        estadoJuridico: true,
        conclusion: true,
        statusExterno: true,
        consejoAdministracion: true,
        principalesClientes: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ninguna empresa con ese RNC'
      });
    }

    return res.json({
      success: true,
      data: empresa
    });
  } catch (error) {
    console.error('Error al buscar empresa por RNC:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Actualizar empresa
 */
export const actualizarEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      consejoAdministracion,
      principalesClientes,
      categoriaIrcId,
      provinciaId,
      statusId,
      estadoJuridicoId,
      conclusionId,
      statusExternoId,
      // Campos que no existen en el schema
      sector,
      telefonoSecundario,
      correoElectronico,
      fechaConstitucion,
      ...updateData
    } = req.body;

    // No permitir actualizar el RNC
    if (updateData.rnc) {
      delete updateData.rnc;
    }

    // Preparar data para actualización con manejo de relaciones
    const data: any = { ...updateData };

    // Mapear campos del frontend al schema
    // correoElectronico -> email
    if (correoElectronico !== undefined) {
      data.email = correoElectronico;
    }

    // Manejar relaciones FK usando connect
    if (categoriaIrcId !== undefined && categoriaIrcId !== null) {
      data.categoriaIrc = { connect: { id: Number(categoriaIrcId) } };
    }

    if (provinciaId !== undefined && provinciaId !== null) {
      data.provincia = { connect: { id: Number(provinciaId) } };
    }

    if (statusId !== undefined && statusId !== null) {
      data.status = { connect: { id: Number(statusId) } };
    }

    if (estadoJuridicoId !== undefined && estadoJuridicoId !== null) {
      data.estadoJuridico = { connect: { id: Number(estadoJuridicoId) } };
    }

    if (conclusionId !== undefined && conclusionId !== null) {
      data.conclusion = { connect: { id: Number(conclusionId) } };
    }

    if (statusExternoId !== undefined && statusExternoId !== null) {
      data.statusExterno = { connect: { id: Number(statusExternoId) } };
    }

    // Manejar Consejo de Administración (Persona Moral)
    if (consejoAdministracion !== undefined) {
      // Eliminar miembros existentes y crear nuevos
      data.consejoAdministracion = {
        deleteMany: {}, // Eliminar todos los anteriores
        create: consejoAdministracion.map((miembro: any, index: number) => ({
          nombreCompleto: miembro.nombreCompleto,
          cargo: miembro.cargo,
          cedula: miembro.cedula || null,
          orden: index + 1
        }))
      };
    }

    // Manejar Principales Clientes
    if (principalesClientes !== undefined) {
      // Eliminar clientes existentes y crear nuevos
      data.principalesClientes = {
        deleteMany: {}, // Eliminar todos los anteriores
        create: principalesClientes.map((cliente: any, index: number) => ({
          nombreCliente: cliente.nombreCliente,
          descripcion: cliente.descripcion || null,
          orden: index + 1
        }))
      };
    }

    const empresa = await prisma.empresaInspeccionada.update({
      where: { id: Number(id) },
      data,
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true,
        estadoJuridico: true,
        conclusion: true,
        statusExterno: true,
        consejoAdministracion: true,
        principalesClientes: {
          orderBy: { orden: 'asc' }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      data: empresa
    });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar empresa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener empresas vencidas
 */
export const obtenerEmpresasVencidas = async (req: AuthRequest, res: Response) => {
  try {
    const empresas = await prisma.empresaInspeccionada.findMany({
      where: {
        fechaVencimiento: {
          lt: new Date()
        },
        registrado: true
      },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    return res.json({
      success: true,
      data: empresas,
      total: empresas.length
    });
  } catch (error) {
    console.error('Error al obtener empresas vencidas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresas vencidas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener empresas por vencer (próximos 30 días)
 */
export const obtenerEmpresasPorVencer = async (req: AuthRequest, res: Response) => {
  try {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const empresas = await prisma.empresaInspeccionada.findMany({
      where: {
        fechaVencimiento: {
          gte: hoy,
          lte: en30Dias
        },
        registrado: true
      },
      include: {
        categoriaIrc: true,
        provincia: true,
        status: true
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    return res.json({
      success: true,
      data: empresas,
      total: empresas.length
    });
  } catch (error) {
    console.error('Error al obtener empresas por vencer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empresas por vencer',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
