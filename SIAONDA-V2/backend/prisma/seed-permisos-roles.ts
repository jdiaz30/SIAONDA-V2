import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de los 12 roles del sistema
const ROLES = [
  // Transversales
  { nombre: 'ADMINISTRADOR', descripcion: 'Acceso total al sistema y gestión de usuarios' },
  { nombre: 'DIRECTOR', descripcion: 'Acceso de solo lectura a todos los módulos y reportes' },

  // ATU
  { nombre: 'ENCARGADO_ATU', descripcion: 'Encargado de Atención al Usuario - Acceso total al módulo ATU' },
  { nombre: 'TECNICO_ATU', descripcion: 'Técnico de ATU - Llena formularios y corrige sus propios devueltos' },
  { nombre: 'RECEPCIONISTA', descripcion: 'Recepciona clientes y entrega certificados' },

  // REGISTRO
  { nombre: 'ENCARGADO_REGISTRO', descripcion: 'Encargado de Registro - Único autorizado para firmar certificados' },
  { nombre: 'TECNICO_ASENTAMIENTO', descripcion: 'Técnico de Asentamiento - Fase 1: Asienta obras en el libro' },
  { nombre: 'TECNICO_CERTIFICACION', descripcion: 'Técnico de Certificación - Fase 2: Genera certificados PDF' },

  // CAJAS
  { nombre: 'CAJERO', descripcion: 'Opera caja, registra pagos y genera facturas' },

  // INSPECTORÍA
  { nombre: 'ENCARGADO_INSPECTORIA', descripcion: 'Encargado de Inspectoría - Supervisor con acceso total' },
  { nombre: 'PARALEGAL', descripcion: 'Paralegal - Operativo diario con mismos permisos que Encargado' },

  // JURÍDICO
  { nombre: 'JURIDICO', descripcion: 'Personal jurídico - Gestiona casos legales' }
];

