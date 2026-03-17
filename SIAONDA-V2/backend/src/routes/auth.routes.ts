import { Router } from 'express';
import { login, refreshToken, logout, getCurrentUser, cambiarContrasena } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/cambiar-contrasena', authenticate, cambiarContrasena);

export default router;
