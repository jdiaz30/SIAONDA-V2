import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getReporteIngresos,
  getReporteFormulariosPorTipo,
  getReporteProductividad,
  getReporteTiempos,
  getReporteCuellosBotella,
  getDashboardGeneral
} from '../controllers/reportes.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Dashboard general
router.get('/dashboard', getDashboardGeneral);

// Reportes financieros
router.get('/ingresos', getReporteIngresos);

// Reportes de formularios
router.get('/formularios-por-tipo', getReporteFormulariosPorTipo);

// Reportes de productividad
router.get('/productividad', getReporteProductividad);

// Reportes de tiempos
router.get('/tiempos', getReporteTiempos);

// Reportes de cuellos de botella
router.get('/cuellos-botella', getReporteCuellosBotella);

export default router;
