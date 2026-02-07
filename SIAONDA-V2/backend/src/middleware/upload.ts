import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './errorHandler';

// Crear directorio uploads si no existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Subdirectorios
const subdirs = ['formularios', 'clientes', 'certificados', 'temp'];
subdirs.forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configuración de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar carpeta según tipo
    let folder = 'temp';
    if (req.path.includes('formularios')) {
      folder = 'formularios';
    } else if (req.path.includes('clientes')) {
      folder = 'clientes';
    } else if (req.path.includes('certificados')) {
      folder = 'certificados';
    }

    const destPath = path.join(uploadDir, folder);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos permitidos según el sistema original
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.mp3', '.wav', '.jpg', '.jpeg', '.png', '.zip'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `Tipo de archivo no permitido: ${file.originalname}. Solo se permiten: PDF, DOC, DOCX, MP3, WAV, JPG, PNG, ZIP`,
      400
    ));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo por archivo
    files: 10 // Máximo 10 archivos por request
  }
});

// Middleware para manejar errores de multer
export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo muy grande. Tamaño máximo: 50MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Demasiados archivos. Máximo: 10 archivos'
      });
    }
    return res.status(400).json({
      error: `Error al subir archivo: ${err.message}`
    });
  }
  next(err);
};

// Función helper para eliminar archivo
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
  }
};

// Función para obtener URL pública del archivo
export const getFileUrl = (filePath: string): string => {
  // Retornar ruta relativa desde uploads
  const uploadsIndex = filePath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    return '/' + filePath.substring(uploadsIndex);
  }
  return filePath;
};
