import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as financieroController from '../controllers/financiero.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Métricas financieras
router.get('/metricas', financieroController.getMetricasFinancieras);

export default router;
