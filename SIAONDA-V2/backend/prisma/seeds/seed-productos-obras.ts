import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductoData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number;
}

const productos: ProductoData[] = [
  // I. Obras Artísticas
  // A. Obras Musicales y Afines
  {
    codigo: 'MUS-01',
    nombre: 'Obras Musicales, con letra o sin ella',
    categoria: 'Obras Musicales',
    precio: 500.00
  },
  {
    codigo: 'MUS-02',
    nombre: 'Arreglo Musical',
    categoria: 'Obras Musicales',
    precio: 500.00
  },
  {
    codigo: 'MUS-03',
    nombre: 'Fonograma',
    categoria: 'Obras Musicales',
    precio: 1500.00
  },
  {
    codigo: 'MUS-04',
    nombre: 'Interpretaciones o Ejecuciones Musicales',
    categoria: 'Obras Musicales',
    precio: 500.00
  },
  {
    codigo: 'MUS-05',
    nombre: 'Emisiones de Radiodifusión',
    categoria: 'Obras Musicales',
    precio: 500.00
  },

  // B. Obras Audiovisuales
  {
    codigo: 'AUD-01',
    nombre: 'Obra Cinematográfica (largo metraje)',
    categoria: 'Obras Audiovisuales',
    precio: 7000.00
  },
  {
    codigo: 'AUD-02',
    nombre: 'Obra Cinematográfica (corto metraje)',
    categoria: 'Obras Audiovisuales',
    precio: 5000.00
  },
  {
    codigo: 'AUD-03',
    nombre: 'Documental (corto metraje)',
    categoria: 'Obras Audiovisuales',
    precio: 3000.00
  },
  {
    codigo: 'AUD-04',
    nombre: 'Documental (largo metraje), Temporada de Serie o Telenovela completa',
    categoria: 'Obras Audiovisuales',
    precio: 4000.00
  },
  {
    codigo: 'AUD-05',
    nombre: 'Obras Audiovisuales Análogas al Cine (Capítulo de Serie o de telenovela, Videoclip, Jingle, Promoción, entre otros)',
    categoria: 'Obras Audiovisuales',
    precio: 2000.00
  },

  // C. Obras Escénicas
  {
    codigo: 'ESC-01',
    nombre: 'Obra de Teatro',
    categoria: 'Obras Escénicas',
    precio: 1500.00
  },
  {
    codigo: 'ESC-02',
    nombre: 'Obra de Teatro Musical',
    categoria: 'Obras Escénicas',
    precio: 3000.00
  },
  {
    codigo: 'ESC-03',
    nombre: 'Concierto y/o Espectáculo',
    categoria: 'Obras Escénicas',
    precio: 1500.00
  },
  {
    codigo: 'ESC-04',
    nombre: 'Escenografía',
    categoria: 'Obras Escénicas',
    precio: 1500.00
  },
  {
    codigo: 'ESC-05',
    nombre: 'Obra coreográfica',
    categoria: 'Obras Escénicas',
    precio: 1000.00
  },
  {
    codigo: 'ESC-06',
    nombre: 'Monólogo',
    categoria: 'Obras Escénicas',
    precio: 1000.00
  },
  {
    codigo: 'ESC-07',
    nombre: 'Pantomima',
    categoria: 'Obras Escénicas',
    precio: 1000.00
  },

  // D. Obras de Artes Visuales
  {
    codigo: 'AP-01',
    nombre: 'Dibujo',
    categoria: 'Artes Visuales',
    precio: 1000.00
  },
  {
    codigo: 'AP-02',
    nombre: 'Fotografía',
    categoria: 'Artes Visuales',
    precio: 1000.00
  },
  {
    codigo: 'AP-03',
    nombre: 'Pintura',
    categoria: 'Artes Visuales',
    precio: 1000.00
  },
  {
    codigo: 'AP-04',
    nombre: 'Escultura',
    categoria: 'Artes Visuales',
    precio: 1000.00
  },
  {
    codigo: 'AP-05',
    nombre: 'Grabado',
    categoria: 'Artes Visuales',
    precio: 500.00
  },

  // E. Obras de Arte Aplicado
  {
    codigo: 'AA-01',
    nombre: 'Diseño del espacio (Arquitectura de interiores, paisajismo)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-02',
    nombre: 'Diseño textil (Ropa, vestuarios, accesorios)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-03',
    nombre: 'Diseño de productos (Mobiliarios y objetos industriales)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-04',
    nombre: 'Diseño de comunicación (Gráfico, publicidad, multimedia)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-05',
    nombre: 'Artesanía artística (Cerámica, vitrales)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-06',
    nombre: 'Artesanía artística (Joyería)',
    categoria: 'Arte Aplicado',
    precio: 1000.00
  },
  {
    codigo: 'AA-07',
    nombre: 'Juego de azar',
    categoria: 'Arte Aplicado',
    precio: 5000.00
  },
  {
    codigo: 'AA-08',
    nombre: 'Otros juegos',
    categoria: 'Arte Aplicado',
    precio: 3000.00
  },

  // II. Obras Literarias
  {
    codigo: 'LIT-01',
    nombre: 'Letra para una obra musical',
    categoria: 'Obras Literarias',
    precio: 500.00
  },
  {
    codigo: 'LIT-02',
    nombre: 'Poema',
    categoria: 'Obras Literarias',
    precio: 500.00
  },
  {
    codigo: 'LIT-03',
    nombre: 'Libro',
    categoria: 'Obras Literarias',
    precio: 3000.00
  },
  {
    codigo: 'LIT-04',
    nombre: 'Libro electrónico',
    categoria: 'Obras Literarias',
    precio: 3000.00
  },
  {
    codigo: 'LIT-05',
    nombre: 'Audiolibro',
    categoria: 'Obras Literarias',
    precio: 2000.00
  },
  {
    codigo: 'LIT-06',
    nombre: 'Libro en braille (Para personas con discapacidad visual)',
    categoria: 'Obras Literarias',
    precio: 500.00
  },
  {
    codigo: 'LIT-07',
    nombre: 'Revistas, Folletos, Agendas, Sermones, Novelas, Cuentos, Manuales, entre otras análogas',
    categoria: 'Obras Literarias',
    precio: 2000.00
  },
  {
    codigo: 'LIT-08',
    nombre: 'Edición obra de dominio público (Por cada Obra Anexa)',
    categoria: 'Obras Literarias',
    precio: 1000.00
  },
  {
    codigo: 'LIT-09',
    nombre: 'Guion Cinematográfico y Documental (largo metraje)',
    categoria: 'Obras Literarias',
    precio: 5000.00
  },
  {
    codigo: 'LIT-10',
    nombre: 'Guion Obras Audiovisuales Análogas al Cine (capítulo de una Serie o Telenovela, Videoclip, Jingle, Promoción, entre otros)',
    categoria: 'Obras Literarias',
    precio: 1000.00
  },
  {
    codigo: 'LIT-11',
    nombre: 'Sinopsis, Argumento, Escaleta de guion',
    categoria: 'Obras Literarias',
    precio: 1000.00
  },
  {
    codigo: 'LIT-12',
    nombre: 'Guion o Libreto de Humor',
    categoria: 'Obras Literarias',
    precio: 1500.00
  },
  {
    codigo: 'LIT-13',
    nombre: 'Guion para Concierto y/o Espectáculo',
    categoria: 'Obras Literarias',
    precio: 1500.00
  },
  {
    codigo: 'LIT-14',
    nombre: 'Guion para Obra de Teatro',
    categoria: 'Obras Literarias',
    precio: 1500.00
  },
  {
    codigo: 'LIT-15',
    nombre: 'Personaje',
    categoria: 'Obras Literarias',
    precio: 2000.00
  },
  {
    codigo: 'LIT-16',
    nombre: 'Seudónimo de Autor',
    categoria: 'Obras Literarias',
    precio: 1000.00
  },
  {
    codigo: 'LIT-17',
    nombre: 'Tesis, Monográfico o Anteproyecto',
    categoria: 'Obras Literarias',
    precio: 1000.00
  },
  {
    codigo: 'LIT-18',
    nombre: 'Manual taller para estudios universitarios',
    categoria: 'Obras Literarias',
    precio: 3000.00
  },
  {
    codigo: 'LIT-19',
    nombre: 'Guion cinematográfico y documental (corto metraje)',
    categoria: 'Obras Literarias',
    precio: 2000.00
  },

  // III. Obras Científicas
  {
    codigo: 'OC-01',
    nombre: 'Plano o Proyecto Arquitectónico',
    categoria: 'Obras Científicas',
    precio: 10000.00
  },
  {
    codigo: 'OC-02',
    nombre: 'Plano o Proyecto Arquitectónico de una unidad',
    categoria: 'Obras Científicas',
    precio: 5000.00
  },
  {
    codigo: 'OC-03',
    nombre: 'Obra o Proyecto de Ingeniería',
    categoria: 'Obras Científicas',
    precio: 5000.00
  },
  {
    codigo: 'OC-04',
    nombre: 'Mapas, Croquis u Obras Análogas',
    categoria: 'Obras Científicas',
    precio: 1500.00
  },
  {
    codigo: 'OC-05',
    nombre: 'Proyectos en General',
    categoria: 'Obras Científicas',
    precio: 5000.00
  },
  {
    codigo: 'OC-06',
    nombre: 'Programa Computadora',
    categoria: 'Obras Científicas',
    precio: 10000.00
  },
  {
    codigo: 'OC-07',
    nombre: 'Página Web/Multimedia',
    categoria: 'Obras Científicas',
    precio: 3000.00
  },
  {
    codigo: 'OC-08',
    nombre: 'Base Electrónica de Datos',
    categoria: 'Obras Científicas',
    precio: 2000.00
  },

  // IV. Colección y Compilación de Obras
  {
    codigo: 'CC-01',
    nombre: 'Obras Musicales (Impresas o Sonoras)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-02',
    nombre: 'Pinturas',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-03',
    nombre: 'Dibujos',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-04',
    nombre: 'Fotografías',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-05',
    nombre: 'Poemas',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-06',
    nombre: 'Datos, Documentos, Libros o Escritos',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-07',
    nombre: 'Esculturas',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-08',
    nombre: 'Grabados',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-09',
    nombre: 'Diseños del espacio (Arquitectura de Interiores, paisajismo)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-10',
    nombre: 'Diseños Textil (Ropas, vestuarios, accesorios)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-11',
    nombre: 'Diseños de productos (Mobiliarios y Objetos industriales)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-12',
    nombre: 'Diseños de comunicación (Gráfico, Sonoro, Publicidad, Multimedia)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-13',
    nombre: 'Artesanía artística (Cerámica, vitrales)',
    categoria: 'Colecciones y Compilaciones',
    precio: 3000.00
  },
  {
    codigo: 'CC-14',
    nombre: 'Artesanías artísticas (joyería)',
    categoria: 'Colecciones y Compilaciones',
    precio: 13000.00
  },

  // V. Producciones de Obras (6-15)
  {
    codigo: 'MUS-01-P',
    nombre: 'Obras Musicales con letra o sin ella (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'MUS-02-P',
    nombre: 'Arreglos Musicales (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'LIT-01-P',
    nombre: 'Letras para obras musicales (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'AP-01-P',
    nombre: 'Dibujos (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'PRO-05',
    nombre: 'Personajes (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'AP-02-P',
    nombre: 'Fotografías (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'LIT-02-P',
    nombre: 'Poemas (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'AP-03-P',
    nombre: 'Pinturas (6-15)',
    categoria: 'Producciones de Obras',
    precio: 5000.00
  },
  {
    codigo: 'AP-04-P',
    nombre: 'Esculturas (6-15)',
    categoria: 'Producciones de Obras',
    precio: 5000.00
  },
  {
    codigo: 'AP-05-P',
    nombre: 'Grabados (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'AA-05-P',
    nombre: 'Artesanías artísticas (Cerámica, vitrales) (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },
  {
    codigo: 'AA-06-P',
    nombre: 'Artesanías artísticas (joyería) (6-15)',
    categoria: 'Producciones de Obras',
    precio: 4000.00
  },
  {
    codigo: 'PRO-13',
    nombre: 'Diseños Textil (Ropas, vestuarios, accesorios) (6-15)',
    categoria: 'Producciones de Obras',
    precio: 4000.00
  },
  {
    codigo: 'MUS-03-P',
    nombre: 'Fonogramas (6-15)',
    categoria: 'Producciones de Obras',
    precio: 6000.00
  },
  {
    codigo: 'MUS-04-P',
    nombre: 'Interpretaciones o Ejecuciones Musicales (6-15)',
    categoria: 'Producciones de Obras',
    precio: 3000.00
  },

  // VI. Actos o Contratos
  {
    codigo: 'AC-01',
    nombre: 'Actos o Contratos que transfieren derechos patrimoniales (Sin valores envueltos) hasta RD$200,000',
    categoria: 'Actos y Contratos',
    precio: 2000.00
  },
  {
    codigo: 'AC-02',
    nombre: 'Actos o Contratos que transfieren derechos patrimoniales (Con valores envueltos) mayor a RD$200,000 - 1% del valor',
    categoria: 'Actos y Contratos',
    descripcion: 'Precio calculado como 1% del valor del contrato',
    precio: 0.00 // Precio dinámico
  },
  {
    codigo: 'AC-03',
    nombre: 'Convenios o Contratos de Sociedades de Gestión Colectiva con similares extranjeras',
    categoria: 'Actos y Contratos',
    precio: 10000.00
  },
  {
    codigo: 'AC-04',
    nombre: 'Inscripción de decisión judicial, administrativa o arbitraje en materia de derecho de autor',
    categoria: 'Actos y Contratos',
    precio: 2000.00
  },
  {
    codigo: 'AC-05',
    nombre: 'Cancelaciones, Adiciones o Modificaciones de las inscripciones efectuadas',
    categoria: 'Actos y Contratos',
    precio: 2000.00
  },
  {
    codigo: 'AC-06',
    nombre: 'Certificaciones Generales',
    categoria: 'Actos y Contratos',
    precio: 1000.00
  },
  {
    codigo: 'AC-07',
    nombre: 'Copias simples por páginas (1 a 10 hojas) y las demás RD$5.00 c/u',
    categoria: 'Actos y Contratos',
    precio: 100.00
  },
  {
    codigo: 'SONDA055',
    nombre: 'Solicitud duplicada de Certificado',
    categoria: 'Actos y Contratos',
    precio: 1000.00
  },

  // VII. Consulta Técnica y Otros Servicios
  {
    codigo: 'CTS-01',
    nombre: 'Consulta Técnica Escrita',
    categoria: 'Consulta Técnica y Otros',
    precio: 3000.00
  },
  {
    codigo: 'CTS-02',
    nombre: 'Inspección (Distrito Nacional, Provincia Santo Domingo y Santiago en sus zonas aledañas en un rango de 40 km o menos)',
    categoria: 'Consulta Técnica y Otros',
    precio: 5000.00
  },
  {
    codigo: 'CTS-03',
    nombre: 'Inspección (Interior del país, excepto Santiago y sus zonas aledañas en un rango de 40 km o menos)',
    categoria: 'Consulta Técnica y Otros',
    precio: 8000.00
  },
  {
    codigo: 'CTS-04',
    nombre: 'Solicitud de Conciliación, Mediación y Arbitraje',
    categoria: 'Consulta Técnica y Otros',
    precio: 4500.00
  },
  {
    codigo: 'CTS-05',
    nombre: 'Solicitud de Medida Cautelar, Aplazamientos o Notificaciones de Citación (D.N. y Prov. Santo Domingo)',
    categoria: 'Consulta Técnica y Otros',
    precio: 4500.00
  },
  {
    codigo: 'CTS-06',
    nombre: 'Solicitud de Medida Cautelar, Aplazamientos o Notificaciones de Citación (Interior del País)',
    categoria: 'Consulta Técnica y Otros',
    precio: 6000.00
  },

  // VIII. Inscripción de Sociedades de Gestión Colectiva
  {
    codigo: 'ISG-01',
    nombre: 'Solicitud de incorporación de Sociedades de Gestión Colectiva',
    categoria: 'Sociedades de Gestión',
    precio: 10000.00
  },
  {
    codigo: 'ISG-02',
    nombre: 'Homologación de aprobación de Sociedades de Gestión Colectiva',
    categoria: 'Sociedades de Gestión',
    precio: 40000.00
  },
];

async function main() {
  console.log('🌱 Iniciando seed de productos de obras...\n');

  // 1. Obtener el estado ACTIVO de productos
  let estadoActivo = await prisma.productoEstado.findUnique({
    where: { nombre: 'ACTIVO' }
  });

  if (!estadoActivo) {
    console.log('   ℹ️  Creando estado ACTIVO para productos...');
    estadoActivo = await prisma.productoEstado.create({
      data: {
        nombre: 'ACTIVO',
        descripcion: 'Producto activo y disponible'
      }
    });
  }

  console.log(`✅ Estado ACTIVO encontrado (ID: ${estadoActivo.id})\n`);

  // 2. Crear productos con sus costos
  let creados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const productoData of productos) {
    try {
      // Verificar si el producto ya existe
      const existente = await prisma.producto.findUnique({
        where: { codigo: productoData.codigo }
      });

      if (existente) {
        // Actualizar producto existente
        await prisma.producto.update({
          where: { codigo: productoData.codigo },
          data: {
            nombre: productoData.nombre,
            descripcion: productoData.descripcion,
            categoria: productoData.categoria,
          }
        });

        // Actualizar costo vigente
        await prisma.productoCosto.updateMany({
          where: {
            productoId: existente.id,
            fechaFinal: null
          },
          data: {
            precio: productoData.precio
          }
        });

        actualizados++;
        console.log(`   ♻️  ${productoData.codigo}: ${productoData.nombre} (actualizado)`);
      } else {
        // Crear nuevo producto con su costo
        const nuevoProducto = await prisma.producto.create({
          data: {
            codigo: productoData.codigo,
            nombre: productoData.nombre,
            descripcion: productoData.descripcion,
            categoria: productoData.categoria,
            estadoId: estadoActivo.id,
            costos: {
              create: {
                precio: productoData.precio,
                cantidadMin: 1,
                cantidadMax: productoData.codigo.endsWith('-P') ? 15 : 1, // Producciones hasta 15
                fechaInicio: new Date()
              }
            }
          }
        });

        creados++;
        console.log(`   ✅ ${productoData.codigo}: ${productoData.nombre} (RD$ ${productoData.precio.toFixed(2)})`);
      }
    } catch (error) {
      errores++;
      console.error(`   ❌ Error en ${productoData.codigo}:`, error);
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Productos creados: ${creados}`);
  console.log(`   ♻️  Productos actualizados: ${actualizados}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📦 Total procesados: ${productos.length}`);
  console.log('\n✨ Seed de productos completado!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