// Definición de TODOS los permisos del sistema (agrupados por módulo)
const PERMISOS = [
  // ============================================
  // MÓDULO: ATU (Atención al Usuario)
  // ============================================
  { codigo: 'atu.dashboard.view', nombre: 'Ver dashboard ATU', modulo: 'ATU', descripcion: 'Ver métricas y estadísticas del módulo ATU' },

  // Formularios
  { codigo: 'atu.formularios.view_all', nombre: 'Ver todos los formularios', modulo: 'ATU', descripcion: 'Ver formularios de todos los técnicos' },
  { codigo: 'atu.formularios.view_own', nombre: 'Ver formularios propios', modulo: 'ATU', descripcion: 'Ver solo sus propios formularios' },
  { codigo: 'atu.formularios.create', nombre: 'Crear formularios', modulo: 'ATU', descripcion: 'Crear nuevos formularios de obras e IRC' },
  { codigo: 'atu.formularios.update', nombre: 'Actualizar formularios', modulo: 'ATU', descripcion: 'Actualizar cualquier formulario' },
  { codigo: 'atu.formularios.update_own_draft', nombre: 'Actualizar formularios propios en borrador', modulo: 'ATU', descripcion: 'Actualizar solo formularios propios en estado borrador' },
  { codigo: 'atu.formularios.delete', nombre: 'Eliminar formularios', modulo: 'ATU', descripcion: 'Eliminar formularios' },
  { codigo: 'atu.formularios.approve', nombre: 'Aprobar formularios', modulo: 'ATU', descripcion: 'Aprobar formularios antes de enviar a Registro/Inspectoría' },
  { codigo: 'atu.formularios.corregir_devueltos_propios', nombre: 'Corregir formularios devueltos propios', modulo: 'ATU', descripcion: 'Corregir sus propios formularios devueltos' },
  { codigo: 'atu.formularios.corregir_devueltos_otros', nombre: 'Corregir formularios devueltos de otros', modulo: 'ATU', descripcion: 'Corregir formularios devueltos de otros técnicos' },
  { codigo: 'atu.formularios.reasignar', nombre: 'Reasignar formularios', modulo: 'ATU', descripcion: 'Reasignar formularios entre técnicos' },

  // Clientes
  { codigo: 'atu.clientes.create', nombre: 'Crear clientes', modulo: 'ATU', descripcion: 'Registrar nuevos clientes' },
  { codigo: 'atu.clientes.update', nombre: 'Actualizar clientes', modulo: 'ATU', descripcion: 'Actualizar datos de clientes' },

  // Certificados y entregas
  { codigo: 'atu.certificados.view', nombre: 'Ver certificados listos', modulo: 'ATU', descripcion: 'Ver certificados listos para entrega' },
  { codigo: 'atu.certificados.entregar', nombre: 'Entregar certificados', modulo: 'ATU', descripcion: 'Marcar certificados como entregados' },

  // Historial
  { codigo: 'atu.historial_formularios.view_all', nombre: 'Ver historial completo de formularios', modulo: 'ATU', descripcion: 'Ver historial de todos los formularios' },
  { codigo: 'atu.historial_formularios.view_own', nombre: 'Ver historial de formularios propios', modulo: 'ATU', descripcion: 'Ver historial de sus propios formularios' },
  { codigo: 'atu.historial_entregas.view_all', nombre: 'Ver historial completo de entregas', modulo: 'ATU', descripcion: 'Ver historial de todas las entregas' },
  { codigo: 'atu.historial_entregas.view_own', nombre: 'Ver historial de entregas propias', modulo: 'ATU', descripcion: 'Ver historial de sus propias entregas' },

  // Denuncias
  { codigo: 'atu.denuncias.create', nombre: 'Crear denuncias', modulo: 'ATU', descripcion: 'Crear nuevas denuncias' },
  { codigo: 'atu.denuncias.update', nombre: 'Actualizar denuncias', modulo: 'ATU', descripcion: 'Actualizar denuncias' },
  { codigo: 'atu.denuncias.view_all', nombre: 'Ver todas las denuncias', modulo: 'ATU', descripcion: 'Ver todas las denuncias del módulo' },

  // Consultas y reportes
  { codigo: 'atu.consultar_estado', nombre: 'Consultar estado de solicitudes', modulo: 'ATU', descripcion: 'Consultar estado de solicitudes (solo lectura)' },
  { codigo: 'atu.reportes.export', nombre: 'Exportar reportes ATU', modulo: 'ATU', descripcion: 'Exportar reportes del módulo ATU' },

  // ============================================
  // MÓDULO: REGISTRO DE OBRAS
  // ============================================
  { codigo: 'registro.dashboard.view', nombre: 'Ver dashboard Registro', modulo: 'REGISTRO', descripcion: 'Ver métricas del módulo Registro' },

  // Obras pendientes y asentamiento (Fase 1)
  { codigo: 'registro.obras_pendientes.view_all', nombre: 'Ver todas las obras pendientes', modulo: 'REGISTRO', descripcion: 'Ver todas las obras pendientes de asentamiento' },
  { codigo: 'registro.obras_pendientes.view', nombre: 'Ver obras pendientes (cola)', modulo: 'REGISTRO', descripcion: 'Ver cola general de obras pendientes' },
  { codigo: 'registro.obras_pendientes.tomar', nombre: 'Tomar obra para asentar', modulo: 'REGISTRO', descripcion: 'Asignarse una obra de la cola para asentar' },
  { codigo: 'registro.asentamiento.view_all', nombre: 'Ver todos los asentamientos', modulo: 'REGISTRO', descripcion: 'Ver todos los asentamientos realizados' },
  { codigo: 'registro.asentamiento.view', nombre: 'Ver asentamientos', modulo: 'REGISTRO', descripcion: 'Ver datos de asentamiento (solo lectura)' },
  { codigo: 'registro.asentamiento.create', nombre: 'Asentar obra', modulo: 'REGISTRO', descripcion: 'Asentar obra en libro (asignar libro, folio, hoja)' },
  { codigo: 'registro.asentamiento.update', nombre: 'Actualizar asentamiento', modulo: 'REGISTRO', descripcion: 'Actualizar datos de asentamiento' },

  // Certificación (Fase 2)
  { codigo: 'registro.obras_certificacion.view', nombre: 'Ver obras pendientes de certificación', modulo: 'REGISTRO', descripcion: 'Ver obras asentadas pendientes de certificación' },
  { codigo: 'registro.obras_certificacion.tomar', nombre: 'Tomar obra para certificar', modulo: 'REGISTRO', descripcion: 'Asignarse una obra para generar certificado' },
  { codigo: 'registro.certificados.view_all', nombre: 'Ver todos los certificados', modulo: 'REGISTRO', descripcion: 'Ver todos los certificados generados' },
  { codigo: 'registro.certificados.generate', nombre: 'Generar certificado', modulo: 'REGISTRO', descripcion: 'Generar certificado PDF' },
  { codigo: 'registro.certificados.firmar', nombre: 'Firmar certificado', modulo: 'REGISTRO', descripcion: 'Firmar certificado (PRIVILEGIO EXCLUSIVO)' },
  { codigo: 'registro.certificados.enviar', nombre: 'Enviar certificado', modulo: 'REGISTRO', descripcion: 'Enviar certificado a ATU para entrega' },

  // Devoluciones y consultas
  { codigo: 'registro.devolver_atu', nombre: 'Devolver a ATU', modulo: 'REGISTRO', descripcion: 'Devolver formulario a ATU para corrección' },
  { codigo: 'registro.historial.view_all', nombre: 'Ver historial completo', modulo: 'REGISTRO', descripcion: 'Ver historial completo de registros' },
  { codigo: 'registro.historial.export', nombre: 'Exportar historial', modulo: 'REGISTRO', descripcion: 'Exportar historial de registros' },
  { codigo: 'registro.consultar_estado', nombre: 'Consultar estado de registros', modulo: 'REGISTRO', descripcion: 'Consultar estado de cualquier registro' },
  { codigo: 'registro.reasignar_obras', nombre: 'Reasignar obras', modulo: 'REGISTRO', descripcion: 'Reasignar obras entre técnicos' },

  // ============================================
  // MÓDULO: CAJAS
  // ============================================
  { codigo: 'cajas.dashboard.view', nombre: 'Ver dashboard Cajas', modulo: 'CAJAS', descripcion: 'Ver métricas del módulo Cajas' },

  // Operaciones de caja
  { codigo: 'cajas.mi_caja.view', nombre: 'Ver mi caja', modulo: 'CAJAS', descripcion: 'Ver estado de mi propia caja' },
  { codigo: 'cajas.mi_caja.abrir', nombre: 'Abrir mi caja', modulo: 'CAJAS', descripcion: 'Abrir mi caja diaria' },
  { codigo: 'cajas.mi_caja.cerrar', nombre: 'Cerrar mi caja', modulo: 'CAJAS', descripcion: 'Cerrar mi caja y realizar arqueo' },
  { codigo: 'cajas.mi_caja.arqueo', nombre: 'Realizar arqueo', modulo: 'CAJAS', descripcion: 'Realizar arqueo de caja' },
  { codigo: 'cajas.mi_caja.historial', nombre: 'Ver historial de mi caja', modulo: 'CAJAS', descripcion: 'Ver historial de operaciones de mi caja' },

  // Cobros y pagos
  { codigo: 'cajas.cobros_pendientes.view', nombre: 'Ver cobros pendientes', modulo: 'CAJAS', descripcion: 'Ver cola de cobros pendientes' },
  { codigo: 'cajas.cobros.registrar_pago', nombre: 'Registrar pago', modulo: 'CAJAS', descripcion: 'Registrar pago de solicitud o denuncia' },

  // Facturas y NCF
  { codigo: 'cajas.facturas.generate', nombre: 'Generar factura', modulo: 'CAJAS', descripcion: 'Generar factura de pago' },
  { codigo: 'cajas.facturas.asignar_ncf', nombre: 'Asignar NCF', modulo: 'CAJAS', descripcion: 'Asignar Número de Comprobante Fiscal' },

  // Denuncias en cajas
  { codigo: 'cajas.denuncias.view', nombre: 'Ver denuncias para cobro', modulo: 'CAJAS', descripcion: 'Ver denuncias pendientes de cobro' },
  { codigo: 'cajas.denuncias.cobrar', nombre: 'Cobrar denuncia', modulo: 'CAJAS', descripcion: 'Registrar cobro de denuncia' },

  // Reportes
  { codigo: 'cajas.reportes.mi_caja', nombre: 'Ver reportes de mi caja', modulo: 'CAJAS', descripcion: 'Ver reportes de mi propia caja' },

  // ============================================
  // MÓDULO: INSPECTORÍA
  // ============================================
  { codigo: 'inspectoria.dashboard.view', nombre: 'Ver dashboard Inspectoría', modulo: 'INSPECTORIA', descripcion: 'Ver métricas del módulo Inspectoría' },

  // Empresas inspeccionadas
  { codigo: 'inspectoria.empresas.create', nombre: 'Registrar empresa', modulo: 'INSPECTORIA', descripcion: 'Registrar nueva empresa inspeccionada' },
  { codigo: 'inspectoria.empresas.update', nombre: 'Actualizar empresa', modulo: 'INSPECTORIA', descripcion: 'Actualizar datos de empresa' },
  { codigo: 'inspectoria.empresas.view_all', nombre: 'Ver todas las empresas', modulo: 'INSPECTORIA', descripcion: 'Ver todas las empresas registradas' },
  { codigo: 'inspectoria.empresas.delete', nombre: 'Eliminar empresa', modulo: 'INSPECTORIA', descripcion: 'Eliminar empresa del registro' },

  // Solicitudes IRC (empresas) - Flujo PR-DI-002
  { codigo: 'inspectoria.solicitudes_irc.receive', nombre: 'Recibir solicitud IRC', modulo: 'INSPECTORIA', descripcion: 'Recibir solicitud de registro IRC empresa' },
  { codigo: 'inspectoria.solicitudes_irc.validar', nombre: 'Validar documentos IRC', modulo: 'INSPECTORIA', descripcion: 'Validar documentos de solicitud IRC' },
  { codigo: 'inspectoria.solicitudes_irc.asentar', nombre: 'Asentar en libro IRC', modulo: 'INSPECTORIA', descripcion: 'Asentar solicitud en libro de inspectoría' },
  { codigo: 'inspectoria.solicitudes_irc.firmar', nombre: 'Firmar certificado IRC', modulo: 'INSPECTORIA', descripcion: 'Firmar certificado IRC empresa' },
  { codigo: 'inspectoria.solicitudes_irc.entregar', nombre: 'Entregar certificado IRC', modulo: 'INSPECTORIA', descripcion: 'Marcar certificado IRC como entregado' },

  // Casos de inspección
  { codigo: 'inspectoria.casos.create', nombre: 'Crear caso de inspección', modulo: 'INSPECTORIA', descripcion: 'Crear nuevo caso de inspección' },
  { codigo: 'inspectoria.casos.view_all', nombre: 'Ver todos los casos', modulo: 'INSPECTORIA', descripcion: 'Ver todos los casos de inspección' },
  { codigo: 'inspectoria.casos.update', nombre: 'Actualizar caso', modulo: 'INSPECTORIA', descripcion: 'Actualizar información de caso' },
  { codigo: 'inspectoria.casos.asignar_inspector', nombre: 'Asignar inspector', modulo: 'INSPECTORIA', descripcion: 'Asignar inspector a caso' },
  { codigo: 'inspectoria.casos.cerrar', nombre: 'Cerrar caso', modulo: 'INSPECTORIA', descripcion: 'Cerrar caso de inspección' },
  { codigo: 'inspectoria.casos.derivar_juridico', nombre: 'Derivar a Jurídico', modulo: 'INSPECTORIA', descripcion: 'Derivar caso a módulo Jurídico' },

  // Viajes de oficio
  { codigo: 'inspectoria.viajes.create', nombre: 'Crear viaje de oficio', modulo: 'INSPECTORIA', descripcion: 'Planificar nuevo viaje de oficio' },
  { codigo: 'inspectoria.viajes.view_all', nombre: 'Ver todos los viajes', modulo: 'INSPECTORIA', descripcion: 'Ver todos los viajes planificados' },
  { codigo: 'inspectoria.viajes.asignar_inspectores', nombre: 'Asignar inspectores a viaje', modulo: 'INSPECTORIA', descripcion: 'Asignar inspectores a viaje de oficio' },

  // Actas de inspección
  { codigo: 'inspectoria.actas.view_all', nombre: 'Ver todas las actas', modulo: 'INSPECTORIA', descripcion: 'Ver todas las actas de inspección' },
  { codigo: 'inspectoria.actas.review', nombre: 'Revisar actas', modulo: 'INSPECTORIA', descripcion: 'Revisar y aprobar actas' },

  // Registros y certificados
  { codigo: 'inspectoria.registros_asentamiento.view', nombre: 'Ver registros de asentamiento', modulo: 'INSPECTORIA', descripcion: 'Ver libro de asentamiento de inspectoría' },
  { codigo: 'inspectoria.certificados_pendientes.view', nombre: 'Ver certificados pendientes', modulo: 'INSPECTORIA', descripcion: 'Ver certificados IRC pendientes' },

  // Reportes
  { codigo: 'inspectoria.reportes.export', nombre: 'Exportar reportes Inspectoría', modulo: 'INSPECTORIA', descripcion: 'Exportar reportes del módulo' },

  // ============================================
  // MÓDULO: JURÍDICO
  // ============================================
  { codigo: 'juridico.casos.view_all', nombre: 'Ver todos los casos jurídicos', modulo: 'JURIDICO', descripcion: 'Ver todos los casos del área jurídica' },
  { codigo: 'juridico.casos.update', nombre: 'Actualizar caso jurídico', modulo: 'JURIDICO', descripcion: 'Actualizar información de caso' },
  { codigo: 'juridico.casos.actualizar_estado', nombre: 'Actualizar estado de caso', modulo: 'JURIDICO', descripcion: 'Cambiar estado de caso jurídico' },
  { codigo: 'juridico.casos.cerrar', nombre: 'Cerrar caso jurídico', modulo: 'JURIDICO', descripcion: 'Cerrar caso jurídico' },

  // Documentos legales
  { codigo: 'juridico.documentos.upload', nombre: 'Cargar documentos', modulo: 'JURIDICO', descripcion: 'Cargar documentos legales' },
  { codigo: 'juridico.documentos.view', nombre: 'Ver documentos', modulo: 'JURIDICO', descripcion: 'Ver documentos del caso' },
  { codigo: 'juridico.documentos.download', nombre: 'Descargar documentos', modulo: 'JURIDICO', descripcion: 'Descargar documentos legales' },

  // Consultas y reportes
  { codigo: 'juridico.consultar_plazos', nombre: 'Consultar plazos legales', modulo: 'JURIDICO', descripcion: 'Consultar plazos y vencimientos' },
  { codigo: 'juridico.reportes.view', nombre: 'Ver reportes jurídicos', modulo: 'JURIDICO', descripcion: 'Ver reportes del módulo jurídico' },

  // ============================================
  // MÓDULO: REPORTES (Transversal)
  // ============================================
  { codigo: 'reportes.atu.view', nombre: 'Ver reportes ATU', modulo: 'REPORTES', descripcion: 'Ver reportes del módulo ATU' },
  { codigo: 'reportes.atu.view_own', nombre: 'Ver reportes ATU propios', modulo: 'REPORTES', descripcion: 'Ver solo reportes propios de ATU' },
  { codigo: 'reportes.registro.view', nombre: 'Ver reportes Registro', modulo: 'REPORTES', descripcion: 'Ver reportes del módulo Registro' },
  { codigo: 'reportes.registro.view_own', nombre: 'Ver reportes Registro propios', modulo: 'REPORTES', descripcion: 'Ver solo reportes propios de Registro' },
  { codigo: 'reportes.cajas.view', nombre: 'Ver reportes Cajas', modulo: 'REPORTES', descripcion: 'Ver reportes del módulo Cajas' },
  { codigo: 'reportes.cajas.view_own', nombre: 'Ver reportes Cajas propios', modulo: 'REPORTES', descripcion: 'Ver solo reportes de mi caja' },
  { codigo: 'reportes.inspectoria.view', nombre: 'Ver reportes Inspectoría', modulo: 'REPORTES', descripcion: 'Ver reportes del módulo Inspectoría' },
  { codigo: 'reportes.juridico.view', nombre: 'Ver reportes Jurídico', modulo: 'REPORTES', descripcion: 'Ver reportes del módulo Jurídico' },
  { codigo: 'reportes.view_all', nombre: 'Ver todos los reportes', modulo: 'REPORTES', descripcion: 'Ver reportes de todos los módulos' },
  { codigo: 'reportes.export', nombre: 'Exportar reportes', modulo: 'REPORTES', descripcion: 'Exportar reportes a Excel/PDF' },

  // ============================================
  // MÓDULO: DASHBOARD (Transversal)
  // ============================================
  { codigo: 'dashboard.view_all_modules', nombre: 'Ver dashboard de todos los módulos', modulo: 'DASHBOARD', descripcion: 'Ver dashboard consolidado de todo el sistema' },

  // ============================================
  // MÓDULO: SISTEMA (Administración)
  // ============================================
  { codigo: 'usuarios.create', nombre: 'Crear usuarios', modulo: 'SISTEMA', descripcion: 'Crear nuevos usuarios del sistema' },
  { codigo: 'usuarios.read', nombre: 'Ver usuarios', modulo: 'SISTEMA', descripcion: 'Ver listado de usuarios' },
  { codigo: 'usuarios.update', nombre: 'Actualizar usuarios', modulo: 'SISTEMA', descripcion: 'Actualizar datos de usuarios' },
  { codigo: 'usuarios.delete', nombre: 'Eliminar usuarios', modulo: 'SISTEMA', descripcion: 'Desactivar usuarios' },
  { codigo: 'usuarios.reset_password', nombre: 'Resetear contraseña', modulo: 'SISTEMA', descripcion: 'Resetear contraseña de usuarios' },
  { codigo: 'usuarios.assign_role', nombre: 'Asignar rol', modulo: 'SISTEMA', descripcion: 'Asignar roles a usuarios' }
];

