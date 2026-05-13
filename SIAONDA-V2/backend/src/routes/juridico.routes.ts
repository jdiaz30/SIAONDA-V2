import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as juridicoController from '../controllers/juridico.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar y ver casos
router.get('/casos', juridicoController.listarCasosJuridicos);
router.get('/casos/:id', juridicoController.obtenerCasoJuridico);

// Acciones sobre casos
router.put('/casos/:id/en-atencion', juridicoController.marcarEnAtencion);
router.put('/casos/:id/cerrar', juridicoController.cerrarCasoJuridico);

// Estados
router.get('/estados', juridicoController.obtenerEstados);

// Actos y Contratos
router.get('/actos-contratos', juridicoController.getActosContratos);
router.get('/actos-contratos/:id', juridicoController.getActoContratoDetalle);

export default router;
