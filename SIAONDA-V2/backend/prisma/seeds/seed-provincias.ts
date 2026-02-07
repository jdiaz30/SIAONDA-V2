import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding provincias...');

  const provincias = [
    'Azua',
    'Baoruco',
    'Barahona',
    'Dajabón',
    'Distrito Nacional',
    'Duarte',
    'Elías Piña',
    'El Seibo',
    'Espaillat',
    'Hato Mayor',
    'Hermanas Mirabal',
    'Independencia',
    'La Altagracia',
    'La Romana',
    'La Vega',
    'María Trinidad Sánchez',
    'Monseñor Nouel',
    'Monte Cristi',
    'Monte Plata',
    'Pedernales',
    'Peravia',
    'Puerto Plata',
    'Samaná',
    'San Cristóbal',
    'San José de Ocoa',
    'San Juan',
    'San Pedro de Macorís',
    'Sánchez Ramírez',
    'Santiago',
    'Santiago Rodríguez',
    'Santo Domingo',
    'Valverde'
  ];

  for (const nombre of provincias) {
    await prisma.provincia.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    });
  }

  console.log(`✅ ${provincias.length} provincias creadas`);

  const categoriasCount = await prisma.categoriaIrc.count();
  console.log(`📋 Categorías IRC en BD: ${categoriasCount}`);

  if (categoriasCount === 0) {
    console.log('⚠️  No hay categorías IRC. Ejecuta el seed principal primero.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
