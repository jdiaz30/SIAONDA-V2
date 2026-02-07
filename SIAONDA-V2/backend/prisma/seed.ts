import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
    { nombre: 'Pendiente', descripcion: 'Formulario pendiente de pago' },
    { nombre: 'Pagado', descripcion: 'Formulario pagado, pendiente de asentamiento' },
    { nombre: 'Asentado', descripcion: 'Formulario asentado en registro' },
    { nombre: 'Certificado', descripcion: 'Certificado generado' },
    { nombre: 'Entregado', descripcion: 'Certificado entregado al cliente' }
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
    { nombre: 'Compositor', descripcion: 'Compositor musical' },
    { nombre: 'Intérprete', descripcion: 'Intérprete o ejecutante' },
    { nombre: 'Editor', descripcion: 'Editor de obras' },
    { nombre: 'Productor', descripcion: 'Productor' },
    { nombre: 'Solicitante', descripcion: 'Solicitante general' }
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

  // 16. Campos Dinámicos para Productos - REPLICANDO EXACTAMENTE SIAONDA V1
  console.log('✏️  Creando campos dinámicos basados en SIAONDA V1...');

  // Verificar si ya existen campos
  const camposExistentes = await prisma.formularioCampo.count();

  if (camposExistentes === 0 && tipoTexto && tipoNumerico && tipoFecha && tipoCheckbox && tipoArchivo) {
    const todosCampos: any[] = [];

    // ============================================================================
    // CAMPOS GLOBALES - De obra_generales.php de SIAONDA V1
    // Aplican a TODOS los productos
    // ============================================================================
    todosCampos.push(
      { productoId: null, campo: 'editor_divulgador', titulo: 'Nombre editor o divulgador (si es obra anónima)', tipoId: tipoTexto.id, requerido: false, orden: 1, activo: true },
      { productoId: null, campo: 'titulo_obra', titulo: 'Título de la obra', tipoId: tipoTexto.id, requerido: true, orden: 2, activo: true },
      { productoId: null, campo: 'obra_inedita', titulo: 'Obra Inédita', tipoId: tipoCheckbox.id, requerido: false, orden: 3, activo: true },
      { productoId: null, campo: 'obra_publica', titulo: 'Obra Pública', tipoId: tipoCheckbox.id, requerido: false, orden: 4, activo: true },
      { productoId: null, campo: 'fecha_1ra_publicacion', titulo: 'Fecha 1ra publicación', tipoId: tipoFecha.id, requerido: false, orden: 5, activo: true },
      { productoId: null, campo: 'obra_originaria', titulo: 'Obra Originaria', tipoId: tipoCheckbox.id, requerido: false, orden: 6, activo: true },
      { productoId: null, campo: 'obra_derivada', titulo: 'Obra derivada', tipoId: tipoCheckbox.id, requerido: false, orden: 7, activo: true },
      { productoId: null, campo: 'obra_individual', titulo: 'Obra individual', tipoId: tipoCheckbox.id, requerido: false, orden: 8, activo: true },
      { productoId: null, campo: 'obra_colectiva', titulo: 'Obra colectiva', tipoId: tipoCheckbox.id, requerido: false, orden: 9, activo: true },
      { productoId: null, campo: 'obra_colaboracion', titulo: 'Obra colaboración', tipoId: tipoCheckbox.id, requerido: false, orden: 10, activo: true },
      { productoId: null, campo: 'otro_dato', titulo: 'Cualquier otro dato para su identificación', tipoId: tipoTexto.id, requerido: false, orden: 11, activo: true },
      { productoId: null, campo: 'pais_origen', titulo: 'País de origen obra', tipoId: tipoTexto.id, requerido: false, orden: 12, activo: true },
      { productoId: null, campo: 'ano_realizacion', titulo: 'Año de su realización', tipoId: tipoNumerico.id, requerido: false, orden: 13, activo: true },
      { productoId: null, campo: 'ano_1ra_publicacion', titulo: '1ra publicación: (si es el caso)', tipoId: tipoNumerico.id, requerido: false, orden: 14, activo: true },
      { productoId: null, campo: 'titulo_original', titulo: 'Título de la obra en su idioma original: (En caso de que sea una traducción al castellano)', tipoId: tipoTexto.id, requerido: false, orden: 15, activo: true },
      { productoId: null, campo: 'descripcion', titulo: 'Breve Descripción de la obra: (naturaleza y características)', tipoId: tipoTexto.id, requerido: false, orden: 16, activo: true }
    );

    // ============================================================================
    // CAMPOS ESPECÍFICOS POR TIPO DE PRODUCTO (SIAONDA V1)
    // ============================================================================

    // ============================================================================
    // OBRAS PLÁSTICAS/ARTES VISUALES - De obra_plastica.php de SIAONDA V1
    // AP-01: Dibujo, AP-02: Fotografía, AP-03: Pintura, AP-04: Escultura, AP-05: Grabado
    // ============================================================================
    const productosPlasticos = ['AP-01', 'AP-02', 'AP-03', 'AP-04', 'AP-05'];
    for (const codigo of productosPlasticos) {
      const producto = productosCreados.find(p => p.codigo === codigo);
      if (producto) {
        todosCampos.push(
          { productoId: producto.id, campo: 'descripcion_obra', titulo: 'Descripción de la obra', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true },
          { productoId: producto.id, campo: 'ubicacion_obra', titulo: 'Ubicación de la obra', tipoId: tipoTexto.id, requerido: false, orden: 21, activo: true },
          { productoId: producto.id, campo: 'datos_publicacion_exhibicion', titulo: 'Datos de su publicación, exhibición o ubicación', tipoId: tipoTexto.id, requerido: false, orden: 22, activo: true }
        );
      }
    }

    // ============================================================================
    // OBRAS AUDIOVISUALES - De obra_audiovisual.php de SIAONDA V1
    // AUD-01: Cinematográfica largo, AUD-02: Cinematográfica corto,
    // AUD-03: Documental corto, AUD-04: Documental largo/Serie, AUD-05: Capítulo/Videoclip
    // ============================================================================
    const productosAudiovisuales = ['AUD-01', 'AUD-02', 'AUD-03', 'AUD-04', 'AUD-05'];
    for (const codigo of productosAudiovisuales) {
      const producto = productosCreados.find(p => p.codigo === codigo);
      if (producto) {
        todosCampos.push(
          { productoId: producto.id, campo: 'autor_coautores', titulo: 'Nombre autor o coautores de la obra', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true },
          { productoId: producto.id, campo: 'domicilio_autor', titulo: 'Domicilio del autor o coautores', tipoId: tipoTexto.id, requerido: false, orden: 21, activo: true },
          { productoId: producto.id, campo: 'nombre_domicilio_productor', titulo: 'Nombre y Domicilio del Productor', tipoId: tipoTexto.id, requerido: false, orden: 22, activo: true },
          { productoId: producto.id, campo: 'interpretes_principales', titulo: 'Nombre de los intérpretes principales', tipoId: tipoTexto.id, requerido: false, orden: 23, activo: true },
          { productoId: producto.id, campo: 'otros_elementos_ficha_tecnica', titulo: 'Otros elementos de la ficha técnica', tipoId: tipoTexto.id, requerido: false, orden: 24, activo: true },
          { productoId: producto.id, campo: 'pais_origen_publicacion', titulo: 'País de origen de la primera publicación', tipoId: tipoTexto.id, requerido: false, orden: 25, activo: true },
          { productoId: producto.id, campo: 'ano', titulo: 'Año', tipoId: tipoNumerico.id, requerido: false, orden: 26, activo: true },
          { productoId: producto.id, campo: 'breve_descripcion_argumento', titulo: 'Breve descripción del argumento', tipoId: tipoTexto.id, requerido: false, orden: 27, activo: true }
        );
      }
    }

    // ============================================================================
    // OBRAS FONOGRÁFICAS - De obra_fonografica.php de SIAONDA V1
    // MUS-03: Fonograma
    // ============================================================================
    const productoMUS03 = productosCreados.find(p => p.codigo === 'MUS-03');
    if (productoMUS03) {
      todosCampos.push(
        { productoId: productoMUS03.id, campo: 'titulo_produccion', titulo: 'Título de la producción en su idioma original y de su traducción al castellano', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true },
        { productoId: productoMUS03.id, campo: 'nombre_domicilio_productor', titulo: 'Nombre y domicilio del productor', tipoId: tipoTexto.id, requerido: true, orden: 21, activo: true },
        { productoId: productoMUS03.id, campo: 'ano_fijacion', titulo: 'Año de la fijación', tipoId: tipoNumerico.id, requerido: false, orden: 22, activo: true },
        { productoId: productoMUS03.id, campo: 'ano_1ra_publicacion_fono', titulo: 'Año de la 1ra publicación', tipoId: tipoNumerico.id, requerido: false, orden: 23, activo: true },
        { productoId: productoMUS03.id, campo: 'titulos_obras_contenidas', titulo: 'Títulos de las obras contenidas en la producción y nombre de sus autores', tipoId: tipoTexto.id, requerido: false, orden: 24, activo: true },
        { productoId: productoMUS03.id, campo: 'artistas_interpretes_ejecutantes', titulo: 'Nombre de los artistas, intérpretes o ejecutantes', tipoId: tipoTexto.id, requerido: false, orden: 25, activo: true }
      );
    }

    // ============================================================================
    // LETRA DE CANCIÓN - De formulario_letracacion.php de SIAONDA V1
    // MUS-01: Obras Musicales con letra o sin ella / LIT-01: Letra para obra musical
    // ============================================================================
    const productosLetraCancion = ['MUS-01', 'LIT-01'];
    for (const codigo of productosLetraCancion) {
      const producto = productosCreados.find(p => p.codigo === codigo);
      if (producto) {
        todosCampos.push(
          { productoId: producto.id, campo: 'letra_titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true },
          { productoId: producto.id, campo: 'letra_traducciontitulo', titulo: 'Traducción Título', tipoId: tipoTexto.id, requerido: false, orden: 21, activo: true },
          { productoId: producto.id, campo: 'letra_tituloorig', titulo: 'Título Original (si la obra es derivada)', tipoId: tipoTexto.id, requerido: false, orden: 22, activo: true },
          { productoId: producto.id, campo: 'letra_descripcion', titulo: 'Breve Descripción', tipoId: tipoTexto.id, requerido: false, orden: 23, activo: true },
          { productoId: producto.id, campo: 'letra_genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 24, activo: true, descripcion: 'Moderno, Contemporáneo, Prosa, 3-4, Clásico' },
          { productoId: producto.id, campo: 'letra_porigen', titulo: 'País de Origen', tipoId: tipoTexto.id, requerido: false, orden: 25, activo: true },
          { productoId: producto.id, campo: 'letra_anocreacion', titulo: 'Año Creación', tipoId: tipoNumerico.id, requerido: false, orden: 26, activo: true },
          { productoId: producto.id, campo: 'letra_archletra', titulo: 'Archivo Letra de la Canción', tipoId: tipoArchivo.id, requerido: false, orden: 27, activo: true }
        );
      }
    }

    // ============================================================================
    // MELODÍA / ARREGLO MUSICAL - De formulario_melodia.php de SIAONDA V1
    // MUS-02: Arreglo Musical
    // ============================================================================
    const productoMUS02 = productosCreados.find(p => p.codigo === 'MUS-02');
    if (productoMUS02) {
      todosCampos.push(
        { productoId: productoMUS02.id, campo: 'melodia_titulo', titulo: 'Título', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true },
        { productoId: productoMUS02.id, campo: 'melodia_genero', titulo: 'Género', tipoId: tipoTexto.id, requerido: false, orden: 21, activo: true, descripcion: 'Moderno, Contemporáneo, Prosa, 3-4, Clásico' },
        { productoId: productoMUS02.id, campo: 'melodia_ritmo', titulo: 'Ritmo', tipoId: tipoTexto.id, requerido: false, orden: 22, activo: true, descripcion: 'Bachata, Merengue, Rock, Electro Pop, Balada' },
        { productoId: productoMUS02.id, campo: 'melodia_porigen', titulo: 'País de Origen', tipoId: tipoTexto.id, requerido: false, orden: 23, activo: true },
        { productoId: productoMUS02.id, campo: 'melodia_anocreacion', titulo: 'Año Creación', tipoId: tipoNumerico.id, requerido: false, orden: 24, activo: true },
        { productoId: productoMUS02.id, campo: 'melodia_archpartitura', titulo: 'Archivo Partitura de la Canción', tipoId: tipoArchivo.id, requerido: false, orden: 25, activo: true },
        { productoId: productoMUS02.id, campo: 'melodia_archmelodia', titulo: 'Archivo Melodía de la Canción', tipoId: tipoArchivo.id, requerido: false, orden: 26, activo: true }
      );
    }

    // ============================================================================
    // SOLICITUD IRC (INSPECTORÍA) - Registro o Renovación de Empresas
    // IRC-01: Solicitud de Registro IRC
    // ============================================================================
    const productoIRC01 = productosCreados.find(p => p.codigo === 'IRC-01');
    if (productoIRC01) {
      todosCampos.push(
        // Datos básicos de la empresa
        { productoId: productoIRC01.id, campo: 'tipoSolicitud', titulo: 'Tipo de Solicitud', tipoId: tipoTexto.id, requerido: true, orden: 20, activo: true, descripcion: 'REGISTRO_NUEVO o RENOVACION' },
        { productoId: productoIRC01.id, campo: 'nombreEmpresa', titulo: 'Nombre de la Empresa', tipoId: tipoTexto.id, requerido: true, orden: 21, activo: true },
        { productoId: productoIRC01.id, campo: 'nombreComercial', titulo: 'Nombre Comercial', tipoId: tipoTexto.id, requerido: false, orden: 22, activo: true },
        { productoId: productoIRC01.id, campo: 'rnc', titulo: 'RNC de la Empresa', tipoId: tipoTexto.id, requerido: true, orden: 23, activo: true, descripcion: 'Formato: XXX-XXXXX-X' },
        { productoId: productoIRC01.id, campo: 'categoriaIrc', titulo: 'Categoría IRC', tipoId: tipoTexto.id, requerido: true, orden: 24, activo: true, descripcion: 'Buscar en catálogo de categorías IRC' },
        { productoId: productoIRC01.id, campo: 'fechaInicioOperaciones', titulo: 'Fecha Inicio Operaciones', tipoId: tipoTexto.id, requerido: false, orden: 25, activo: true },
        { productoId: productoIRC01.id, campo: 'principalesClientes', titulo: 'Principales Clientes', tipoId: tipoTexto.id, requerido: false, orden: 26, activo: true },

        // Ubicación y contacto
        { productoId: productoIRC01.id, campo: 'direccion', titulo: 'Dirección de la Empresa', tipoId: tipoTexto.id, requerido: true, orden: 30, activo: true },
        { productoId: productoIRC01.id, campo: 'provincia', titulo: 'Provincia', tipoId: tipoTexto.id, requerido: false, orden: 31, activo: true },
        { productoId: productoIRC01.id, campo: 'sector', titulo: 'Sector', tipoId: tipoTexto.id, requerido: false, orden: 32, activo: true },
        { productoId: productoIRC01.id, campo: 'telefono', titulo: 'Teléfono', tipoId: tipoTexto.id, requerido: true, orden: 33, activo: true },
        { productoId: productoIRC01.id, campo: 'telefonoSecundario', titulo: 'Teléfono Secundario', tipoId: tipoTexto.id, requerido: false, orden: 34, activo: true },
        { productoId: productoIRC01.id, campo: 'email', titulo: 'Correo Electrónico', tipoId: tipoTexto.id, requerido: false, orden: 35, activo: true },

        // Representante Legal
        { productoId: productoIRC01.id, campo: 'representanteLegal', titulo: 'Representante Legal', tipoId: tipoTexto.id, requerido: true, orden: 40, activo: true },
        { productoId: productoIRC01.id, campo: 'cedulaRepresentante', titulo: 'Cédula del Representante', tipoId: tipoTexto.id, requerido: true, orden: 41, activo: true, descripcion: 'Formato: XXX-XXXXXXX-X' },

        // Tipo de persona
        { productoId: productoIRC01.id, campo: 'tipoPersona', titulo: 'Tipo de Persona', tipoId: tipoTexto.id, requerido: true, orden: 45, activo: true, descripcion: 'MORAL o FISICA' },
        { productoId: productoIRC01.id, campo: 'descripcionActividades', titulo: 'Descripción de Actividades', tipoId: tipoTexto.id, requerido: false, orden: 46, activo: true },

        // Persona FISICA - Propietario
        { productoId: productoIRC01.id, campo: 'nombrePropietario', titulo: 'Nombre del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 50, activo: true },
        { productoId: productoIRC01.id, campo: 'cedulaPropietario', titulo: 'Cédula del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 51, activo: true },
        { productoId: productoIRC01.id, campo: 'domicilioPropietario', titulo: 'Domicilio del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 52, activo: true },
        { productoId: productoIRC01.id, campo: 'telefonoPropietario', titulo: 'Teléfono del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 53, activo: true },
        { productoId: productoIRC01.id, campo: 'celularPropietario', titulo: 'Celular del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 54, activo: true },
        { productoId: productoIRC01.id, campo: 'emailPropietario', titulo: 'Email del Propietario', tipoId: tipoTexto.id, requerido: false, orden: 55, activo: true },

        // Persona FISICA - Administrador
        { productoId: productoIRC01.id, campo: 'nombreAdministrador', titulo: 'Nombre del Administrador', tipoId: tipoTexto.id, requerido: false, orden: 60, activo: true },
        { productoId: productoIRC01.id, campo: 'cedulaAdministrador', titulo: 'Cédula del Administrador', tipoId: tipoTexto.id, requerido: false, orden: 61, activo: true },
        { productoId: productoIRC01.id, campo: 'telefonoAdministrador', titulo: 'Teléfono del Administrador', tipoId: tipoTexto.id, requerido: false, orden: 62, activo: true },
        { productoId: productoIRC01.id, campo: 'fechaInicioActividades', titulo: 'Fecha Inicio Actividades', tipoId: tipoTexto.id, requerido: false, orden: 63, activo: true },

        // Persona MORAL - Presidente
        { productoId: productoIRC01.id, campo: 'presidenteNombre', titulo: 'Nombre del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 70, activo: true },
        { productoId: productoIRC01.id, campo: 'presidenteCedula', titulo: 'Cédula del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 71, activo: true },
        { productoId: productoIRC01.id, campo: 'presidenteDomicilio', titulo: 'Domicilio del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 72, activo: true },
        { productoId: productoIRC01.id, campo: 'presidenteTelefono', titulo: 'Teléfono del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 73, activo: true },
        { productoId: productoIRC01.id, campo: 'presidenteCelular', titulo: 'Celular del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 74, activo: true },
        { productoId: productoIRC01.id, campo: 'presidenteEmail', titulo: 'Email del Presidente', tipoId: tipoTexto.id, requerido: false, orden: 75, activo: true },

        // Persona MORAL - Otros miembros del Consejo
        { productoId: productoIRC01.id, campo: 'vicepresidente', titulo: 'Vicepresidente', tipoId: tipoTexto.id, requerido: false, orden: 80, activo: true },
        { productoId: productoIRC01.id, campo: 'secretario', titulo: 'Secretario', tipoId: tipoTexto.id, requerido: false, orden: 81, activo: true },
        { productoId: productoIRC01.id, campo: 'tesorero', titulo: 'Tesorero', tipoId: tipoTexto.id, requerido: false, orden: 82, activo: true },
        { productoId: productoIRC01.id, campo: 'administrador', titulo: 'Administrador', tipoId: tipoTexto.id, requerido: false, orden: 83, activo: true },
        { productoId: productoIRC01.id, campo: 'domicilioConsejo', titulo: 'Domicilio del Consejo', tipoId: tipoTexto.id, requerido: false, orden: 84, activo: true },
        { productoId: productoIRC01.id, campo: 'telefonoConsejo', titulo: 'Teléfono del Consejo', tipoId: tipoTexto.id, requerido: false, orden: 85, activo: true },
        { productoId: productoIRC01.id, campo: 'fechaConstitucion', titulo: 'Fecha Constitución', tipoId: tipoTexto.id, requerido: false, orden: 86, activo: true },

        // Documentos
        { productoId: productoIRC01.id, campo: 'documentosAdjuntos', titulo: 'Documentos Adjuntos', tipoId: tipoArchivo.id, requerido: false, orden: 90, activo: true, descripcion: 'RNC, Registro Mercantil, Cédula Representante' }
      );
    }

    // ============================================================================
    // NOTA: Los demás productos (LIT-02, LIT-03, LIT-04, ESC-*, AA-*, OC-*) solo usan
    // los campos globales de obra_generales.php ya que no tienen archivos específicos en SIAONDA V1
    // ============================================================================

    await prisma.formularioCampo.createMany({
      data: todosCampos,
      skipDuplicates: true
    });

    console.log(`✅ Creados ${todosCampos.length} campos dinámicos para TODOS los tipos de obras`);
  } else {
    console.log('⏭️  Campos dinámicos ya existen, saltando...');
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
