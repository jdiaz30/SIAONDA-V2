import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Endpoint robusto para descargar archivos
 * Busca el archivo en múltiples ubicaciones posibles
 * para garantizar que siempre funcione sin importar dónde esté guardado
 */
export const descargarArchivo = asyncHandler(async (req: Request, res: Response) => {
  // Express captura el wildcard como params[0]
  const rutaArchivo = (req.params as any)[0] || req.params['*' as any] || '';

  if (!rutaArchivo) {
    console.error('❌ Ruta vacía. req.params:', req.params);
    throw new AppError('Ruta de archivo no especificada', 400);
  }

  console.log('📥 Solicitud de descarga:', rutaArchivo);

  // Limpiar la ruta: remover prefijo 'uploads/' si existe
  const rutaLimpia = rutaArchivo.replace(/^uploads\//, '');

  // Extraer solo el nombre del archivo (sin subcarpetas)
  const nombreArchivo = path.basename(rutaLimpia);

  // Extraer el nombre base sin timestamp (para buscar archivos similares)
  // Ejemplo: "archivo-1234567890-123456789.pdf" -> "archivo"
  const nombreBase = nombreArchivo.replace(/-\d+-\d+\./, '.');

  // Ubicaciones posibles donde puede estar el archivo
  const posiblesUbicaciones = [
    // 1. Ruta exacta como viene en la BD
    path.join(process.cwd(), 'uploads', rutaLimpia),

    // 2. Solo el nombre del archivo en temp/ (carpeta más común)
    path.join(process.cwd(), 'uploads', 'temp', nombreArchivo),

    // 3. Solo el nombre del archivo en formularios/
    path.join(process.cwd(), 'uploads', 'formularios', nombreArchivo),

    // 4. Solo el nombre del archivo en clientes/
    path.join(process.cwd(), 'uploads', 'clientes', nombreArchivo),

    // 5. Solo el nombre del archivo en certificados/
    path.join(process.cwd(), 'uploads', 'certificados', nombreArchivo),
  ];

  // Buscar el archivo en todas las ubicaciones posibles
  let archivoEncontrado: string | null = null;

  for (const ubicacion of posiblesUbicaciones) {
    if (fs.existsSync(ubicacion) && fs.statSync(ubicacion).isFile()) {
      archivoEncontrado = ubicacion;
      console.log('✅ Archivo encontrado en:', ubicacion);
      break;
    }
  }

  // Si no se encontró por ruta exacta, buscar por patrón de nombre en temp/
  if (!archivoEncontrado) {
    const directoriosBusqueda = ['temp', 'formularios', 'clientes', 'certificados'];

    for (const dir of directoriosBusqueda) {
      const dirPath = path.join(process.cwd(), 'uploads', dir);

      if (fs.existsSync(dirPath)) {
        const archivos = fs.readdirSync(dirPath);

        // Buscar archivos que coincidan con el patrón base
        const archivoSimilar = archivos.find(archivo => {
          // Comparar el nombre base (sin timestamps)
          const archivoSinTimestamp = archivo.replace(/-\d+-\d+\./, '.');
          return archivoSinTimestamp === nombreBase;
        });

        if (archivoSimilar) {
          archivoEncontrado = path.join(dirPath, archivoSimilar);
          console.log('✅ Archivo encontrado por patrón en:', archivoEncontrado);
          break;
        }
      }
    }
  }

  if (!archivoEncontrado) {
    console.error('❌ Archivo no encontrado');
    console.error('   Buscado:', nombreArchivo);
    console.error('   Patrón:', nombreBase);
    throw new AppError('Archivo no encontrado', 404);
  }

  // Validar que el archivo esté dentro de la carpeta uploads (seguridad)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!archivoEncontrado.startsWith(uploadsDir)) {
    console.error('🚫 Intento de acceso fuera de uploads:', archivoEncontrado);
    throw new AppError('Acceso denegado', 403);
  }

  // Obtener información del archivo
  const stats = fs.statSync(archivoEncontrado);
  const nombreArchivoReal = path.basename(archivoEncontrado);

  // Configurar headers
  res.setHeader('Content-Type', obtenerMimeType(archivoEncontrado));
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nombreArchivoReal)}"`);

  // Enviar archivo
  const stream = fs.createReadStream(archivoEncontrado);
  stream.pipe(res);

  stream.on('error', (error) => {
    console.error('❌ Error al leer archivo:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al leer el archivo' });
    }
  });
});

/**
 * Determinar MIME type basado en la extensión del archivo
 */
function obtenerMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.zip': 'application/zip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
