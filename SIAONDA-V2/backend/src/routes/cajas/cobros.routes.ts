import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getCobrosPendientes,
  procesarCobro,
  getHistorialCobros
} from '../../controllers/cajas/cobros.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/pendientes', getCobrosPendientes);
router.get('/historial', getHistorialCobros);
router.post('/procesar', procesarCobro);

export default router;
