import * as LISTAS from "./listas-datos";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SEED OFICIAL COMPLETO
 * Basado en: /docs/OBRAS CAMPOS SIAONDA.pdf
 *
 * IMPORTANTE: Este seed crea los campos EXACTOS según el PDF oficial.
 * NO inventa campos, NO agrupa productos que no deben compartir formularios.
 */

async function main() {
  console.log('🌱 SEED OFICIAL - Creando campos según PDF oficial\n');

  // Obtener tipos de campo
  const tipoTexto = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'texto' } });
  const tipoNumerico = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'numerico' } });
  const tipoListado = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'listado' } });
  const tipoCheckbox = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'checkbox' } });

  if (!tipoTexto || !tipoNumerico || !tipoListado || !tipoCheckbox) {
    throw new Error('Tipos de campo no encontrados');
  }

  // ==============================================
  // FUNCIÓN HELPER: Crear/Actualizar campos para un producto
  // ==============================================
  async function crearCamposProducto(codigoProducto: string, campos: any[]) {
    const producto = await prisma.producto.findUnique({ where: { codigo: codigoProducto } });
    if (!producto) {
      console.log(`  ⚠️  ${codigoProducto} no encontrado en la base de datos`);
      return;
    }

    // Obtener campos existentes
    const camposExistentes = await prisma.formularioCampo.findMany({
      where: { productoId: producto.id }
    });

    // Actualizar o crear campos
    for (const campo of campos) {
      const campoExistente = camposExistentes.find(c => c.campo === campo.campo);

      if (campoExistente) {
        // Actualizar campo existente (solo el flag requerido y título)
        await prisma.formularioCampo.update({
          where: { id: campoExistente.id },
          data: {
            requerido: campo.requerido,
            titulo: campo.titulo,
            descripcion: campo.descripcion,
            placeholder: campo.placeholder,
            orden: campo.orden,
            activo: campo.activo ?? true,
            grupo: campo.grupo,
          }
        });
      } else {
        // Crear nuevo campo
        await prisma.formularioCampo.create({
          data: {
            productoId: producto.id,
            ...campo
          }
        });
      }
    }
    console.log(`  ✅ ${codigoProducto} - ${campos.length} campos actualizados/creados`);
  }

  // ==============================================
  // CAMPOS COMUNES
  // ==============================================

  // Campos base para Artes Aplicadas y Artes Plásticas
  const camposBaseArtesConDerivada = (tipoTextoId: number, tipoListadoId: number) => [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTextoId, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTextoId, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListadoId, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_BASE,
      placeholder: 'Seleccione uno o más' },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTextoId, requerido: true, orden: 4 },

    // Campos condicionales si es Derivada
    { campo: 'autor_derivada', titulo: 'Autor (Obra Derivada)', tipoId: tipoTextoId, requerido: false, orden: 5, grupo: 'derivada' },
    { campo: 'genero_derivada', titulo: 'Género de Obra Derivada', tipoId: tipoTextoId, requerido: false, orden: 6, grupo: 'derivada' },
    { campo: 'categoria_derivada', titulo: 'Categoría de Obra Derivada', tipoId: tipoTextoId, requerido: false, orden: 7, grupo: 'derivada',
      placeholder: 'Escribir manualmente' },
    { campo: 'pais_origen_derivada', titulo: 'País de Origen de la Obra Derivada', tipoId: tipoListadoId, requerido: false, orden: 8, grupo: 'derivada',
      descripcion: LISTAS.PAISES },
    { campo: 'descripcion_derivada', titulo: 'Descripción de la obra derivada', tipoId: tipoTextoId, requerido: false, orden: 9, grupo: 'derivada' },
  ];

  // ===============================================
  // ARTES APLICADAS (AA-XX)
  // ===============================================
  console.log('🏺 Artes Aplicadas...');

  await crearCamposProducto('AA-01', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-02', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-03', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-05', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-05-P', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-06', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-07', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AA-08', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));

  // ===============================================
  // ACTOS Y CONTRATOS (AC-XX)
  // ===============================================
  console.log('\n📄 Actos y Contratos...');

  const camposActosContratos = [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'titulo_original', titulo: 'Título original', tipoId: tipoTexto.id, requerido: false, orden: 3 },
    { campo: 'descripcion', titulo: 'Descripción', tipoId: tipoTexto.id, requerido: true, orden: 4 },
    { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 5 },
  ];

  await crearCamposProducto('AC-01', camposActosContratos);
  await crearCamposProducto('AC-02', camposActosContratos);
  await crearCamposProducto('AC-03', camposActosContratos);
  await crearCamposProducto('AC-04', camposActosContratos);
  await crearCamposProducto('AC-05', camposActosContratos);
  await crearCamposProducto('AC-06', camposActosContratos);
  await crearCamposProducto('AC-07', camposActosContratos);

  // ===============================================
  // ARTES PLÁSTICAS (AP-XX)
  // ===============================================
  console.log('\n🎨 Artes Plásticas...');

  await crearCamposProducto('AP-01', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AP-02', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AP-03', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AP-04', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));
  await crearCamposProducto('AP-05', camposBaseArtesConDerivada(tipoTexto.id, tipoListado.id));

  // ===============================================
  // OBRAS AUDIOVISUALES (AUD-XX)
  // ===============================================
  console.log('\n🎬 Obras Audiovisuales...');

  const camposAudiovisuales = [
    { campo: 'nombre_director', titulo: 'Nombre completo del director', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'nacionalidad_director', titulo: 'Nacionalidad del director', tipoId: tipoListado.id, requerido: false, orden: 2,
      descripcion: LISTAS.PAISES },
    { campo: 'nombre_guionista', titulo: 'Nombre completo del guionista', tipoId: tipoTexto.id, requerido: false, orden: 3 },
    { campo: 'nacionalidad_guionista', titulo: 'Nacionalidad del guionista', tipoId: tipoListado.id, requerido: false, orden: 4,
      descripcion: LISTAS.PAISES },
    { campo: 'nombre_musicalista', titulo: 'Nombre completo del músicalista', tipoId: tipoTexto.id, requerido: false, orden: 5 },
    { campo: 'nacionalidad_musicalista', titulo: 'Nacionalidad del músicalista', tipoId: tipoListado.id, requerido: false, orden: 6,
      descripcion: LISTAS.PAISES },
    { campo: 'titulo', titulo: 'Título de la Obra Cinematográfica', tipoId: tipoTexto.id, requerido: true, orden: 7 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 8 },
    { campo: 'genero', titulo: 'Género', tipoId: tipoListado.id, requerido: true, orden: 9,
      descripcion: LISTAS.GENEROS_CINEMATOGRAFICOS },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 10 },
  ];

  await crearCamposProducto('AUD-01', camposAudiovisuales);
  await crearCamposProducto('AUD-02', camposAudiovisuales);
  await crearCamposProducto('AUD-03', camposAudiovisuales);
  await crearCamposProducto('AUD-04', camposAudiovisuales);
  await crearCamposProducto('AUD-05', camposAudiovisuales);

  // ===============================================
  // COLECCIONES Y COMPILACIONES (CC-XX)
  // ===============================================
  console.log('\n📚 Colecciones y Compilaciones...');

  const camposColecciones = [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_COLECCION,
      placeholder: 'Seleccione uno o más' },
    { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoListado.id, requerido: false, orden: 4,
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 5 },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 6 },
  ];

  await crearCamposProducto('CC-01', camposColecciones);
  await crearCamposProducto('CC-02', camposColecciones);
  await crearCamposProducto('CC-03', camposColecciones);
  await crearCamposProducto('CC-04', camposColecciones);
  await crearCamposProducto('CC-05', camposColecciones);
  await crearCamposProducto('CC-06', camposColecciones);
  await crearCamposProducto('CC-07', camposColecciones);
  await crearCamposProducto('CC-08', camposColecciones);
  await crearCamposProducto('CC-09', camposColecciones);
  await crearCamposProducto('CC-10', camposColecciones);
  await crearCamposProducto('CC-11', camposColecciones);
  await crearCamposProducto('CC-12', camposColecciones);
  await crearCamposProducto('CC-13', camposColecciones);
  await crearCamposProducto('CC-14', camposColecciones);

  // ===============================================
  // OBRAS ESCÉNICAS (ESC-XX)
  // ===============================================
  console.log('\n🎭 Obras Escénicas...');

  const camposEscenicos = [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_BASE,
      placeholder: 'Seleccione uno o más' },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },

    // Campos condicionales si es Derivada
    { campo: 'autor_derivada', titulo: 'Autor (Obra Derivada)', tipoId: tipoTexto.id, requerido: false, orden: 5, grupo: 'derivada' },
    { campo: 'genero_derivada', titulo: 'Género de Obra Derivada', tipoId: tipoTexto.id, requerido: false, orden: 6, grupo: 'derivada' },
    { campo: 'categoria_derivada', titulo: 'Categoría de Obra Derivada', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'derivada',
      placeholder: 'Escribir manualmente' },
    { campo: 'pais_origen_derivada', titulo: 'País de Origen de la Obra Derivada', tipoId: tipoListado.id, requerido: false, orden: 8, grupo: 'derivada',
      descripcion: LISTAS.PAISES },
    { campo: 'descripcion_derivada', titulo: 'Descripción de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
  ];

  await crearCamposProducto('ESC-01', camposEscenicos);
  await crearCamposProducto('ESC-02', camposEscenicos);
  await crearCamposProducto('ESC-03', camposEscenicos);
  await crearCamposProducto('ESC-04', camposEscenicos);
  await crearCamposProducto('ESC-05', camposEscenicos);
  await crearCamposProducto('ESC-06', camposEscenicos);
  await crearCamposProducto('ESC-07', camposEscenicos);

  // ===============================================
  // OBRAS LITERARIAS (LIT-XX)
  // ===============================================
  console.log('\n📖 Obras Literarias...');

  const camposLiterarios = [
    { campo: 'titulo', titulo: 'Título de la obra', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_LITERARIA,
      placeholder: 'Seleccione' },
    { campo: 'ano_publicacion', titulo: 'Año de publicación del libro', tipoId: tipoNumerico.id, requerido: false, orden: 4 },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },

    // Campos si es derivada
    { campo: 'autor_derivada', titulo: 'Autor de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 6, grupo: 'derivada' },
    { campo: 'titulo_derivada_traduccion', titulo: 'Traducción del título de obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'derivada' },
    { campo: 'edicion_comentada', titulo: 'Edición comentada', tipoId: tipoCheckbox.id, requerido: false, orden: 8, grupo: 'derivada' },
    { campo: 'adaptacion', titulo: 'Adaptación', tipoId: tipoCheckbox.id, requerido: false, orden: 9, grupo: 'derivada' },
    { campo: 'genero_derivada', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },
    { campo: 'categoria_derivada', titulo: 'Categoría', tipoId: tipoTexto.id, requerido: false, orden: 11, grupo: 'derivada' },
    { campo: 'pais_origen_derivada', titulo: 'País de Origen', tipoId: tipoListado.id, requerido: false, orden: 12, grupo: 'derivada',
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion_derivada', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 13, grupo: 'derivada' },
    { campo: 'fecha_primera_pub_derivada', titulo: 'Fecha de 1era publicación de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 14, grupo: 'derivada' },
    { campo: 'num_edicion_derivada', titulo: 'Número de edición de la obra derivada', tipoId: tipoNumerico.id, requerido: false, orden: 15, grupo: 'derivada' },
    { campo: 'ano_publicacion_derivada', titulo: 'Año de publicación', tipoId: tipoNumerico.id, requerido: false, orden: 16, grupo: 'derivada' },
    { campo: 'cantidad_ejemplares', titulo: 'Cantidad de ejemplares', tipoId: tipoNumerico.id, requerido: false, orden: 17, grupo: 'derivada' },
    { campo: 'telefono_autor_derivada', titulo: 'Teléfono de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 18, grupo: 'derivada' },
    { campo: 'celular_autor_derivada', titulo: 'Celular de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 19, grupo: 'derivada' },
  ];

  // Aplicar a todos los LIT-XX
  const codigosLiterarios = [
    'LIT-01', 'LIT-02', 'LIT-03', 'LIT-04', 'LIT-05', 'LIT-06', 'LIT-07', 'LIT-08',
    'LIT-09', 'LIT-10', 'LIT-11', 'LIT-12', 'LIT-13', 'LIT-14', 'LIT-15', 'LIT-17',
    'LIT-18', 'LIT-19', 'LIT-20'
  ];

  for (const codigo of codigosLiterarios) {
    await crearCamposProducto(codigo, camposLiterarios);
  }

  // LIT-16 tiene campos especiales
  await crearCamposProducto('LIT-16', [
    { campo: 'seudonimo', titulo: 'Seudónimo', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'descripcion', titulo: 'Descripción', tipoId: tipoTexto.id, requerido: false, orden: 2 },
  ]);

  // ===============================================
  // OBRAS MUSICALES (MUS-XX)
  // ===============================================
  console.log('\n🎵 Obras Musicales...');

  // MUS-01: OBRAS MUSICALES CON LETRA O SIN ELLA
  await crearCamposProducto('MUS-01', [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_BASE,
      placeholder: 'Seleccione uno o más' },
    { campo: 'ritmo', titulo: 'Ritmo', tipoId: tipoListado.id, requerido: true, orden: 4,
      descripcion: LISTAS.RITMOS_MUSICALES,
      placeholder: 'Seleccione el ritmo' },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },

    // Campos si es derivada
    { campo: 'autor_derivada', titulo: 'Autor de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 6, grupo: 'derivada' },
    { campo: 'titulo_derivada_traduccion', titulo: 'Traducción del título de obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 7, grupo: 'derivada' },
    { campo: 'edicion_comentada', titulo: 'Edición comentada', tipoId: tipoCheckbox.id, requerido: false, orden: 8, grupo: 'derivada' },
    { campo: 'adaptacion', titulo: 'Adaptación', tipoId: tipoCheckbox.id, requerido: false, orden: 9, grupo: 'derivada' },
    { campo: 'genero_derivada', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada' },
    { campo: 'categoria_derivada', titulo: 'Categoría', tipoId: tipoTexto.id, requerido: false, orden: 11, grupo: 'derivada' },
    { campo: 'pais_origen_derivada', titulo: 'País de Origen', tipoId: tipoListado.id, requerido: false, orden: 12, grupo: 'derivada',
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion_derivada', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 13, grupo: 'derivada' },
    { campo: 'fecha_primera_pub_derivada', titulo: 'Fecha de 1era publicación de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 14, grupo: 'derivada' },
    { campo: 'num_edicion_derivada', titulo: 'Número de edición de la obra derivada', tipoId: tipoNumerico.id, requerido: false, orden: 15, grupo: 'derivada' },
    { campo: 'ano_publicacion_derivada', titulo: 'Año de publicación', tipoId: tipoNumerico.id, requerido: false, orden: 16, grupo: 'derivada' },
    { campo: 'cantidad_ejemplares', titulo: 'Cantidad de ejemplares', tipoId: tipoNumerico.id, requerido: false, orden: 17, grupo: 'derivada' },
    { campo: 'telefono_autor_derivada', titulo: 'Teléfono de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 18, grupo: 'derivada' },
    { campo: 'celular_autor_derivada', titulo: 'Celular de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 19, grupo: 'derivada' },
  ]);

  // MUS-02: ARREGLO MUSICAL
  await crearCamposProducto('MUS-02', [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'titulo_original', titulo: 'Título original', tipoId: tipoTexto.id, requerido: true, orden: 3 },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },
    { campo: 'genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 5 },
    { campo: 'ritmo', titulo: 'Ritmo', tipoId: tipoTexto.id, requerido: false, orden: 6 },
    { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoListado.id, requerido: false, orden: 7,
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 8 },
  ]);

  // MUS-03: FONOGRAMA
  await crearCamposProducto('MUS-03', [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'genero', titulo: 'Género', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.GENEROS_FONOGRAMAS },
    { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoListado.id, requerido: true, orden: 4,
      descripcion: LISTAS.PAISES },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 5 },
    { campo: 'ano_fijacion', titulo: 'Año de fijación', tipoId: tipoNumerico.id, requerido: true, orden: 6 },
    { campo: 'ano_primera_publicacion', titulo: 'Año de primera publicación', tipoId: tipoNumerico.id, requerido: false, orden: 7 },
  ]);

  // MUS-04: INTERPRETACIONES O EJECUCIONES MUSICALES
  await crearCamposProducto('MUS-04', [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'titulo_original', titulo: 'Título original', tipoId: tipoTexto.id, requerido: false, orden: 3 },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },
    { campo: 'genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 5 },
    { campo: 'ritmo', titulo: 'Ritmo', tipoId: tipoTexto.id, requerido: false, orden: 6 },
    { campo: 'pais_origen', titulo: 'País de origen', tipoId: tipoListado.id, requerido: false, orden: 7,
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 8 },
  ]);

  // MUS-05: EMISIONES DE RADIODIFUSION
  await crearCamposProducto('MUS-05', [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: true, orden: 3 },
    { campo: 'pais_fijacion', titulo: 'País de fijación', tipoId: tipoListado.id, requerido: true, orden: 4,
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: true, orden: 5 },
    { campo: 'nombre_estacion', titulo: 'Nombre de la estación', tipoId: tipoTexto.id, requerido: true, orden: 6 },
  ]);

  // ===============================================
  // OBRAS CIENTÍFICAS (OC-XX)
  // ===============================================
  console.log('\n🔬 Obras Científicas...');

  const camposCientificos = [
    { campo: 'titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 1 },
    { campo: 'titulo_traduccion', titulo: 'Traducción del título', tipoId: tipoTexto.id, requerido: true, orden: 2 },
    { campo: 'caracter_obra', titulo: 'Indique si es', tipoId: tipoListado.id, requerido: true, orden: 3,
      descripcion: LISTAS.CARACTER_OBRA_BASE,
      placeholder: 'Seleccione uno o más' },
    { campo: 'descripcion', titulo: 'Descripción breve de la obra', tipoId: tipoTexto.id, requerido: true, orden: 4 },

    // Campos si es derivada
    { campo: 'autor_derivada', titulo: 'Autor de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 5, grupo: 'derivada' },
    { campo: 'titulo_derivada_traduccion', titulo: 'Traducción del título de obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 6, grupo: 'derivada' },
    { campo: 'edicion_comentada', titulo: 'Edición comentada', tipoId: tipoCheckbox.id, requerido: false, orden: 7, grupo: 'derivada' },
    { campo: 'adaptacion', titulo: 'Adaptación', tipoId: tipoCheckbox.id, requerido: false, orden: 8, grupo: 'derivada' },
    { campo: 'genero_derivada', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 9, grupo: 'derivada' },
    { campo: 'categoria_derivada', titulo: 'Categoría', tipoId: tipoTexto.id, requerido: false, orden: 10, grupo: 'derivada',
      placeholder: 'Listar categorías de planos o proyectos arquitectónicos' },
    { campo: 'pais_origen_derivada', titulo: 'País de Origen', tipoId: tipoListado.id, requerido: false, orden: 11, grupo: 'derivada',
      descripcion: LISTAS.PAISES },
    { campo: 'ano_creacion_derivada', titulo: 'Año de creación', tipoId: tipoNumerico.id, requerido: false, orden: 12, grupo: 'derivada' },
    { campo: 'fecha_primera_pub_derivada', titulo: 'Fecha de 1era publicación de la obra derivada', tipoId: tipoTexto.id, requerido: false, orden: 13, grupo: 'derivada' },
    { campo: 'num_edicion_derivada', titulo: 'Número de edición de la obra derivada', tipoId: tipoNumerico.id, requerido: false, orden: 14, grupo: 'derivada' },
    { campo: 'ano_publicacion_derivada', titulo: 'Año de publicación', tipoId: tipoNumerico.id, requerido: false, orden: 15, grupo: 'derivada' },
    { campo: 'cantidad_ejemplares', titulo: 'Cantidad de ejemplares', tipoId: tipoNumerico.id, requerido: false, orden: 16, grupo: 'derivada' },
    { campo: 'telefono_autor_derivada', titulo: 'Teléfono de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 17, grupo: 'derivada' },
    { campo: 'celular_autor_derivada', titulo: 'Celular de contacto del autor de la obra derivada (opcional)', tipoId: tipoTexto.id, requerido: false, orden: 18, grupo: 'derivada' },
  ];

  await crearCamposProducto('OC-01', camposCientificos);
  await crearCamposProducto('OC-02', camposCientificos);
  await crearCamposProducto('OC-03', camposCientificos);
  await crearCamposProducto('OC-04', camposCientificos);
  await crearCamposProducto('OC-05', camposCientificos);
  await crearCamposProducto('OC-06', camposCientificos);
  await crearCamposProducto('OC-07', camposCientificos);
  await crearCamposProducto('OC-08', camposCientificos);

  console.log('\n✅ ¡Seed oficial completado!');
  console.log('📄 Todos los campos han sido creados según el PDF oficial');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
