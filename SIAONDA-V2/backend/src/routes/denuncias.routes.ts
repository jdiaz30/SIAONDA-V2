import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as denunciasController from '../controllers/denuncias.controller';
import path from 'path';
import fs from 'fs';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD de denuncias
router.post(
  '/',
  upload.fields([
    { name: 'cedulaDenunciante', maxCount: 1 },
    { name: 'comunicacion', maxCount: 1 }
  ]),
  denunciasController.registrarDenuncia
);
router.get('/', denunciasController.listarDenuncias);
router.get('/:id', denunciasController.obtenerDenuncia);

// Acciones sobre denuncias
router.put('/:id/asociar-factura', denunciasController.asociarFactura);
router.put('/:id/asignar-inspector', denunciasController.asignarInspector);

// Rutas para Inspectoría
router.get('/inspectoria/pagadas', denunciasController.listarDenunciasPagadas);
router.post('/:denunciaId/convertir-caso', denunciasController.convertirDenunciaEnCaso);

// Servir archivos de denuncias
router.get('/:denunciaId/archivo/:tipo', (req, res) => {
  const { denunciaId, tipo } = req.params;

  // Validar tipo
  if (tipo !== 'cedula' && tipo !== 'comunicacion') {
    return res.status(400).json({ error: 'Tipo de archivo inválido' });
  }

  // Buscar la denuncia para obtener la ruta del archivo
  import('../controllers/denuncias.controller').then(async (module) => {
    try {
      const prisma = (await import('@prisma/client')).PrismaClient;
      const prismaInstance = new prisma();

      const denuncia = await prismaInstance.denuncia.findUnique({
        where: { id: parseInt(denunciaId) }
      });

      if (!denuncia) {
        return res.status(404).json({ error: 'Denuncia no encontrada' });
      }

      const rutaArchivo = tipo === 'cedula'
        ? denuncia.rutaCedulaDenunciante
        : denuncia.rutaComunicacion;

      if (!rutaArchivo) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      // La ruta viene como /app/uploads/temp/... desde el contenedor
      // En desarrollo local podría ser diferente
      const filePath = path.resolve(rutaArchivo);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no existe en el sistema' });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error sirviendo archivo:', error);
      res.status(500).json({ error: 'Error al servir archivo' });
    }
  });
});

export default router;
