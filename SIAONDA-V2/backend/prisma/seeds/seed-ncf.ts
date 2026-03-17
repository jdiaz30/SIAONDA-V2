import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNCF() {
  try {
    console.log('🌱 Insertando secuencias NCF iniciales...');

    // Vencimiento: 31 de diciembre del año actual
    const fechaVencimiento = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    // Crear secuencia NCF B01 (Facturas con Crédito Fiscal - para clientes con RNC)
    // Rango: EB0100000001 hasta EB0100001000 (1000 comprobantes)
    const secuenciaB01 = await prisma.secuenciaNcf.upsert({
      where: {
        tipoComprobante_serie_numeroInicial: {
          tipoComprobante: 'B01',
          serie: 'E',
          numeroInicial: BigInt(1)
        }
      },
      update: {},
      create: {
        tipoComprobante: 'B01',
        serie: 'E',
        numeroInicial: BigInt(1),
        numeroFinal: BigInt(1000),
        numeroActual: BigInt(0), // Empieza en 0, el primer NCF será 1
        fechaVencimiento,
        activo: true,
        observaciones: 'Secuencia inicial de prueba para Facturas con Crédito Fiscal (B01)'
      }
    });

    console.log('✅ Secuencia NCF B01 creada exitosamente:');
    console.log(`   Tipo: ${secuenciaB01.tipoComprobante}`);
    console.log(`   Serie: ${secuenciaB01.serie}`);
    console.log(`   Rango: ${secuenciaB01.numeroInicial.toString().padStart(8, '0')} - ${secuenciaB01.numeroFinal.toString().padStart(8, '0')}`);
    console.log(`   Primer NCF: ${secuenciaB01.serie}${secuenciaB01.tipoComprobante}${(secuenciaB01.numeroActual + BigInt(1)).toString().padStart(8, '0')}`);
    console.log(`   Vencimiento: ${fechaVencimiento.toLocaleDateString('es-DO')}`);
    console.log(`   Total disponible: ${Number(secuenciaB01.numeroFinal - secuenciaB01.numeroActual)} comprobantes\n`);

    // Crear secuencia NCF B02 (Facturas de Consumo - para clientes sin RNC)
    // Rango: EB0200000001 hasta EB0200001000 (1000 comprobantes)
    const secuenciaB02 = await prisma.secuenciaNcf.upsert({
      where: {
        tipoComprobante_serie_numeroInicial: {
          tipoComprobante: 'B02',
          serie: 'E',
          numeroInicial: BigInt(1)
        }
      },
      update: {},
      create: {
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

    console.log('✅ Secuencia NCF B02 creada exitosamente:');
    console.log(`   Tipo: ${secuenciaB02.tipoComprobante}`);
    console.log(`   Serie: ${secuenciaB02.serie}`);
    console.log(`   Rango: ${secuenciaB02.numeroInicial.toString().padStart(8, '0')} - ${secuenciaB02.numeroFinal.toString().padStart(8, '0')}`);
    console.log(`   Primer NCF: ${secuenciaB02.serie}${secuenciaB02.tipoComprobante}${(secuenciaB02.numeroActual + BigInt(1)).toString().padStart(8, '0')}`);
    console.log(`   Vencimiento: ${fechaVencimiento.toLocaleDateString('es-DO')}`);
    console.log(`   Total disponible: ${Number(secuenciaB02.numeroFinal - secuenciaB02.numeroActual)} comprobantes`);

  } catch (error) {
    console.error('❌ Error al insertar secuencias NCF:', error);
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
