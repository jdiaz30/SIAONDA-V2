import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { upperCaseMiddleware } from './middleware/upperCaseMiddleware';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import usuariosRoutes from './routes/usuarios.routes';
import clientesRoutes from './routes/clientes.routes';
import visitasRoutes from './routes/visitas.routes';
import formulariosRoutes from './routes/formularios.routes';
import certificadosRoutes from './routes/certificados.routes';
import facturasRoutes from './routes/facturas.routes';
import cajasRoutes from './routes/cajas.routes';
import cobrosRoutes from './routes/cajas/cobros.routes';
import productosRoutes from './routes/productos.routes';
import ncfRoutes from './routes/ncf.routes';
import inspectoriaRoutes from './routes/inspectoria';
import aauRoutes from './routes/aau.routes';
import juridicoRoutes from './routes/juridico.routes';
import denunciasRoutes from './routes/denuncias.routes';
import registroRoutes from './routes/registro.routes';
import reportesRoutes from './routes/reportes.routes';
import produccionesRoutes from './routes/producciones.routes';
import sucursalesRoutes from './routes/sucursales.routes';
import financieroRoutes from './routes/financiero.routes';
import archivosRoutes from './routes/archivos.routes';

dotenv.config();

// Fix para serializar BigInt en JSON
// Prisma usa BigInt para campos grandes, pero JSON.stringify no los soporta nativamente
(BigInt.prototype as any).toJSON = function() {
  return Number(this);
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad (Helmet)
// Deshabilitar HSTS y upgrade-insecure-requests para permitir HTTP en desarrollo/LAN
app.use(helmet({
  hsts: false, // No forzar HTTPS (desactivar HTTP Strict Transport Security)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      // NO incluir upgrade-insecure-requests para permitir HTTP
    },
  },
}));

// CORS: Permitir múltiples orígenes (desarrollo, Docker y red local)
const allowedOrigins = [
  'http://localhost:5173',  // Desarrollo frontend
  'http://localhost',        // Docker frontend
  'http://localhost:80',     // Docker frontend explícito
  'http://10.0.10.52',       // IP de red local
  'http://10.0.10.52:80',    // IP de red local con puerto explícito
  process.env.FRONTEND_URL   // Variable de entorno
].filter(Boolean); // Eliminar valores undefined

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Permitir cualquier IP que empiece con http://10.0.10. (red local)
      if (origin && origin.startsWith('http://10.0.10.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Aumentado para firmas digitales
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para convertir automáticamente datos de texto a MAYÚSCULAS
app.use(upperCaseMiddleware);

// Servir archivos estáticos (uploads)
const uploadsPath = path.join(__dirname, '../uploads');
const publicUploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads', express.static(publicUploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/visitas', visitasRoutes);
app.use('/api/formularios', formulariosRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/cajas', cajasRoutes);
app.use('/api/cajas/cobros', cobrosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ncf', ncfRoutes);
app.use('/api/inspectoria', inspectoriaRoutes);
app.use('/api/aau', aauRoutes);
app.use('/api/juridico', juridicoRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/registro', registroRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/producciones', produccionesRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/financiero', financieroRoutes);
app.use('/api/archivos', archivosRoutes); // Endpoint robusto para descarga de archivos

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 SIAONDA V2 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
