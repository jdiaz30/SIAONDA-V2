import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEED FINAL - Todas las categorías según estructura simplificada del usuario\n');

  // Obtener tipos de campo
  const tipoTexto = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'texto' } });
  const tipoNumerico = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'numerico' } });
  const tipoListado = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'listado' } });
  const tipoFecha = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'fecha' } });
  const tipoCheckbox = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'checkbox' } });

  if (!tipoTexto || !tipoNumerico || !tipoListado || !tipoFecha || !tipoCheckbox) {
    throw new Error('Tipos de campo no encontrados. Ejecuta seed.ts primero.');
  }

  // ====================================
  // I. OBRAS LITERARIAS (LIT-XX)
  // Todos los códigos LIT usan la misma estructura
  // ====================================
  console.log('📚 Creando campos para Obras Literarias...');

  const productosLiterarios = await prisma.producto.findMany({
    where: {
      codigo: {
        in: ['LIT-01', 'LIT-02', 'LIT-03', 'LIT-04', 'LIT-05', 'LIT-06', 'LIT-07',
             'LIT-08', 'LIT-09', 'LIT-10', 'LIT-11', 'LIT-12', 'LIT-13', 'LIT-14']
      }
    }
  });

  for (const producto of productosLiterarios) {
    const camposLiterarios = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'titulo_traduccion', titulo: 'Título en caso de ser una traducción al castellano', tipoId: tipoTexto.id, requerido: false, orden: 2 },
      { campo: 'genero', titulo: 'Género', tipoId: tipoListado.id, requerido: true, orden: 3,
        descripcion: 'Novela|Cuento|Poesía|Ensayo|Teatro|Biografía|Crónica|Otro',
        placeholder: 'Seleccione el género' },
      { campo: 'genero_otro', titulo: 'Otro género (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 4, grupo: 'genero_otro' },
      { campo: 'descripcion_obra', titulo: 'Breve descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },

      // 2. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 6,
        descripcion: 'Originaria|Derivada|Anónima|Individual|Colectiva|En colaboración|Seudónima|Póstuma|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'caracter_otro' },

      // 3. Si es Derivada (campos condicionales)
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'derivada' },
      { campo: 'titulo_original', titulo: 'Título de la obra original', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
      { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },
      { campo: 'ano_publicacion_original', titulo: 'Año de publicación original', tipoId: tipoNumerico.id, requerido: false, orden: 11, grupo: 'derivada' },

      // 4. Información de Publicación (opcional)
      { campo: 'publicada', titulo: '¿Ha sido publicada?', tipoId: tipoCheckbox.id, requerido: false, orden: 12 },
      { campo: 'editorial', titulo: 'Editorial', tipoId: tipoTexto.id, requerido: false, orden: 13, grupo: 'publicada' },
      { campo: 'isbn', titulo: 'ISBN', tipoId: tipoTexto.id, requerido: false, orden: 14, grupo: 'publicada' },
      { campo: 'ano_publicacion', titulo: 'Año de publicación', tipoId: tipoNumerico.id, requerido: false, orden: 15, grupo: 'publicada' },
    ];

    // Limpiar campos anteriores
    await prisma.formularioCampo.deleteMany({
      where: { productoId: producto.id }
    });

    // Insertar nuevos campos
    for (const campo of camposLiterarios) {
      await prisma.formularioCampo.create({
        data: {
          productoId: producto.id,
          ...campo
        }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // II. OBRAS CIENTÍFICAS (OC-XX)
  // ====================================
  console.log('\n🔬 Creando campos para Obras Científicas...');

  const productosCientificos = await prisma.producto.findMany({
    where: {
      codigo: {
        in: ['OC-01', 'OC-02', 'OC-03', 'OC-04', 'OC-05', 'OC-06', 'OC-07', 'OC-08']
      }
    }
  });

  for (const producto of productosCientificos) {
    const camposCientificos = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra científica', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'titulo_traduccion', titulo: 'Título en caso de ser una traducción', tipoId: tipoTexto.id, requerido: false, orden: 2 },
      { campo: 'area_cientifica', titulo: 'Área científica', tipoId: tipoListado.id, requerido: true, orden: 3,
        descripcion: 'Matemáticas|Física|Química|Biología|Medicina|Ingeniería|Tecnología|Otra',
        placeholder: 'Seleccione el área' },
      { campo: 'area_otra', titulo: 'Otra área (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 4, grupo: 'genero_otro' },
      { campo: 'descripcion_obra', titulo: 'Descripción del contenido científico', tipoId: tipoTexto.id, requerido: true, orden: 5 },

      // 2. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 6,
        descripcion: 'Originaria|Derivada|Individual|Colectiva|En colaboración|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'caracter_otro' },

      // 3. Si es Derivada
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'derivada' },
      { campo: 'titulo_original', titulo: 'Título original', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
      { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },

      // 4. Información de Publicación
      { campo: 'publicada', titulo: '¿Ha sido publicada?', tipoId: tipoCheckbox.id, requerido: false, orden: 11 },
      { campo: 'editorial', titulo: 'Editorial o institución', tipoId: tipoTexto.id, requerido: false, orden: 12, grupo: 'publicada' },
      { campo: 'issn_isbn', titulo: 'ISSN/ISBN', tipoId: tipoTexto.id, requerido: false, orden: 13, grupo: 'publicada' },
      { campo: 'ano_publicacion', titulo: 'Año de publicación', tipoId: tipoNumerico.id, requerido: false, orden: 14, grupo: 'publicada' },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposCientificos) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // III. OBRAS MUSICALES (MUS-XX)
  // MUS-01, MUS-02 comparten la misma estructura
  // ====================================
  console.log('\n🎵 Creando campos para Obras Musicales...');

  const productosMusicales = await prisma.producto.findMany({
    where: { codigo: { in: ['MUS-01', 'MUS-02', 'MUS-04', 'MUS-05'] } }
  });

  for (const producto of productosMusicales) {
    const camposMusicales = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'titulo_traduccion', titulo: 'Título en caso de traducción al castellano', tipoId: tipoTexto.id, requerido: false, orden: 2 },
      { campo: 'tipo_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
        descripcion: 'Obra musical con letra|Obra musical sin letra|Arreglo musical|Otro',
        placeholder: 'Seleccione uno' },
      { campo: 'tipo_obra_otro', titulo: 'Otro (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 4, grupo: 'tipo_otro' },
      { campo: 'descripcion_obra', titulo: 'Breve descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },

      // 2. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 6,
        descripcion: 'Originaria|Derivada|Anónima|Individual|Colectiva|En colaboración|Seudónima|Póstuma|Por encargo|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otra (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'caracter_otro' },

      // 3. Si es Derivada
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'derivada' },
      { campo: 'genero_musical', titulo: 'Género musical', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
      { campo: 'ritmo_forma', titulo: 'Ritmo/Forma musical', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },
      { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoTexto.id, requerido: false, orden: 11, grupo: 'derivada' },
      { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 12, grupo: 'derivada' },

      // 4. Información de Grabación (opcional)
      { campo: 'grabada_comercialmente', titulo: 'Grabada con fines comerciales', tipoId: tipoCheckbox.id, requerido: false, orden: 13 },
      { campo: 'productor_fonografico', titulo: 'Productor fonográfico', tipoId: tipoTexto.id, requerido: false, orden: 14, grupo: 'comercial' },
      { campo: 'domicilio_productor', titulo: 'Domicilio del productor', tipoId: tipoTexto.id, requerido: false, orden: 15, grupo: 'comercial' },
      { campo: 'editor_divulgador', titulo: 'Editor o divulgador (producción anónima)', tipoId: tipoTexto.id, requerido: false, orden: 16, grupo: 'comercial' },
      { campo: 'ano_creacion_comercial', titulo: 'Año de grabación', tipoId: tipoNumerico.id, requerido: false, orden: 17, grupo: 'comercial' },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposMusicales) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // MUS-03: PRODUCCIÓN DE FONOGRAMAS
  // Estructura diferente
  // ====================================
  console.log('\n🎙️ Creando campos para Fonogramas (MUS-03)...');

  const productoFonograma = await prisma.producto.findUnique({ where: { codigo: 'MUS-03' } });
  if (productoFonograma) {
    const camposFonograma = [
      // 1. Datos Básicos
      { campo: 'titulo_produccion', titulo: 'Título de la producción fonográfica', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'titulo_traduccion', titulo: 'Título si es traducción al castellano', tipoId: tipoTexto.id, requerido: false, orden: 2 },
      { campo: 'descripcion', titulo: 'Breve descripción de la producción', tipoId: tipoTexto.id, requerido: true, orden: 3 },

      // 2. Datos de Producción
      { campo: 'genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: true, orden: 4 },
      { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoTexto.id, requerido: true, orden: 5 },
      { campo: 'ano_fijacion', titulo: 'Año de la fijación', tipoId: tipoNumerico.id, requerido: true, orden: 6 },
      { campo: 'ano_primera_publicacion', titulo: 'Año de la primera publicación (si aplica)', tipoId: tipoNumerico.id, requerido: false, orden: 7 },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: productoFonograma.id } });
    for (const campo of camposFonograma) {
      await prisma.formularioCampo.create({
        data: { productoId: productoFonograma.id, ...campo }
      });
    }
    console.log(`  ✅ MUS-03`);
  }

  // ====================================
  // IV. OBRAS AUDIOVISUALES (AUD-XX)
  // ====================================
  console.log('\n🎬 Creando campos para Obras Audiovisuales...');

  const productosAudiovisuales = await prisma.producto.findMany({
    where: {
      codigo: {
        in: ['AUD-01', 'AUD-02', 'AUD-03', 'AUD-04', 'AUD-05', 'AUD-06',
             'AUD-07', 'AUD-08', 'AUD-09', 'AUD-10', 'AUD-11']
      }
    }
  });

  for (const producto of productosAudiovisuales) {
    const camposAudiovisuales = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra audiovisual', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'titulo_traduccion', titulo: 'Título en caso de traducción', tipoId: tipoTexto.id, requerido: false, orden: 2 },
      { campo: 'tipo_obra', titulo: 'Tipo de obra', tipoId: tipoListado.id, requerido: true, orden: 3,
        descripcion: 'Película|Documental|Serie|Cortometraje|Videoclip|Programa TV|Otro',
        placeholder: 'Seleccione el tipo' },
      { campo: 'tipo_obra_otro', titulo: 'Otro tipo (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 4, grupo: 'tipo_otro' },
      { campo: 'descripcion_obra', titulo: 'Sinopsis o descripción', tipoId: tipoTexto.id, requerido: true, orden: 5 },
      { campo: 'duracion', titulo: 'Duración (minutos)', tipoId: tipoNumerico.id, requerido: false, orden: 6 },

      // 2. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 7,
        descripcion: 'Originaria|Derivada|Individual|Colectiva|En colaboración|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'caracter_otro' },

      // 3. Si es Derivada
      { campo: 'obra_original', titulo: 'Obra en que se basa', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
      { campo: 'autor_original', titulo: 'Autor de la obra original', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },

      // 4. Información de Producción
      { campo: 'productora', titulo: 'Casa productora', tipoId: tipoTexto.id, requerido: false, orden: 11 },
      { campo: 'ano_produccion', titulo: 'Año de producción', tipoId: tipoNumerico.id, requerido: false, orden: 12 },
      { campo: 'pais_produccion', titulo: 'País de producción', tipoId: tipoTexto.id, requerido: false, orden: 13 },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposAudiovisuales) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // V. OBRAS ESCÉNICAS (ESC-XX)
  // ====================================
  console.log('\n🎭 Creando campos para Obras Escénicas...');

  const productosEscenicos = await prisma.producto.findMany({
    where: { codigo: { in: ['ESC-01', 'ESC-02', 'ESC-03', 'ESC-04'] } }
  });

  for (const producto of productosEscenicos) {
    const camposEscenicos = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra escénica', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'tipo_obra', titulo: 'Tipo de obra', tipoId: tipoListado.id, requerido: true, orden: 2,
        descripcion: 'Teatro|Danza|Coreografía|Pantomima|Otro',
        placeholder: 'Seleccione el tipo' },
      { campo: 'tipo_obra_otro', titulo: 'Otro tipo (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 3, grupo: 'tipo_otro' },
      { campo: 'descripcion_obra', titulo: 'Descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },

      // 2. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 5,
        descripcion: 'Originaria|Derivada|Individual|Colectiva|En colaboración|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 6, grupo: 'caracter_otro' },

      // 3. Si es Derivada
      { campo: 'obra_base', titulo: 'Obra en que se basa', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'derivada' },
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'derivada' },

      // 4. Información Adicional
      { campo: 'duracion', titulo: 'Duración (minutos)', tipoId: tipoNumerico.id, requerido: false, orden: 9 },
      { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 10 },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposEscenicos) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // VI. ARTES PLÁSTICAS (AP-XX)
  // ====================================
  console.log('\n🎨 Creando campos para Artes Plásticas...');

  const productosPlasticos = await prisma.producto.findMany({
    where: {
      codigo: {
        in: ['AP-01', 'AP-02', 'AP-03', 'AP-04', 'AP-05', 'AP-06',
             'AP-07', 'AP-08', 'AP-09', 'AP-10']
      }
    }
  });

  for (const producto of productosPlasticos) {
    const camposPlasticos = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título de la obra', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'tipo_obra', titulo: 'Tipo de obra', tipoId: tipoListado.id, requerido: true, orden: 2,
        descripcion: 'Pintura|Escultura|Dibujo|Grabado|Fotografía|Instalación|Arte digital|Otro',
        placeholder: 'Seleccione el tipo' },
      { campo: 'tipo_obra_otro', titulo: 'Otro tipo (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 3, grupo: 'tipo_otro' },
      { campo: 'tecnica', titulo: 'Técnica utilizada', tipoId: tipoTexto.id, requerido: true, orden: 4 },
      { campo: 'descripcion_obra', titulo: 'Descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },

      // 2. Características Físicas
      { campo: 'dimensiones', titulo: 'Dimensiones (alto x ancho x profundidad)', tipoId: tipoTexto.id, requerido: false, orden: 6 },
      { campo: 'soporte_material', titulo: 'Soporte/Material', tipoId: tipoTexto.id, requerido: false, orden: 7 },

      // 3. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 8,
        descripcion: 'Originaria|Derivada|Individual|Colectiva|En colaboración|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'caracter_otro' },

      // 4. Si es Derivada
      { campo: 'obra_base', titulo: 'Obra en que se basa', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 11, grupo: 'derivada' },

      // 5. Información Adicional
      { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 12 },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposPlasticos) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  // ====================================
  // VII. ARTES APLICADAS (AA-XX)
  // ====================================
  console.log('\n🏺 Creando campos para Artes Aplicadas...');

  const productosAplicadas = await prisma.producto.findMany({
    where: {
      codigo: {
        in: ['AA-01', 'AA-02', 'AA-03', 'AA-04', 'AA-05', 'AA-06', 'AA-07']
      }
    }
  });

  for (const producto of productosAplicadas) {
    const camposAplicadas = [
      // 1. Datos Básicos
      { campo: 'titulo_obra', titulo: 'Título o nombre de la obra', tipoId: tipoTexto.id, requerido: true, orden: 1 },
      { campo: 'tipo_arte', titulo: 'Tipo de arte aplicada', tipoId: tipoListado.id, requerido: true, orden: 2,
        descripcion: 'Diseño gráfico|Diseño industrial|Arquitectura|Joyería|Cerámica|Textil|Otro',
        placeholder: 'Seleccione el tipo' },
      { campo: 'tipo_arte_otro', titulo: 'Otro tipo (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 3, grupo: 'tipo_otro' },
      { campo: 'descripcion_obra', titulo: 'Descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },

      // 2. Características
      { campo: 'finalidad', titulo: 'Finalidad o uso', tipoId: tipoTexto.id, requerido: true, orden: 5 },
      { campo: 'materiales', titulo: 'Materiales utilizados', tipoId: tipoTexto.id, requerido: false, orden: 6 },

      // 3. Clasificación Legal
      { campo: 'caracter_obra', titulo: 'Carácter de la obra', tipoId: tipoListado.id, requerido: true, orden: 7,
        descripcion: 'Originaria|Derivada|Individual|Colectiva|En colaboración|Otra',
        placeholder: 'Seleccione uno o más' },
      { campo: 'caracter_obra_otro', titulo: 'Otro carácter (Especifique)', tipoId: tipoTexto.id, requerido: false, orden: 8, grupo: 'caracter_otro' },

      // 4. Si es Derivada
      { campo: 'obra_base', titulo: 'Obra en que se basa', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
      { campo: 'autor_original', titulo: 'Autor original', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },

      // 5. Información Adicional
      { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 11 },
    ];

    await prisma.formularioCampo.deleteMany({ where: { productoId: producto.id } });
    for (const campo of camposAplicadas) {
      await prisma.formularioCampo.create({
        data: { productoId: producto.id, ...campo }
      });
    }
    console.log(`  ✅ ${producto.codigo}`);
  }

  console.log('\n✅ ¡Seed completado exitosamente!');
  console.log('Todas las categorías han sido creadas siguiendo la estructura simplificada.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