// Mapeo de permisos por rol
const PERMISOS_POR_ROL: Record<string, string[]> = {
  // ============================================
  // ADMINISTRADOR - Acceso total (bypass en middleware)
  // ============================================
  ADMINISTRADOR: [
    // Tiene acceso a todo mediante bypass en middleware
    // Pero registramos permisos de gestión de usuarios explícitamente
    'usuarios.create',
    'usuarios.read',
    'usuarios.update',
    'usuarios.delete',
    'usuarios.reset_password',
    'usuarios.assign_role',
    'dashboard.view_all_modules',
    'reportes.view_all',
    'reportes.export'
  ],

  // ============================================
  // DIRECTOR - Solo lectura de todo
  // ============================================
  DIRECTOR: [
    'dashboard.view_all_modules',
    // ATU (solo lectura)
    'atu.dashboard.view',
    'atu.formularios.view_all',
    'atu.historial_formularios.view_all',
    'atu.historial_entregas.view_all',
    'atu.consultar_estado',
    // Registro (solo lectura)
    'registro.dashboard.view',
    'registro.obras_pendientes.view_all',
    'registro.asentamiento.view_all',
    'registro.certificados.view_all',
    'registro.historial.view_all',
    // Cajas (solo lectura)
    'cajas.dashboard.view',
    // Inspectoría (solo lectura)
    'inspectoria.dashboard.view',
    'inspectoria.empresas.view_all',
    'inspectoria.casos.view_all',
    'inspectoria.viajes.view_all',
    'inspectoria.actas.view_all',
    // Jurídico (solo lectura)
    'juridico.casos.view_all',
    'juridico.documentos.view',
    // Reportes (todos)
    'reportes.view_all',
    'reportes.export'
  ],

  // ============================================
  // ATU - ENCARGADO_ATU
  // ============================================
  ENCARGADO_ATU: [
    'atu.dashboard.view',
    'atu.formularios.view_all',
    'atu.formularios.create',
    'atu.formularios.update',
    'atu.formularios.delete',
    'atu.formularios.approve',
    'atu.formularios.corregir_devueltos_propios',
    'atu.formularios.corregir_devueltos_otros',
    'atu.formularios.reasignar',
    'atu.clientes.create',
    'atu.clientes.update',
    'atu.certificados.view',
    'atu.certificados.entregar',
    'atu.historial_formularios.view_all',
    'atu.historial_entregas.view_all',
    'atu.denuncias.create',
    'atu.denuncias.update',
    'atu.denuncias.view_all',
    'atu.reportes.export',
    'reportes.atu.view',
    'reportes.export'
  ],

  // ============================================
  // ATU - TECNICO_ATU
  // ============================================
  TECNICO_ATU: [
    'atu.dashboard.view',
    'atu.formularios.view_own',
    'atu.formularios.create',
    'atu.formularios.update_own_draft',
    'atu.formularios.corregir_devueltos_propios',
    'atu.clientes.create',
    'atu.clientes.update',
    'atu.certificados.view',
    'atu.certificados.entregar',
    'atu.historial_formularios.view_own',
    'atu.historial_entregas.view_own',
    'atu.consultar_estado',
    'reportes.atu.view_own'
  ],

  // ============================================
  // ATU - RECEPCIONISTA
  // ============================================
  RECEPCIONISTA: [
    'atu.clientes.create',
    'atu.clientes.update',
    'atu.certificados.view',
    'atu.certificados.entregar',
    'atu.historial_entregas.view_own',
    'atu.consultar_estado'
  ],

  // ============================================
  // REGISTRO - ENCARGADO_REGISTRO
  // ============================================
  ENCARGADO_REGISTRO: [
    'registro.dashboard.view',
    'registro.obras_pendientes.view_all',
    'registro.asentamiento.view_all',
    'registro.asentamiento.create',
    'registro.asentamiento.update',
    'registro.certificados.view_all',
    'registro.certificados.generate',
    'registro.certificados.firmar',        // EXCLUSIVO
    'registro.certificados.enviar',        // EXCLUSIVO
    'registro.devolver_atu',
    'registro.historial.view_all',
    'registro.historial.export',
    'registro.reasignar_obras',
    'reportes.registro.view',
    'reportes.export'
  ],

  // ============================================
  // REGISTRO - TECNICO_ASENTAMIENTO
  // ============================================
  TECNICO_ASENTAMIENTO: [
    'registro.dashboard.view',
    'registro.obras_pendientes.view',
    'registro.obras_pendientes.tomar',
    'registro.asentamiento.create',
    'registro.devolver_atu',
    'registro.historial.view_all',
    'registro.consultar_estado',
    'reportes.registro.view_own'
  ],

  // ============================================
  // REGISTRO - TECNICO_CERTIFICACION
  // ============================================
  TECNICO_CERTIFICACION: [
    'registro.dashboard.view',
    'registro.obras_certificacion.view',
    'registro.obras_certificacion.tomar',
    'registro.asentamiento.view',
    'registro.certificados.generate',
    'registro.devolver_atu',
    'registro.historial.view_all',
    'registro.consultar_estado',
    'reportes.registro.view_own'
  ],

  // ============================================
  // CAJAS - CAJERO
  // ============================================
  CAJERO: [
    'cajas.dashboard.view',
    'cajas.mi_caja.view',
    'cajas.mi_caja.abrir',
    'cajas.mi_caja.cerrar',
    'cajas.mi_caja.arqueo',
    'cajas.mi_caja.historial',
    'cajas.cobros_pendientes.view',
    'cajas.cobros.registrar_pago',
    'cajas.facturas.generate',
    'cajas.facturas.asignar_ncf',
    'cajas.denuncias.view',
    'cajas.denuncias.cobrar',
    'cajas.reportes.mi_caja',
    'reportes.cajas.view_own'
  ],

  // ============================================
  // INSPECTORÍA - ENCARGADO_INSPECTORIA
  // ============================================
  ENCARGADO_INSPECTORIA: [
    'inspectoria.dashboard.view',
    'inspectoria.empresas.create',
    'inspectoria.empresas.update',
    'inspectoria.empresas.view_all',
    'inspectoria.empresas.delete',
    'inspectoria.solicitudes_irc.receive',
    'inspectoria.solicitudes_irc.validar',
    'inspectoria.solicitudes_irc.asentar',
    'inspectoria.solicitudes_irc.firmar',
    'inspectoria.solicitudes_irc.entregar',
    'inspectoria.casos.create',
    'inspectoria.casos.view_all',
    'inspectoria.casos.update',
    'inspectoria.casos.asignar_inspector',
    'inspectoria.casos.cerrar',
    'inspectoria.casos.derivar_juridico',
    'inspectoria.viajes.create',
    'inspectoria.viajes.view_all',
    'inspectoria.viajes.asignar_inspectores',
    'inspectoria.actas.view_all',
    'inspectoria.actas.review',
    'inspectoria.registros_asentamiento.view',
    'inspectoria.certificados_pendientes.view',
    'inspectoria.reportes.export',
    'reportes.inspectoria.view',
    'reportes.export'
  ],

  // ============================================
  // INSPECTORÍA - PARALEGAL
  // ============================================
  PARALEGAL: [
    'inspectoria.dashboard.view',
    'inspectoria.empresas.create',
    'inspectoria.empresas.update',
    'inspectoria.empresas.view_all',
    'inspectoria.empresas.delete',
    'inspectoria.solicitudes_irc.receive',
    'inspectoria.solicitudes_irc.validar',
    'inspectoria.solicitudes_irc.asentar',
    'inspectoria.solicitudes_irc.firmar',
    'inspectoria.solicitudes_irc.entregar',
    'inspectoria.casos.create',
    'inspectoria.casos.view_all',
    'inspectoria.casos.update',
    'inspectoria.casos.asignar_inspector',
    'inspectoria.casos.cerrar',
    'inspectoria.casos.derivar_juridico',
    'inspectoria.viajes.create',
    'inspectoria.viajes.view_all',
    'inspectoria.viajes.asignar_inspectores',
    'inspectoria.actas.view_all',
    'inspectoria.actas.review',
    'inspectoria.registros_asentamiento.view',
    'inspectoria.certificados_pendientes.view',
    'inspectoria.reportes.export',
    'reportes.inspectoria.view',
    'reportes.export'
  ],

  // ============================================
  // JURÍDICO
  // ============================================
  JURIDICO: [
    'juridico.casos.view_all',
    'juridico.casos.update',
    'juridico.casos.actualizar_estado',
    'juridico.casos.cerrar',
    'juridico.documentos.upload',
    'juridico.documentos.view',
    'juridico.documentos.download',
    'juridico.consultar_plazos',
    'juridico.reportes.view',
    'reportes.juridico.view',
    'reportes.export'
  ]
};

