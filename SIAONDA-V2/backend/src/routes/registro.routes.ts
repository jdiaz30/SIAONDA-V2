import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboard,
  getObrasPendientes,
  asentarObra,
  asentarProduccion,
  devolverAAAU,
  crearRegistrosDesdeFormulario,
  getRegistros,
  getRegistroDetalle,
  actualizarEstadoRegistro,
  generarCertificado,
  subirCertificadoFirmado,
  uploadCertificado,
  enviarAAAU,
  getRegistrosParaCertificados,
  getCertificadosListosAAU
} from '../controllers/registro.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboard);

// Obras pendientes de asentamiento
router.get('/pendientes', getObrasPendientes);

// Asentar obra
router.post('/asentar', asentarObra);

// Asentar producción completa
router.post('/asentar-produccion', asentarProduccion);

// Devolver obra a AAU
router.post('/devolver-aau', devolverAAAU);

// Crear registros desde formulario pagado (llamado desde AAU)
router.post('/crear-desde-formulario', crearRegistrosDesdeFormulario);

// Certificados
router.get('/para-certificados', getRegistrosParaCertificados);
router.post('/:id/generar-certificado', generarCertificado);
router.post('/:id/subir-firmado', uploadCertificado.single('certificado'), subirCertificadoFirmado);

// Envío a AAU
router.get('/listos-aau', getCertificadosListosAAU);
router.post('/enviar-aau', enviarAAAU);

// Listar registros con filtros
router.get('/', getRegistros);

// Detalle de registro
router.get('/:id', getRegistroDetalle);

// Actualizar estado
router.put('/:id/estado', actualizarEstadoRegistro);

export default router;
