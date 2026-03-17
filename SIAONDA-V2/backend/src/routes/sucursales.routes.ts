import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSucursales } from '../controllers/sucursales.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/sucursales
router.get('/', getSucursales);

export default router;
