import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeds...');

  // 1. Estados de Usuario
  console.log('📝 Creando estados de usuario...');
  const estadoActivo = await prisma.usuarioEstado.upsert({
    where: { nombre: 'Activo' },
    update: {},
    create: {
      nombre: 'Activo',
      descripcion: 'Usuario activo en el sistema'
    }
  });

  const estadoInactivo = await prisma.usuarioEstado.upsert({
    where: { nombre: 'Inactivo' },
    update: {},
    create: {
      nombre: 'Inactivo',
      descripcion: 'Usuario inactivo'
    }
  });

  // 2. Tipos de Usuario (14 roles - Réplica de SIAONDA V1)
  console.log('👥 Creando tipos de usuario...');
  const roles = [
    { nombre: 'SUPERUSUARIO', descripcion: 'Acceso total al sistema' },
    { nombre: 'ADMINISTRADOR', descripcion: 'Gestión completa del sistema' },
    { nombre: 'SUPERVISOR', descripcion: 'Supervisión de operaciones' },
    { nombre: 'COORDINADOR', descripcion: 'Coordinación de áreas' },
    { nombre: 'CAJERO', descripcion: 'Manejo de cajas, pagos y facturación' },
    { nombre: 'REGISTRADOR', descripcion: 'Registro de obras y certificados' },
    { nombre: 'CERTIFICADOR', descripcion: 'Emisión de certificados' },
    { nombre: 'DIGITADOR', descripcion: 'Ingreso y digitalización de datos' },
    { nombre: 'FACTURADOR', descripcion: 'Generación de facturas' },
    { nombre: 'ATENCION_USUARIO', descripcion: 'Atención al público y servicio al cliente' },
    { nombre: 'RECEPCION', descripcion: 'Recepción de documentos y clientes' },
    { nombre: 'REGIONAL', descripcion: 'Gestión de sucursales regionales' },
    { nombre: 'CONTABLE', descripcion: 'Revisión contable y reportes financieros' },
    { nombre: 'INSPECTORIA', descripcion: 'Inspección y auditoría' }
  ];

  const tiposUsuario = [];
  for (const rol of roles) {
    const tipo = await prisma.usuarioTipo.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol
    });
    tiposUsuario.push(tipo);
  }

  // 3. Usuario Administrador
  console.log('🔐 Creando usuario administrador...');
  const tipoAdmin = tiposUsuario.find(t => t.nombre === 'ADMINISTRADOR')!;
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: {
      nombre: 'admin',
      contrasena: passwordHash,
      codigo: 'ADM001',
      nombrecompleto: 'Administrador del Sistema',
      correo: 'admin@onda.gob.do',
      tipoId: tipoAdmin.id,
      estadoId: estadoActivo.id
    }
  });

  // 4. Estados de Formulario
  console.log('📋 Creando estados de formulario...');
  const estadosFormulario = [
    { nombre: 'PENDIENTE', descripcion: 'Formulario pendiente' },
    { nombre: 'Pendiente', descripcion: 'Formulario pendiente de pago' },
    { nombre: 'PENDIENTE_PAGO', descripcion: 'Formulario pendiente de pago' },
    { nombre: 'Pagado', descripcion: 'Formulario pagado' },
    { nombre: 'PAGADO', descripcion: 'Formulario pagado' },
    { nombre: 'Asentado', descripcion: 'Formulario asentado' },
    { nombre: 'ASENTADO', descripcion: 'Formulario asentado en registro' },
    { nombre: 'Certificado', descripcion: 'Certificado generado' },
    { nombre: 'CERTIFICADO', descripcion: 'Certificado generado' },
    { nombre: 'Entregado', descripcion: 'Certificado entregado' },
    { nombre: 'ENTREGADO', descripcion: 'Certificado entregado al cliente' },
    { nombre: 'DEVUELTO', descripcion: 'Formulario devuelto para correcciones' },
    { nombre: 'DEVUELTO_AAU', descripcion: 'Devuelto a AAU' },
    { nombre: 'EN_REVISION', descripcion: 'En revisión' },
    { nombre: 'EN_REVISION_REGISTRO', descripcion: 'En revisión de registro' },
    { nombre: 'LISTO_PARA_ENTREGA', descripcion: 'Listo para entrega' }
  ];

  for (const estado of estadosFormulario) {
    await prisma.formularioEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 5. Estados de Certificado
  console.log('📜 Creando estados de certificado...');
  const estadosCertificado = [
    { nombre: 'Pendiente', descripcion: 'Certificado pendiente de generación' },
    { nombre: 'Generado', descripcion: 'Certificado generado' },
    { nombre: 'Entregado', descripcion: 'Certificado entregado al cliente' }
  ];

  for (const estado of estadosCertificado) {
    await prisma.certificadoEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 6. Métodos de Pago
  console.log('💳 Creando métodos de pago...');
  const metodosPago = [
    { nombre: 'Efectivo', descripcion: 'Dinero en efectivo', requiereReferencia: false },
    { nombre: 'Cheque', descripcion: 'Cheque bancario', requiereReferencia: true },
    { nombre: 'Transferencia', descripcion: 'Transferencia bancaria', requiereReferencia: true },
    { nombre: 'Tarjeta', descripcion: 'Tarjeta de crédito o débito', requiereReferencia: true }
  ];

  for (const metodo of metodosPago) {
    await prisma.metodoPago.upsert({
      where: { nombre: metodo.nombre },
      update: {},
      create: metodo
    });
  }

  // 7. Estados de Factura (según SIAONDA V1)
  console.log('💰 Creando estados de factura...');
  const estadosFactura = [
    { nombre: 'Abierta', descripcion: 'Factura generada, pendiente de pago' },
    { nombre: 'Cerrada', descripcion: 'Factura cerrada (no usada actualmente)' },
    { nombre: 'Anulada', descripcion: 'Factura anulada' },
    { nombre: 'Pagada', descripcion: 'Factura pagada completamente' }
  ];

  for (const estado of estadosFactura) {
    await prisma.facturaEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 7. Estados de Caja
  console.log('🏦 Creando estados de caja...');
  const estadosCaja = [
    { nombre: 'Abierta', descripcion: 'Caja abierta y operativa' },
    { nombre: 'Cerrada', descripcion: 'Caja cerrada' },
    { nombre: 'En Proceso', descripcion: 'Caja en proceso de cierre' }
  ];

  for (const estado of estadosCaja) {
    await prisma.cajaEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 8. Estados de Cierre
  console.log('📊 Creando estados de cierre...');
  const estadosCierre = [
    { nombre: 'Abierto', descripcion: 'Cierre abierto (caja activa)' },
    { nombre: 'Cerrado', descripcion: 'Cierre cerrado' }
  ];

  for (const estado of estadosCierre) {
    await prisma.cierreEstado.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 9. Estados de Producto
  console.log('📦 Creando estados de producto...');
  const estadoProductoActivo = await prisma.productoEstado.upsert({
    where: { nombre: 'Activo' },
    update: {},
    create: {
      nombre: 'Activo',
      descripcion: 'Producto activo y disponible'
    }
  });

  // 10. Tipos de Campos de Formulario
  console.log('🔤 Creando tipos de campos...');
  const tiposCampo = [
    { nombre: 'texto', descripcion: 'Campo de texto libre' },
    { nombre: 'numerico', descripcion: 'Campo numérico' },
    { nombre: 'listado', descripcion: 'Lista desplegable' },
    { nombre: 'fecha', descripcion: 'Selector de fecha' },
    { nombre: 'archivo', descripcion: 'Subida de archivo' },
    { nombre: 'checkbox', descripcion: 'Casilla de verificación' },
    { nombre: 'divisor', descripcion: 'Divisor visual' }
  ];

  for (const tipo of tiposCampo) {
    await prisma.formularioCampoTipo.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo
    });
  }

  // 11. Productos Oficiales ONDA (Según Resolución 013-2023)
  console.log('🎨 Creando productos oficiales ONDA...');
  const productos = [
    // OBRAS MUSICALES Y AFINES
    { codigo: 'MUS-01', nombre: 'Obras Musicales, con letra o sin ella', categoria: 'Musical', precio: 500.00 },
    { codigo: 'MUS-02', nombre: 'Arreglo Musical', categoria: 'Musical', precio: 500.00 },
    { codigo: 'MUS-03', nombre: 'Fonograma', categoria: 'Musical', precio: 1500.00 },
    { codigo: 'MUS-04', nombre: 'Interpretaciones o Ejecuciones Musicales', categoria: 'Musical', precio: 500.00 },
    { codigo: 'MUS-05', nombre: 'Emisiones de Radiodifusión', categoria: 'Musical', precio: 500.00 },

    // OBRAS AUDIOVISUALES
    { codigo: 'AUD-01', nombre: 'Obra Cinematográfica (largo metraje)', categoria: 'Audiovisual', precio: 7000.00 },
    { codigo: 'AUD-02', nombre: 'Obra Cinematográfica (corto metraje)', categoria: 'Audiovisual', precio: 5000.00 },
    { codigo: 'AUD-03', nombre: 'Documental (corto metraje)', categoria: 'Audiovisual', precio: 3000.00 },
    { codigo: 'AUD-04', nombre: 'Documental (largo metraje), Temporada de Serie o Telenovela completa', categoria: 'Audiovisual', precio: 4000.00 },
    { codigo: 'AUD-05', nombre: 'Capítulo de Serie, Videoclip, Jingle, Promoción', categoria: 'Audiovisual', precio: 2000.00 },

    // OBRAS ESCÉNICAS
    { codigo: 'ESC-01', nombre: 'Obra de Teatro', categoria: 'Escénica', precio: 1500.00 },
    { codigo: 'ESC-02', nombre: 'Obra de Teatro Musical', categoria: 'Escénica', precio: 3000.00 },
    { codigo: 'ESC-03', nombre: 'Concierto y/o Espectáculo', categoria: 'Escénica', precio: 1500.00 },
    { codigo: 'ESC-04', nombre: 'Escenografía', categoria: 'Escénica', precio: 1500.00 },
    { codigo: 'ESC-05', nombre: 'Obra coreográfica', categoria: 'Escénica', precio: 1000.00 },
    { codigo: 'ESC-06', nombre: 'Monólogo', categoria: 'Escénica', precio: 1000.00 },
    { codigo: 'ESC-07', nombre: 'Pantomima', categoria: 'Escénica', precio: 1000.00 },

    // OBRAS DE ARTES VISUALES
    { codigo: 'AP-01', nombre: 'Dibujo', categoria: 'Artes Visuales', precio: 1000.00 },
    { codigo: 'AP-02', nombre: 'Fotografía', categoria: 'Artes Visuales', precio: 1000.00 },
    { codigo: 'AP-03', nombre: 'Pintura', categoria: 'Artes Visuales', precio: 1000.00 },
    { codigo: 'AP-04', nombre: 'Escultura', categoria: 'Artes Visuales', precio: 1000.00 },
    { codigo: 'AP-05', nombre: 'Grabado', categoria: 'Artes Visuales', precio: 500.00 },

    // OBRAS DE ARTE APLICADO
    { codigo: 'AA-01', nombre: 'Diseño del espacio (Arquitectura de interiores, paisajismo)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-02', nombre: 'Diseño textil (Ropa, vestuarios, accesorios)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-03', nombre: 'Diseño de productos (Mobiliarios y objetos industriales)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-04', nombre: 'Diseño de comunicación (Gráfico, publicidad, multimedia)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-05', nombre: 'Artesanía artística (Cerámica, vitrales)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-06', nombre: 'Artesanía artística (Joyería)', categoria: 'Arte Aplicado', precio: 1000.00 },
    { codigo: 'AA-07', nombre: 'Juego de azar', categoria: 'Arte Aplicado', precio: 5000.00 },
    { codigo: 'AA-08', nombre: 'Otros juegos', categoria: 'Arte Aplicado', precio: 3000.00 },

    // OBRAS LITERARIAS (Selección de las más comunes)
    { codigo: 'LIT-01', nombre: 'Letra para una obra musical', categoria: 'Literaria', precio: 500.00 },
    { codigo: 'LIT-02', nombre: 'Poema', categoria: 'Literaria', precio: 500.00 },
    { codigo: 'LIT-03', nombre: 'Libro', categoria: 'Literaria', precio: 3000.00 },
    { codigo: 'LIT-04', nombre: 'Libro electrónico', categoria: 'Literaria', precio: 3000.00 },
    { codigo: 'LIT-09', nombre: 'Guión Cinematográfico y Documental (largo metraje)', categoria: 'Literaria', precio: 5000.00 },
    { codigo: 'LIT-14', nombre: 'Guión para Obra de Teatro', categoria: 'Literaria', precio: 1500.00 },
    { codigo: 'LIT-15', nombre: 'Personaje', categoria: 'Literaria', precio: 2000.00 },
    { codigo: 'LIT-17', nombre: 'Tesis, Monográfico o Anteproyecto', categoria: 'Literaria', precio: 1000.00 },

    // OBRAS CIENTÍFICAS
    { codigo: 'OC-01', nombre: 'Plano o Proyecto Arquitectónico', categoria: 'Científica', precio: 10000.00 },
    { codigo: 'OC-03', nombre: 'Obra o Proyecto de Ingeniería', categoria: 'Científica', precio: 5000.00 },
    { codigo: 'OC-06', nombre: 'Programa Computadora', categoria: 'Científica', precio: 10000.00 },
    { codigo: 'OC-07', nombre: 'Página Web/Multimedia', categoria: 'Científica', precio: 3000.00 },

    // SERVICIOS DE INSPECTORÍA
    { codigo: 'IRC-01', nombre: 'Solicitud de Registro IRC (Inspectoría)', categoria: 'Inspectoría', precio: 5000.00 }
  ];

  for (const prod of productos) {
    const producto = await prisma.producto.upsert({
      where: { codigo: prod.codigo },
      update: {},
      create: {
        codigo: prod.codigo,
        nombre: prod.nombre,
        categoria: prod.categoria,
        descripcion: `Registro de ${prod.nombre}`,
        estadoId: estadoProductoActivo.id
      }
    });

    // Crear costo para cada producto (solo si no existe)
    const costoExistente = await prisma.productoCosto.findFirst({
      where: {
        productoId: producto.id,
        cantidadMin: 1
      }
    });

    if (!costoExistente) {
      await prisma.productoCosto.create({
        data: {
          productoId: producto.id,
          precio: prod.precio,
          cantidadMin: 1,
          fechaInicio: new Date()
        }
      });
    }
  }

  // 12. Tipos de Cliente
  console.log('👤 Creando tipos de cliente...');
  const tiposCliente = [
    { nombre: 'Autor', descripcion: 'Autor de obra' },
    { nombre: 'Arreglista', descripcion: 'Arreglista musical' },
    { nombre: 'Autor Original', descripcion: 'Autor original de la obra' },
    { nombre: 'Autor Principal', descripcion: 'Autor principal de la obra' },
    { nombre: 'Coautor', descripcion: 'Coautor de obra' },
    { nombre: 'Compositor', descripcion: 'Compositor musical' },
    { nombre: 'Director', descripcion: 'Director de la obra' },
    { nombre: 'Divulgador', descripcion: 'Divulgador de la obra' },
    { nombre: 'Editor', descripcion: 'Editor de obras' },
    { nombre: 'Guionista', descripcion: 'Guionista' },
    { nombre: 'Impresor', descripcion: 'Impresor de la obra' },
    { nombre: 'Intérprete', descripcion: 'Intérprete o ejecutante' },
    { nombre: 'Productor', descripcion: 'Productor' },
    { nombre: 'Representante', descripcion: 'Representante legal' },
    { nombre: 'Solicitante', descripcion: 'Solicitante general' },
    { nombre: 'Titular', descripcion: 'Titular de derechos' },
    { nombre: 'Visitante', descripcion: 'Visitante' }
  ];

  for (const tipo of tiposCliente) {
    await prisma.clienteTipo.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo
    });
  }

  // 13. Nacionalidades
  console.log('🌎 Creando nacionalidades...');
  const nacionalidades = [
    { nombre: 'Dominicana', codigo: 'DO' },
    { nombre: 'Estadounidense', codigo: 'US' },
    { nombre: 'Española', codigo: 'ES' },
    { nombre: 'Mexicana', codigo: 'MX' },
    { nombre: 'Otra', codigo: null }
  ];

  for (const nac of nacionalidades) {
    await prisma.clienteNacionalidad.upsert({
      where: { nombre: nac.nombre },
      update: {},
      create: nac
    });
  }

  // 14. Estados de Solicitud de Inspección
  console.log('📋 Creando estados de solicitud de inspección...');
  const estadosSolicitudInspeccion = [
    { nombre: 'PENDIENTE', descripcion: 'Solicitud recibida, pendiente de validación', orden: 1 },
    { nombre: 'VALIDADA', descripcion: 'Solicitud validada por inspector', orden: 2 },
    { nombre: 'PAGADA', descripcion: 'Solicitud pagada, pendiente de asentamiento', orden: 3 },
    { nombre: 'ASENTADA', descripcion: 'Solicitud asentada en registro', orden: 4 },
    { nombre: 'PENDIENTE_FIRMA', descripcion: 'Pendiente de firma de certificado', orden: 5 },
    { nombre: 'LISTA_ENTREGA', descripcion: 'Lista para ser entregada', orden: 6 },
    { nombre: 'ENTREGADA', descripcion: 'Certificado entregado al cliente', orden: 7 },
    { nombre: 'RECHAZADA', descripcion: 'Solicitud rechazada', orden: 99 }
  ];

  for (const estado of estadosSolicitudInspeccion) {
    await prisma.estadoSolicitudInspeccion.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 15. Status de Inspección (para empresas)
  console.log('🔍 Creando status de inspección...');
  const statusInspeccion = [
    { nombre: 'ACTIVA', descripcion: 'Empresa activa y registrada' },
    { nombre: 'VISITADA', descripcion: 'Empresa visitada por inspector' },
    { nombre: 'NO NOTIFICADA', descripcion: 'Empresa no notificada' },
    { nombre: 'NOTIFICACION', descripcion: 'Empresa en proceso de notificación' },
    { nombre: 'INTIMADA', descripcion: 'Empresa intimada' },
    { nombre: 'INACTIVA', descripcion: 'Empresa inactiva' }
  ];

  for (const status of statusInspeccion) {
    await prisma.statusInspeccion.upsert({
      where: { nombre: status.nombre },
      update: {},
      create: status
    });
  }

  // 16. Estados Jurídicos
  console.log('⚖️ Creando estados jurídicos...');
  const estadosJuridicos = [
    { nombre: 'STATUS OK', descripcion: 'Sin problemas jurídicos' },
    { nombre: 'INTIMADA POR DEP. LEGAL', descripcion: 'Intimada por departamento legal' },
    { nombre: 'REMITIDA DEP. JURIDICO', descripcion: 'Remitida a departamento jurídico' },
    { nombre: 'EN PROCESO LEGAL', descripcion: 'En proceso legal' },
    { nombre: 'SIN ESTADO JURIDICO', descripcion: 'Sin estado jurídico asignado' }
  ];

  for (const estado of estadosJuridicos) {
    await prisma.estadoJuridico.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado
    });
  }

  // 17. Conclusiones
  console.log('📝 Creando conclusiones...');
  const conclusiones = [
    { nombre: 'VIGENTE', descripcion: 'Empresa vigente' },
    { nombre: 'PENDIENTE', descripcion: 'Pendiente de revisión' },
    { nombre: 'INACTIVA', descripcion: 'Empresa inactiva' },
    { nombre: 'TRABAJADA', descripcion: 'Caso trabajado' },
    { nombre: 'NO CALIFICA', descripcion: 'No califica para inspección' },
    { nombre: 'SIN CONCLUSION', descripcion: 'Sin conclusión asignada' }
  ];

  for (const conclusion of conclusiones) {
    await prisma.conclusion.upsert({
      where: { nombre: conclusion.nombre },
      update: {},
      create: conclusion
    });
  }

  // 18. Status Externos
  console.log('📊 Creando status externos...');
  const statusExternos = [
    { nombre: 'AL DIA', descripcion: 'Al día con responsabilidades' },
    { nombre: 'ATRASO EN RESPONSABILIDADES', descripcion: 'Atraso en responsabilidades' },
    { nombre: 'EN PROCESO LEGAL', descripcion: 'En proceso legal' },
    { nombre: 'SIN STATUS EXTERNO', descripcion: 'Sin status externo asignado' }
  ];

  for (const status of statusExternos) {
    await prisma.statusExterno.upsert({
      where: { nombre: status.nombre },
      update: {},
      create: status
    });
  }

  // 19. Obtener tipos de campo creados
  console.log('📋 Obteniendo tipos de campo...');
  const tipoTexto = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'texto' } });
  const tipoNumerico = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'numerico' } });
  const tipoFecha = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'fecha' } });
  const tipoCheckbox = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'checkbox' } });
  const tipoArchivo = await prisma.formularioCampoTipo.findUnique({ where: { nombre: 'archivo' } });

  const tiposCampoCreados = {
    'texto': tipoTexto,
    'numerico': tipoNumerico,
    'fecha': tipoFecha,
    'checkbox': tipoCheckbox,
    'archivo': tipoArchivo
  };

  // 15. Obtener productos creados
  const productosCreados = await prisma.producto.findMany();

  // 16. Campos Dinámicos para Productos - CARGANDO DESDE EXPORTACIÓN DE BD LOCAL CORRECTA
  console.log('✏️  Creando campos dinámicos desde exportación de BD local (981 campos)...');

  // Verificar si ya existen campos
  const camposExistentes = await prisma.formularioCampo.count();

  if (camposExistentes === 0) {
    // Cargar campos desde JSON exportado de la BD local correcta
    const camposJsonPath = path.join(__dirname, 'seed-campos-correctos.json');
    const camposExportados = JSON.parse(fs.readFileSync(camposJsonPath, 'utf8'));

    // Crear mapas de productos y tipos para mapear IDs
    const productoMap = new Map(productosCreados.map(p => [p.codigo, p.id]));
    const tiposCampo = await prisma.formularioCampoTipo.findMany({ select: { id: true, nombre: true } });
    const tipoMap = new Map(tiposCampo.map(t => [t.nombre, t.id]));

    // Mapear campos exportados a formato de seed
    const camposData = camposExportados.map((campo: any) => ({
      productoId: campo.producto ? productoMap.get(campo.producto.codigo) : null,
      tipoId: tipoMap.get(campo.tipo.nombre),
      campo: campo.campo,
      titulo: campo.titulo,
      descripcion: campo.descripcion || undefined,
      placeholder: campo.placeholder || undefined,
      opciones: campo.opciones || undefined,
      requerido: campo.requerido,
      orden: campo.orden,
      activo: campo.activo,
      grupo: campo.grupo || undefined
    }));

    console.log(`   📦 Cargados ${camposData.length} campos desde exportación local`);
    console.log(`   🤖 Incluyendo ${camposData.filter((c: any) => c.campo === 'uso_ia').length} campos de IA (checkbox)`);

    // Insertar todos los campos
    await prisma.formularioCampo.createMany({
      data: camposData,
      skipDuplicates: true
    });

    console.log(`   ✅ ${camposData.length} campos dinámicos insertados correctamente`);
  } else {
    console.log('   ⏭️  Campos dinámicos ya existen, saltando...');
  }

  console.log('✅ Seeds completados exitosamente!');
  console.log('\n📌 Usuario administrador creado:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('\n📦 Productos creados:', productosCreados.length);
  console.log('\n⚠️  IMPORTANTE: Cambia la contraseña en producción!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seeds:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
