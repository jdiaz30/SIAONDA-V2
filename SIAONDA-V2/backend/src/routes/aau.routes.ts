import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getEstadisticasDashboard,
  getFormularios,
  getFormulariosDevueltos,
  getFormulariosEnRevision,
  getCertificadosPendientes,
  enviarARegistro,
  corregirYReenviar,
  corregirYReenviarIRC,
  registrarEntrega,
  entregarCertificado,
  getHistorialEntregas,
  crearFormularioIRC,
} from '../controllers/aau.controller';

// Configuración de multer para documentos legales de entrega
const documentosLegalesDir = path.join(__dirname, '../../public/uploads/documentos-legales');
if (!fs.existsSync(documentosLegalesDir)) {
  fs.mkdirSync(documentosLegalesDir, { recursive: true });
}

const uploadDocumentoLegal = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, documentosLegalesDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `doc-legal-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG o PNG'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

const router = Router();

// Todas las rutas de AaU requieren autenticación
router.use(authenticate);

// Estadísticas
router.get('/estadisticas/dashboard', getEstadisticasDashboard);

// Consultas de formularios
router.get('/formularios', getFormularios);
router.get('/formularios/devueltos', getFormulariosDevueltos);
router.get('/formularios/en-revision', getFormulariosEnRevision);
router.get('/formularios/pendientes-entrega', getCertificadosPendientes);

// Acciones sobre formularios
router.post('/formularios/:id/enviar-registro', enviarARegistro);
router.post('/formularios/:id/corregir-reenviar', corregirYReenviar);
router.post('/formularios/:id/entregar', registrarEntrega);

// Entrega de certificados (unificado para obras e IRC)
router.post('/certificados/:id/entregar', uploadDocumentoLegal.single('documentoLegal'), entregarCertificado);

// Formularios IRC
router.post('/formularios-irc', upload.array('documentos', 10), crearFormularioIRC);
router.post('/solicitudes-irc/:id/corregir-reenviar', corregirYReenviarIRC);

// Historial de entregas
router.get('/historial-entregas', getHistorialEntregas);

export default router;
