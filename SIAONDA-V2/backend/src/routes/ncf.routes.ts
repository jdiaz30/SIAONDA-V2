import { Router } from 'express';
import {
  getSecuencias,
  getSecuencia,
  crearSecuencia,
  desactivarSecuencia,
  obtenerSiguienteNcf,
  getEstadisticas
} from '../controllers/ncf.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de secuencias NCF
router.get('/', getSecuencias);
router.get('/estadisticas', getEstadisticas);
router.get('/siguiente/:tipo', obtenerSiguienteNcf);
router.get('/:id', getSecuencia);
router.post('/', crearSecuencia);
router.put('/:id/desactivar', desactivarSecuencia);

export default router;
