import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  activarUsuario,
  cambiarContrasena,
  restablecerContrasena,
  getTiposUsuario,
  getUsuariosPorTipo
} from '../controllers/usuarios.controller';
import {
  moverUsuarioAEvento,
  restaurarSucursalOriginal,
  getUsuariosEnEventos
} from '../controllers/usuarios-sucursal.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Cualquier usuario puede cambiar su propia contraseña
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
router.post('/cambiar-contrasena', cambiarContrasena);

// Solo administradores pueden gestionar usuarios
router.get('/', authorize('Administrador'), getUsuarios);
router.get('/tipos', authorize('Administrador'), getTiposUsuario);
router.get('/por-tipo/:tipoNombre', getUsuariosPorTipo); // Cualquier usuario autenticado puede ver inspectores
router.get('/en-eventos', authorize('Administrador'), getUsuariosEnEventos);
router.get('/:id', authorize('Administrador'), getUsuario);
router.post('/', authorize('Administrador'), createUsuario);
router.put('/:id', authorize('Administrador'), updateUsuario);
router.delete('/:id', authorize('Administrador'), deleteUsuario);
router.post('/:id/activar', authorize('Administrador'), activarUsuario);
router.post('/:id/restablecer-contrasena', authorize('Administrador'), restablecerContrasena);

// Gestión de eventos temporales (solo administradores)
router.post('/:id/mover-a-evento', authorize('Administrador'), moverUsuarioAEvento);
router.post('/:id/restaurar-sucursal', authorize('Administrador'), restaurarSucursalOriginal);

export default router;
