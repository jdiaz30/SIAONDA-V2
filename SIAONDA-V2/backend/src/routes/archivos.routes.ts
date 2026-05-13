import { Router } from 'express';
import { descargarArchivo } from '../controllers/archivos.controller';

const router = Router();

/**
 * Endpoint robusto para descargar archivos
 * Acepta cualquier ruta después de /api/archivos/
 * y busca el archivo en múltiples ubicaciones
 *
 * Ejemplos:
 * - /api/archivos/temp/file.pdf
 * - /api/archivos/formularios/file.pdf
 * - /api/archivos/uploads/temp/file.pdf (limpia el prefijo uploads/)
 */
router.get('/*', descargarArchivo);

export default router;
