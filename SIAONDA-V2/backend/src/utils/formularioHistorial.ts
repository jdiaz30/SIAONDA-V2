import { prisma } from '../config/database';

/**
 * Registra un cambio de estado en el historial del formulario
 * @param formularioId - ID del formulario
 * @param estadoAnteriorId - ID del estado anterior (null si es creación)
 * @param estadoNuevoId - ID del nuevo estado
 * @param usuarioId - ID del usuario que realiza el cambio
 * @param accion - Tipo de acción (CREADO, DEVUELTO, APROBADO, etc.)
 * @param mensaje - Mensaje opcional (ej: razón de devolución)
 */
export async function registrarCambioEstado(
  formularioId: number,
  estadoAnteriorId: number | null,
  estadoNuevoId: number,
  usuarioId: number,
  accion: string,
  mensaje?: string
) {
  return await prisma.formularioHistorial.create({
    data: {
      formularioId,
      estadoAnteriorId,
      estadoNuevoId,
      usuarioId,
      accion,
      mensaje
    }
  });
}

/**
 * Obtiene el historial completo de un formulario
 * @param formularioId - ID del formulario
 * @returns Array con todos los cambios de estado ordenados por fecha
 */
export async function obtenerHistorialFormulario(formularioId: number) {
  return await prisma.formularioHistorial.findMany({
    where: { formularioId },
    include: {
      estadoAnterior: true,
      estadoNuevo: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          nombrecompleto: true
        }
      }
    },
    orderBy: { fecha: 'asc' }
  });
}
