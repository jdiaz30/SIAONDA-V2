import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFacturas,
  getFactura,
  createFactura,
  createFacturaDesdeFormulario,
  createFacturaGenerica,
  pagarFactura,
  anularFactura,
  anularFacturaPagada,
  getEstadosFactura,
  getMetodosPago,
  getReporteVentas,
  deleteFactura,
  imprimirFactura,
  generateFacturaPDFEndpoint
} from '../controllers/facturas.controller';

const router = Router();

// Rutas públicas (sin autenticación) - para impresión
router.get('/:id/imprimir', imprimirFactura);
router.get('/:id/pdf', generateFacturaPDFEndpoint);

// Todas las demás rutas requieren autenticación
router.use(authenticate);

// Catálogos y reportes
router.get('/estados', getEstadosFactura);
router.get('/metodos-pago', getMetodosPago);
router.get('/reporte/ventas', getReporteVentas);

// CRUD principal
router.get('/', getFacturas);
router.get('/:id', getFactura);
router.post('/', createFactura);
router.post('/desde-formulario', createFacturaDesdeFormulario);
router.post('/generica', createFacturaGenerica);
router.delete('/:id', deleteFactura);

// Operaciones especiales
router.put('/:id/pagar', pagarFactura);
router.put('/:id/anular', anularFactura);
router.put('/:id/anular-pagada', anularFacturaPagada);

export default router;
