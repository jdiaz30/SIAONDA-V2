import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtener todas las categorías IRC (IRC-01 a IRC-15)
 */
export const getCategoriasIRC = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoriaIrc.findMany({
      where: { activo: true },
      orderBy: { codigo: 'asc' }
    });

    return res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías IRC:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categorías IRC',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener una categoría IRC por ID o código
 */
export const getCategoriaIRC = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar por ID si es numérico, o por código si no lo es
    const categoria = isNaN(Number(id))
      ? await prisma.categoriaIrc.findUnique({ where: { codigo: id } })
      : await prisma.categoriaIrc.findUnique({ where: { id: Number(id) } });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría IRC no encontrada'
      });
    }

    return res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error al obtener categoría IRC:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categoría IRC',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todos los status de inspección
 */
export const getStatusInspeccion = async (req: Request, res: Response) => {
  try {
    const status = await prisma.statusInspeccion.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error al obtener status de inspección:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener status de inspección',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todos los estados jurídicos
 */
export const getEstadosJuridicos = async (req: Request, res: Response) => {
  try {
    const estados = await prisma.estadoJuridico.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    console.error('Error al obtener estados jurídicos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estados jurídicos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todas las conclusiones
 */
export const getConclusiones = async (req: Request, res: Response) => {
  try {
    const conclusiones = await prisma.conclusion.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: conclusiones
    });
  } catch (error) {
    console.error('Error al obtener conclusiones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener conclusiones',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todos los status externos
 */
export const getStatusExternos = async (req: Request, res: Response) => {
  try {
    const status = await prisma.statusExterno.findMany({
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error al obtener status externos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener status externos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todas las provincias
 */
export const getProvincias = async (req: Request, res: Response) => {
  try {
    const provincias = await prisma.provincia.findMany({
      orderBy: { nombre: 'asc' }
    });

    return res.json({
      success: true,
      data: provincias
    });
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener provincias',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener estados de solicitud de inspección
 */
export const getEstadosSolicitud = async (req: Request, res: Response) => {
  try {
    const estados = await prisma.estadoSolicitudInspeccion.findMany({
      orderBy: { orden: 'asc' }
    });

    return res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    console.error('Error al obtener estados de solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estados de solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener estados de caso de inspección
 */
export const getEstadosCaso = async (req: Request, res: Response) => {
  try {
    const estados = await prisma.estadoCasoInspeccion.findMany({
      orderBy: { orden: 'asc' }
    });

    return res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    console.error('Error al obtener estados de caso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estados de caso',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener todos los catálogos en una sola llamada
 */
export const getTodosCatalogos = async (req: Request, res: Response) => {
  try {
    const [
      categoriasIRC,
      statusInspeccion,
      estadosJuridicos,
      conclusiones,
      statusExternos,
      provincias,
      estadosSolicitud,
      estadosCaso
    ] = await Promise.all([
      prisma.categoriaIrc.findMany({ where: { activo: true }, orderBy: { codigo: 'asc' } }),
      prisma.statusInspeccion.findMany({ orderBy: { id: 'asc' } }),
      prisma.estadoJuridico.findMany({ orderBy: { id: 'asc' } }),
      prisma.conclusion.findMany({ orderBy: { id: 'asc' } }),
      prisma.statusExterno.findMany({ orderBy: { id: 'asc' } }),
      prisma.provincia.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.estadoSolicitudInspeccion.findMany({ orderBy: { orden: 'asc' } }),
      prisma.estadoCasoInspeccion.findMany({ orderBy: { orden: 'asc' } })
    ]);

    return res.json({
      success: true,
      data: {
        categoriasIRC,
        statusInspeccion,
        estadosJuridicos,
        conclusiones,
        statusExternos,
        provincias,
        estadosSolicitud,
        estadosCaso
      }
    });
  } catch (error) {
    console.error('Error al obtener catálogos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener catálogos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener estados del nuevo flujo de inspecciones
 */
export const getEstadosNuevoFlujo = async (req: Request, res: Response) => {
  try {
    const [estadosViajeOficio, estadosDenuncia, estadosCasoJuridico] = await Promise.all([
      prisma.estadoViajeOficio.findMany({ orderBy: { id: 'asc' } }),
      prisma.estadoDenuncia.findMany({ orderBy: { id: 'asc' } }),
      prisma.estadoCasoJuridico.findMany({ orderBy: { id: 'asc' } })
    ]);

    return res.json({
      success: true,
      data: {
        estadosViajeOficio,
        estadosDenuncia,
        estadosCasoJuridico
      }
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
 * Obtener lista de inspectores activos
 */
export const getInspectores = async (req: Request, res: Response) => {
  try {
    // Buscar usuarios con tipo "INSPECTORIA" y estado activo
    const tipoInspector = await prisma.usuarioTipo.findFirst({
      where: { nombre: 'INSPECTORIA' }
    });

    if (!tipoInspector) {
      return res.json({
        success: true,
        data: []
      });
    }

    const estadoActivo = await prisma.usuarioEstado.findFirst({
      where: { nombre: 'Activo' }
    });

    const inspectores = await prisma.usuario.findMany({
      where: {
        tipoId: tipoInspector.id,
        estadoId: estadoActivo?.id
      },
      select: {
        id: true,
        codigo: true,
        nombrecompleto: true,
        correo: true
      },
      orderBy: {
        nombrecompleto: 'asc'
      }
    });

    return res.json({
      success: true,
      data: inspectores
    });
  } catch (error) {
    console.error('Error al obtener inspectores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener inspectores',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
