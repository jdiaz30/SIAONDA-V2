import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createProduccion,
  getProduccion,
  getProducciones
} from '../controllers/producciones.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/producciones - Crear nueva producción
router.post('/', createProduccion);

// GET /api/producciones - Listar producciones
router.get('/', getProducciones);

// GET /api/producciones/:id - Obtener producción específica
router.get('/:id', getProduccion);

export default router;