async function main() {
  console.log('🚀 Iniciando seed de roles y permisos...\n');

  try {
    // 1. Crear o actualizar roles
    console.log('📋 Creando/actualizando roles...');
    const rolesCreados = [];
    for (const rol of ROLES) {
      const rolCreado = await prisma.usuarioTipo.upsert({
        where: { nombre: rol.nombre },
        update: { descripcion: rol.descripcion },
        create: rol
      });
      rolesCreados.push(rolCreado);
      console.log(`   ✅ ${rol.nombre}`);
    }

    // 2. Crear o actualizar permisos
    console.log('\n🔐 Creando/actualizando permisos...');
    const permisosCreados = [];
    for (const permiso of PERMISOS) {
      const permisoCreado = await prisma.permiso.upsert({
        where: { codigo: permiso.codigo },
        update: {
          nombre: permiso.nombre,
          modulo: permiso.modulo,
          descripcion: permiso.descripcion
        },
        create: permiso
      });
      permisosCreados.push(permisoCreado);
    }
    console.log(`   ✅ ${permisosCreados.length} permisos creados/actualizados`);

    // 3. Asignar permisos a roles
    console.log('\n🔗 Asignando permisos a roles...');

    // Primero, limpiar asignaciones existentes
    await prisma.rolPermiso.deleteMany({});

    for (const [nombreRol, codigosPermisos] of Object.entries(PERMISOS_POR_ROL)) {
      const rol = rolesCreados.find(r => r.nombre === nombreRol);
      if (!rol) {
        console.log(`   ⚠️  Rol no encontrado: ${nombreRol}`);
        continue;
      }

      let permisosAsignados = 0;
      for (const codigoPermiso of codigosPermisos) {
        const permiso = permisosCreados.find(p => p.codigo === codigoPermiso);
        if (!permiso) {
          console.log(`   ⚠️  Permiso no encontrado: ${codigoPermiso}`);
          continue;
        }

        await prisma.rolPermiso.create({
          data: {
            rolId: rol.id,
            permisoId: permiso.id
          }
        });
        permisosAsignados++;
      }

      console.log(`   ✅ ${nombreRol}: ${permisosAsignados} permisos asignados`);
    }

    // 4. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`   • ${rolesCreados.length} roles creados/actualizados`);
    console.log(`   • ${permisosCreados.length} permisos creados/actualizados`);

    const totalAsignaciones = await prisma.rolPermiso.count();
    console.log(`   • ${totalAsignaciones} asignaciones rol-permiso creadas`);

    console.log('\n✨ Seed completado exitosamente!\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
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
