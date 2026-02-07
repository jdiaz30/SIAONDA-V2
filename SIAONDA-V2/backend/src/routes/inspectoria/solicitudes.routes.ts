import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  crearSolicitud,
  generarFactura,
  marcarComoPagada,
  aprobarRevision,
  asentarSolicitud,
  devolverSolicitudAuU,
  generarCertificado,
  firmarCertificado,
  subirCertificadoFirmado,
  entregarCertificado,
  listarSolicitudes,
  obtenerSolicitud,
  obtenerCertificadosPendientesFirma,
  crearEmpresasFaltantes
} from '../../controllers/inspectoria/solicitudes.controller';

// Configuración de multer para carga de certificados firmados
const certificadosDir = path.join(__dirname, '../../../public/uploads/certificados');
if (!fs.existsSync(certificadosDir)) {
  fs.mkdirSync(certificadosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificadosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cert-firmado-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Configuración de multer para documentos legales de entrega
const documentosLegalesDir = path.join(__dirname, '../../../public/uploads/documentos-legales');
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

// Listar y obtener
router.get('/', listarSolicitudes);
router.get('/:id', obtenerSolicitud);

// PASO 1 - Crear solicitud (AuU)
router.post('/', crearSolicitud);

// PASO 2 - Generar factura (AuU)
router.post('/:id/generar-factura', generarFactura);

// PASO 3 - Marcar como pagada (Webhook desde Cajas)
router.post('/webhook/pago', marcarComoPagada);

// PASO 4 - Aprobar revisión (Inspectoría)
router.put('/:id/aprobar-revision', aprobarRevision);

// PASO 4B - Devolver a AuU (Inspectoría - si detecta errores)
router.put('/:id/devolver', devolverSolicitudAuU);

// PASO 5 - Asentar (Paralegal - introducir número de asiento)
router.put('/:id/asentar', asentarSolicitud);

// PASO 6 - Generar certificado (Paralegal)
router.post('/:id/generar-certificado', generarCertificado);

// PASO 7 - Firmar certificado digitalmente (Registro)
router.put('/:id/firmar', firmarCertificado);

// PASO 8 - Subir PDF firmado (Registro/Paralegal)
router.post('/:id/subir-certificado-firmado', upload.single('certificado'), subirCertificadoFirmado);

// PASO 9 - Entregar certificado (AuU) - con documento legal opcional
router.post('/:id/entregar', uploadDocumentoLegal.single('documentoLegal'), entregarCertificado);

// MANTENIMIENTO - Crear empresas de solicitudes ya asentadas
router.post('/mantenimiento/crear-empresas-faltantes', crearEmpresasFaltantes);

export default router;
