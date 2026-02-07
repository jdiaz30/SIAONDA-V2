import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding estados de registro...');

  const estados = [
    {
      nombre: 'PENDIENTE_ASENTAMIENTO',
      descripcion: 'Obra pendiente de asentamiento en el registro',
      orden: 1
    },
    {
      nombre: 'ASENTADO',
      descripcion: 'Obra asentada en el registro',
      orden: 2
    },
    {
      nombre: 'CERTIFICADO_GENERADO',
      descripcion: 'Certificado PDF generado',
      orden: 3
    },
    {
      nombre: 'ENVIADO_FIRMA',
      descripcion: 'Certificado enviado a Firma Gob para firma digital',
      orden: 4
    },
    {
      nombre: 'CERTIFICADO_FIRMADO',
      descripcion: 'Certificado firmado digitalmente recibido',
      orden: 5
    },
    {
      nombre: 'LISTO_PARA_ENTREGA',
      descripcion: 'Certificado listo para ser entregado por AAU',
      orden: 6
    },
    {
      nombre: 'ENTREGADO',
      descripcion: 'Certificado entregado al cliente',
      orden: 7
    },
    {
      nombre: 'DEVUELTO_AAU',
      descripcion: 'Obra devuelta a AAU para corrección',
      orden: 8
    }
  ];

  for (const estado of estados) {
    await prisma.registroEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
    console.log(`✅ Estado creado: ${estado.nombre}`);
  }

  console.log('✨ Seed de estados de registro completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
