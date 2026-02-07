import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNCF() {
  try {
    console.log('🌱 Insertando secuencia NCF B02 inicial...');

    // Crear secuencia NCF B02 de prueba
    // Rango: B02E00000001 hasta B02E00001000 (1000 comprobantes)
    // Vencimiento: 31 de diciembre del año actual
    const fechaVencimiento = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const secuencia = await prisma.secuenciaNcf.create({
      data: {
        tipoComprobante: 'B02',
        serie: 'E',
        numeroInicial: BigInt(1),
        numeroFinal: BigInt(1000),
        numeroActual: BigInt(0), // Empieza en 0, el primer NCF será 1
        fechaVencimiento,
        activo: true,
        observaciones: 'Secuencia inicial de prueba para Facturas de Consumo (B02)'
      }
    });

    console.log('✅ Secuencia NCF creada exitosamente:');
    console.log(`   Tipo: ${secuencia.tipoComprobante}`);
    console.log(`   Serie: ${secuencia.serie}`);
    console.log(`   Rango: ${secuencia.numeroInicial.toString().padStart(8, '0')} - ${secuencia.numeroFinal.toString().padStart(8, '0')}`);
    console.log(`   Primer NCF: ${secuencia.tipoComprobante}${secuencia.serie}${(secuencia.numeroActual + BigInt(1)).toString().padStart(8, '0')}`);
    console.log(`   Vencimiento: ${fechaVencimiento.toLocaleDateString('es-DO')}`);
    console.log(`   Total disponible: ${Number(secuencia.numeroFinal - secuencia.numeroActual)} comprobantes`);

  } catch (error) {
    console.error('❌ Error al insertar secuencia NCF:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNCF()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
