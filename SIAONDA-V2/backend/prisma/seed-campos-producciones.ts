import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para copiar los campos de productos normales a productos de producción
 *
 * Los productos de producción (terminan en -P) deben tener los mismos campos
 * que sus versiones individuales para capturar los datos de cada obra
 */

async function main() {
  console.log('🔄 Iniciando copia de campos a productos de producción...\n');

  // Mapeo de productos normales a productos de producción
  const mapeos = [
    { normal: 'MUS-01', produccion: 'MUS-01-P' }, // Obras Musicales
    { normal: 'MUS-02', produccion: 'MUS-02-P' }, // Arreglos Musicales
    { normal: 'MUS-03', produccion: 'MUS-03-P' }, // Fonogramas
    { normal: 'MUS-04', produccion: 'MUS-04-P' }, // Interpretaciones Musicales
    { normal: 'LIT-01', produccion: 'LIT-01-P' }, // Letras para obras musicales
    { normal: 'LIT-02', produccion: 'LIT-02-P' }, // Poemas
    { normal: 'AP-01', produccion: 'AP-01-P' },   // Dibujos
    { normal: 'AP-02', produccion: 'AP-02-P' },   // Fotografías
    { normal: 'AP-03', produccion: 'AP-03-P' },   // Pinturas
    { normal: 'AP-04', produccion: 'AP-04-P' },   // Esculturas
    { normal: 'AP-05', produccion: 'AP-05-P' },   // Grabados
    { normal: 'AA-05', produccion: 'AA-05-P' },   // Artesanías (Cerámica, vitrales)
    { normal: 'AA-06', produccion: 'AA-06-P' },   // Artesanías (Joyería)
    { normal: 'PRO-05', produccion: 'PRO-05' },   // Personajes
    { normal: 'PRO-13', produccion: 'PRO-13' },   // Diseños Textil
  ];

  let totalCamposCopiados = 0;

  for (const mapeo of mapeos) {
    try {
      // Buscar producto normal
      const productoNormal = await prisma.producto.findUnique({
        where: { codigo: mapeo.normal },
        include: {
          campos: true
        }
      });

      if (!productoNormal) {
        console.log(`⚠️  Producto normal ${mapeo.normal} no encontrado. Saltando...`);
        continue;
      }

      // Buscar producto de producción
      const productoProduccion = await prisma.producto.findUnique({
        where: { codigo: mapeo.produccion }
      });

      if (!productoProduccion) {
        console.log(`⚠️  Producto de producción ${mapeo.produccion} no encontrado. Saltando...`);
        continue;
      }

      // Verificar si ya tiene campos
      const camposExistentes = await prisma.formularioCampo.count({
        where: { productoId: productoProduccion.id }
      });

      if (camposExistentes > 0) {
        console.log(`ℹ️  ${mapeo.produccion} ya tiene ${camposExistentes} campos. Saltando...`);
        continue;
      }

      // Copiar cada campo del producto normal al producto de producción
      let camposCopiados = 0;
      for (const campoProducto of productoNormal.campos) {
        await prisma.formularioCampo.create({
          data: {
            productoId: productoProduccion.id,
            tipoId: campoProducto.tipoId,
            campo: campoProducto.campo,
            titulo: campoProducto.titulo,
            descripcion: campoProducto.descripcion,
            placeholder: campoProducto.placeholder,
            requerido: campoProducto.requerido,
            orden: campoProducto.orden,
            activo: campoProducto.activo,
            grupo: campoProducto.grupo
          }
        });
        camposCopiados++;
      }

      console.log(`✅ ${mapeo.produccion}: ${camposCopiados} campos copiados desde ${mapeo.normal}`);
      totalCamposCopiados += camposCopiados;

    } catch (error) {
      console.error(`❌ Error procesando ${mapeo.produccion}:`, error);
    }
  }

  console.log(`\n✨ Proceso completado. Total de campos copiados: ${totalCamposCopiados}`);
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
