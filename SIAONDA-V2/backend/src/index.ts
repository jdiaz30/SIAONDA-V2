import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
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

dotenv.config();

// Fix para serializar BigInt en JSON
// Prisma usa BigInt para campos grandes, pero JSON.stringify no los soporta nativamente
(BigInt.prototype as any).toJSON = function() {
  return Number(this);
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Aumentado para firmas digitales
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
