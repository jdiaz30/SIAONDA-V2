import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSucursales() {
  try {
    console.log('🌱 Insertando sucursales iniciales...');

    // Verificar si ya existen sucursales
    const count = await prisma.sucursal.count();
    if (count > 0) {
      console.log('⚠️  Ya existen sucursales en la base de datos. Saltando seed...');
      return;
    }

    // Crear sucursales
    const sucursales = await prisma.sucursal.createMany({
      data: [
        {
          codigo: 'SUC-SD',
          nombre: 'ONDA Santo Domingo',
          ciudad: 'Santo Domingo',
          direccion: 'Av. George Washington, Plaza de la Cultura',
          telefono: '809-688-4086',
          activo: true
        },
        {
          codigo: 'SUC-STI',
          nombre: 'ONDA Santiago',
          ciudad: 'Santiago',
          direccion: 'Centro de la Cultura de Santiago',
          telefono: '809-582-2315',
          activo: true
        },
        {
          codigo: 'SUC-EVENTOS',
          nombre: 'Eventos y Ferias',
          ciudad: 'Variable',
          direccion: 'Ubicación variable según evento',
          telefono: null,
          activo: true
        }
      ]
    });

    console.log('✅ Sucursales creadas exitosamente:');
    console.log(`   - ONDA Santo Domingo (SUC-SD)`);
    console.log(`   - ONDA Santiago (SUC-STI)`);
    console.log(`   - Eventos y Ferias (SUC-EVENTOS)`);
    console.log(`   Total: ${sucursales.count} sucursales`);

  } catch (error: any) {
    console.error('❌ Error al insertar sucursales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSucursales()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
