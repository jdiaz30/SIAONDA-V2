import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { generarCertificadoIRCPDF } from '../../utils/generarCertificadoIRC';

const prisma = new PrismaClient();

/**
 * Generar código único para solicitud (SOL-INSP-YYYY-NNNN)
 */
const generarCodigoSolicitud = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `SOL-INSP-${year}-`;

  // Buscar la última solicitud del año
  const ultimaSolicitud = await prisma.solicitudRegistroInspeccion.findFirst({
    where: {
      codigo: {
        startsWith: prefix
      }
    },
    orderBy: { codigo: 'desc' }
  });

  let numero = 1;
  if (ultimaSolicitud) {
    const ultimoNumero = parseInt(ultimaSolicitud.codigo.split('-').pop() || '0');
    numero = ultimoNumero + 1;
  }

  return `${prefix}${numero.toString().padStart(4, '0')}`;
};

/**
 * PASO 1 - AuU RECEPCIÓN: Crear nueva solicitud
 */
export const crearSolicitud = async (req: AuthRequest, res: Response) => {
  try {
    const {
      empresaId,
      tipoSolicitud, // 'REGISTRO_NUEVO' o 'RENOVACION'
      rnc,
      nombreEmpresa,
      nombreComercial,
      categoriaIrcId
    } = req.body;

    const usuarioId = req.usuario?.id || 1;

    // Validar si es renovación, debe existir la empresa
    if (tipoSolicitud === 'RENOVACION' && !empresaId) {
      return res.status(400).json({
        success: false,
        message: 'Para renovación debe proporcionar el ID de la empresa'
      });
    }

    // Si es registro nuevo, verificar que no exista el RNC
    if (tipoSolicitud === 'REGISTRO_NUEVO') {
      const empresaExistente = await prisma.empresaInspeccionada.findUnique({
        where: { rnc: rnc.replace(/-/g, '') }
      });

      if (empresaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una empresa con este RNC. Use tipo RENOVACION.',
          empresaId: empresaExistente.id
        });
      }
    }

    // Generar código único
    const codigo = await generarCodigoSolicitud();

    // Crear solicitud con estado PENDIENTE (id: 1)
    const solicitud = await prisma.solicitudRegistroInspeccion.create({
      data: {
        codigo,
        empresaId,
        tipoSolicitud,
        rnc: rnc.replace(/-/g, ''),
        nombreEmpresa,
        nombreComercial,
        categoriaIrcId,
        estadoId: 1, // PENDIENTE
        recibidoPorId: usuarioId,
        fechaRecepcion: new Date()
      },
      include: {
        empresa: {
          include: {
            categoriaIrc: true,
            provincia: true
          }
        },
        categoriaIrc: true,
        estado: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: solicitud
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 2 - AuU GENERA FACTURA: Generar factura para la solicitud
 * (No hay validación previa, se genera automáticamente al crear la solicitud)
 */
export const generarFactura = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || 1;

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: { categoriaIrc: true }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estadoId !== 1) { // Debe estar en PENDIENTE
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está en estado PENDIENTE'
      });
    }

    if (solicitud.facturaId) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud ya tiene una factura generada'
      });
    }

    // Generar factura automáticamente
    const precio = Number(solicitud.categoriaIrc.precio);

    const factura = await prisma.factura.create({
      data: {
        codigo: `FACT-INSP-${Date.now()}`, // TODO: Mejorar generación de código
        clienteId: 1, // TODO: Obtener del cliente real
        estadoId: 1, // Abierta
        subtotal: precio,
        itbis: precio * 0.18, // 18% ITBIS
        total: precio * 1.18,
        metodoPago: null
      }
    });

    // Actualizar solicitud con factura (se mantiene en PENDIENTE)
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        facturaId: factura.id
      },
      include: {
        estado: true,
        factura: true,
        categoriaIrc: true,
        empresa: true
      }
    });

    return res.json({
      success: true,
      message: 'Factura generada exitosamente',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al generar factura:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar factura',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 3 - CAJA PAGO: Webhook cuando se paga la factura
 * Actualiza de PENDIENTE (1) a PAGADA (2)
 */
export const marcarComoPagada = async (req: AuthRequest, res: Response) => {
  try {
    const { facturaId } = req.body;

    // Buscar solicitud por facturaId
    const solicitud = await prisma.solicitudRegistroInspeccion.findFirst({
      where: { facturaId: Number(facturaId) }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró solicitud asociada a esta factura'
      });
    }

    if (solicitud.estadoId !== 1) { // Debe estar en PENDIENTE
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está en estado PENDIENTE'
      });
    }

    // Actualizar a PAGADA
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: solicitud.id },
      data: {
        estadoId: 2, // PAGADA
        fechaPago: new Date()
      },
      include: {
        estado: true,
        factura: true
      }
    });

    return res.json({
      success: true,
      message: 'Solicitud marcada como pagada. Esperando revisión de Inspectoría.',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al marcar solicitud como pagada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al marcar solicitud como pagada',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 4 - INSPECTORÍA REVISIÓN: Aprobar revisión después de pago
 * Actualiza de PAGADA (2) a EN_REVISION (3) y crea la empresa
 */
export const aprobarRevision = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || 1;

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: {
        categoriaIrc: true,
        formulario: {
          include: {
            productos: {
              include: {
                campos: {
                  include: {
                    campo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estadoId !== 2) { // Debe estar en PAGADA
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está en estado PAGADA'
      });
    }

    // 1. Buscar o crear empresa en EmpresaInspeccionada
    let empresaId = solicitud.empresaId;

    if (!empresaId) {
      // Buscar si ya existe una empresa con ese RNC
      const empresaExistente = await prisma.empresaInspeccionada.findFirst({
        where: { rnc: solicitud.rnc }
      });

      if (empresaExistente) {
        // Si existe, asociarla a la solicitud
        empresaId = empresaExistente.id;
      } else {
        // Si no existe, crear nueva empresa temporal (se actualizará al asentar)
        const fechaVenc = new Date();
        fechaVenc.setFullYear(fechaVenc.getFullYear() + 1);

        const nuevaEmpresa = await prisma.empresaInspeccionada.create({
          data: {
            nombreEmpresa: solicitud.nombreEmpresa || '',
            nombreComercial: solicitud.nombreComercial,
            rnc: solicitud.rnc,
            direccion: 'Pendiente de actualizar',
            telefono: 'N/A',
            email: 'pendiente@onda.gov.do',
            categoriaIrcId: solicitud.categoriaIrcId,
            tipoPersona: 'MORAL',
            descripcionActividades: 'Importador/Distribuidor de obras protegidas',
            registrado: false, // Se marcará como true al asentar
            fechaRegistro: new Date(),
            fechaVencimiento: fechaVenc,
            statusId: 1, // ACTIVA
            creadoPorId: usuarioId
          }
        });
        empresaId = nuevaEmpresa.id;
      }
    }

    // 2. Actualizar solicitud a EN_REVISION
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        estadoId: 3, // EN_REVISION
        validadoPorId: usuarioId,
        fechaValidacion: new Date(),
        empresaId: empresaId // Asociar empresa
      },
      include: {
        estado: true,
        empresa: {
          include: {
            categoriaIrc: true
          }
        },
        categoriaIrc: true,
        factura: true
      }
    });

    return res.json({
      success: true,
      message: 'Revisión aprobada. Lista para asentamiento.',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al aprobar revisión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al aprobar revisión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 5 - INSPECTORÍA ASENTAMIENTO: Introducir número de libro y hoja, generar número de registro
 * Actualiza de EN_REVISION (3) a ASENTADA (5)
 */
export const asentarSolicitud = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { numeroLibro, numeroHoja } = req.body;
    const usuarioId = req.usuario?.id || 1;

    if (!numeroLibro || !numeroHoja) {
      return res.status(400).json({
        success: false,
        message: 'El número de libro y número de hoja son requeridos'
      });
    }

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: {
        formulario: true
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.estadoId !== 3) { // Debe estar en EN_REVISION
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está en estado EN_REVISION'
      });
    }

    // Generar número de registro
    // Para solicitudes IRC sin formulario, usar formato: numero/mes/año
    let numeroRegistro: string;

    if (solicitud.formulario) {
      // Si tiene formulario (flujo antiguo), usar código del formulario
      numeroRegistro = solicitud.formulario.codigo;
    } else {
      // Para solicitudes IRC sin formulario, generar número secuencial
      const now = new Date();
      const mes = (now.getMonth() + 1).toString().padStart(2, '0');
      const año = now.getFullYear();

      // Buscar último número de registro del año
      const ultimoRegistro = await prisma.solicitudRegistroInspeccion.findFirst({
        where: {
          numeroRegistro: {
            endsWith: `/${mes}/${año}`
          }
        },
        orderBy: {
          numeroRegistro: 'desc'
        }
      });

      let numero = 1;
      if (ultimoRegistro?.numeroRegistro) {
        const partes = ultimoRegistro.numeroRegistro.split('/');
        numero = parseInt(partes[0]) + 1;
      }

      numeroRegistro = `${numero.toString().padStart(8, '0')}/${mes}/${año}`;
    }

    // Verificar que el número de registro no esté en uso (por seguridad)
    const registroExistente = await prisma.solicitudRegistroInspeccion.findFirst({
      where: {
        numeroRegistro,
        id: { not: Number(id) }
      }
    });

    if (registroExistente) {
      return res.status(400).json({
        success: false,
        message: 'Este número de registro ya está en uso. Contacte al administrador.'
      });
    }

    // Crear o actualizar la empresa asociada
    let empresaId = solicitud.empresaId;

    // Obtener campos del formulario (si existe)
    let formCampos: any[] = [];
    if (solicitud.formulario?.id) {
      formCampos = await prisma.formularioProductoCampo.findMany({
        where: {
          formularioProducto: {
            formularioId: solicitud.formulario.id
          }
        },
        include: {
          campo: true
        }
      });
    }

    const getCampoValue = (campoNombre: string) => {
      const campo = formCampos.find(c => c.campo.campo === campoNombre);
      return campo?.valor || null;
    };

    // Obtener el ID del status "ACTIVA"
    const statusActiva = await prisma.statusInspeccion.findFirst({
      where: { nombre: 'ACTIVA' }
    });

    if (!statusActiva) {
      return res.status(500).json({
        success: false,
        message: 'No se encontró el status ACTIVA. Ejecuta el seed de la base de datos.'
      });
    }

    const fechaVenc = new Date();
    fechaVenc.setFullYear(fechaVenc.getFullYear() + 1);

    if (solicitud.tipoSolicitud === 'REGISTRO_NUEVO') {
      if (!empresaId) {
        // Solo crear empresa si viene de formulario antiguo (no IRC desde AaU)
        if (!solicitud.formulario) {
          return res.status(400).json({
            success: false,
            message: 'Error: Solicitud de registro nuevo sin empresa asociada. Esta solicitud debe tener una empresa creada.'
          });
        }

        console.log('🔵 Intentando crear empresa IRC desde formulario...');
        console.log(`   Nombre: ${solicitud.nombreEmpresa}`);
        console.log(`   RNC: ${solicitud.rnc}`);
        console.log(`   Categoría IRC ID: ${solicitud.categoriaIrcId}`);
        console.log(`   Status ID: ${statusActiva.id}`);

        try {
          // Buscar provincia por nombre (el formulario guarda el nombre, no el ID)
          const provinciaNombre = getCampoValue('provincia');
          let provinciaId: number | null = null;

          if (provinciaNombre) {
            const provincia = await prisma.provincia.findFirst({
              where: { nombre: provinciaNombre }
            });
            provinciaId = provincia?.id || null;
            console.log(`   Provincia: ${provinciaNombre} -> ID: ${provinciaId}`);
          }

          // CREAR nueva empresa desde los datos del formulario
          const empresaCreada = await prisma.empresaInspeccionada.create({
            data: {
              nombreEmpresa: solicitud.nombreEmpresa!,
              nombreComercial: solicitud.nombreComercial || null,
              rnc: solicitud.rnc,
              direccion: getCampoValue('direccion') || 'N/A',
              telefono: getCampoValue('telefono') || 'N/A',
              fax: getCampoValue('fax'),
              email: getCampoValue('email') || 'N/A',
              paginaWeb: getCampoValue('paginaWeb'),
              categoriaIrcId: solicitud.categoriaIrcId,
              tipoPersona: getCampoValue('tipoPersona') || 'MORAL',
              nombrePropietario: getCampoValue('nombrePropietario'),
              cedulaPropietario: getCampoValue('cedulaPropietario'),
              descripcionActividades: getCampoValue('descripcionActividades') || 'N/A',
              provinciaId,
              personaContacto: getCampoValue('representanteLegal'),
              statusId: statusActiva.id,
              creadoPorId: usuarioId,
              registrado: true,
              existeEnSistema: true,
              fechaRegistro: new Date(),
              fechaVencimiento: fechaVenc
            }
          });
          empresaId = empresaCreada.id;

          console.log(`✅ Empresa IRC creada exitosamente: ${empresaCreada.nombreEmpresa} (ID: ${empresaCreada.id})`);
        } catch (error) {
          console.error('❌ ERROR al crear empresa IRC:', error);
          throw error;
        }
      } else {
        // Si ya existe (solicitudes IRC desde AaU), solo marcar como registrada
        console.log(`🔵 Empresa ya existe (ID: ${empresaId}), marcando como registrada...`);
        await prisma.empresaInspeccionada.update({
          where: { id: empresaId },
          data: {
            registrado: true,
            existeEnSistema: true,
            fechaRegistro: new Date(),
            fechaVencimiento: fechaVenc,
            statusId: statusActiva.id
          }
        });
        console.log(`✅ Empresa actualizada como registrada`);
      }
    } else if (solicitud.tipoSolicitud === 'RENOVACION') {
      if (!empresaId) {
        // Buscar empresa por RNC
        const empresaExistente = await prisma.empresaInspeccionada.findFirst({
          where: { rnc: solicitud.rnc }
        });

        if (empresaExistente) {
          empresaId = empresaExistente.id;
        } else {
          return res.status(400).json({
            success: false,
            message: 'No se encontró la empresa para renovar. Debe existir un registro previo.'
          });
        }
      }

      // Actualizar fecha de renovación y vencimiento
      await prisma.empresaInspeccionada.update({
        where: { id: empresaId },
        data: {
          fechaRenovacion: new Date(),
          fechaVencimiento: fechaVenc,
          statusId: statusActiva.id
        }
      });

      console.log(`✅ Empresa IRC renovada: ID ${empresaId}`);
    }

    // Actualizar a ASENTADA y vincular la empresa
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        empresaId, // Vincular la empresa creada/actualizada
        numeroRegistro,
        numeroLibro,
        numeroHoja,
        estadoId: 5, // ASENTADA (nuevo orden)
        asentadoPorId: usuarioId,
        fechaAsentamiento: new Date()
      },
      include: {
        estado: true,
        empresa: {
          include: {
            categoriaIrc: true,
            provincia: true,
            status: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Registro asentado exitosamente',
      data: {
        ...solicitudActualizada,
        numeroRegistroGenerado: numeroRegistro
      }
    });
  } catch (error) {
    console.error('Error al asentar solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asentar solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * DEVOLVER SOLICITUD A AuU: Para corrección de errores
 * Puede devolver desde PAGADA (2) o EN_REVISION (3) a DEVUELTA (4)
 */
export const devolverSolicitudAuU = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioId = req.usuario?.id || 1;

    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el motivo de la devolución'
      });
    }

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: { estado: true }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Solo se puede devolver si está en PAGADA (2) o EN_REVISION (3)
    if (solicitud.estadoId !== 2 && solicitud.estadoId !== 3) {
      return res.status(400).json({
        success: false,
        message: `No se puede devolver una solicitud en estado ${solicitud.estado.nombre}`
      });
    }

    // Buscar estado DEVUELTA (debe existir en el seed)
    const estadoDevuelta = await prisma.estadoSolicitudInspeccion.findFirst({
      where: { nombre: 'DEVUELTA' }
    });

    if (!estadoDevuelta) {
      return res.status(500).json({
        success: false,
        message: 'No se encontró el estado DEVUELTA. Ejecuta el seed de la base de datos.'
      });
    }

    // Actualizar solicitud
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        estadoId: estadoDevuelta.id,
        observaciones: `DEVUELTA POR INSPECTORÍA: ${motivo}\n\n${solicitud.observaciones || ''}`
      },
      include: {
        estado: true,
        categoriaIrc: true
      }
    });

    return res.json({
      success: true,
      message: 'Solicitud devuelta a AuU para correcciones',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al devolver solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al devolver solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 5 - GENERACIÓN CERTIFICADO: Generar PDF del certificado
 */
export const generarCertificado = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id || 1;

    const solicitud: any = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: {
          include: {
            provincia: true,
            consejoAdministracion: true,
            principalesClientes: true
          }
        },
        categoriaIrc: true,
        factura: true
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Permitir regenerar si está en ASENTADA (5) o CERTIFICADO_GENERADO (6)
    if (solicitud.estadoId !== 5 && solicitud.estadoId !== 6) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no está en estado ASENTADA o CERTIFICADO_GENERADO'
      });
    }

    if (!solicitud.numeroRegistro) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no tiene número de registro asignado'
      });
    }

    // Verificar que la solicitud tenga empresa vinculada
    // (la empresa se crea en el paso de asentamiento)
    const empresaId = solicitud.empresaId;

    if (!empresaId) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no tiene empresa vinculada. Debe asentarse primero para crear la empresa.'
      });
    }

    // Usar el número de registro como número de certificado (ya tiene formato correcto)
    const numeroCertificado = solicitud.numeroRegistro;
    const year = new Date().getFullYear();

    // Calcular fecha de vencimiento (1 año después)
    const fechaVencimiento = new Date();
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

    // Extraer datos de la empresa (ÚNICO FLUJO)
    const empresa = solicitud.empresa!;

    // Obtener primer miembro del consejo (presidente) si existe
    const presidente = empresa.consejoAdministracion?.find((m: any) => m.cargo === 'Presidente');

    console.log('=== DATOS EXTRAÍDOS DE EMPRESA ===');
    console.log('Dirección:', empresa.direccion);
    console.log('Teléfono:', empresa.telefono);
    console.log('Persona Contacto:', empresa.personaContacto);
    console.log('TipoPersona:', empresa.tipoPersona);
    console.log('Descripción:', empresa.descripcionActividades);
    console.log('===================================');

    const datosCertificado = {
      numeroRegistro: solicitud.numeroRegistro!,
      numeroLibro: solicitud.numeroLibro || 'N/A',
      numeroHoja: solicitud.numeroHoja || 'N/A',
      fechaInscripcion: solicitud.fechaAsentamiento || new Date(),
      fechaVencimiento,
      tipoSolicitud: solicitud.tipoSolicitud || 'REGISTRO_NUEVO',
      empresa: {
        nombreEmpresa: empresa.nombreEmpresa,
        nombreComercial: empresa.nombreComercial || undefined,
        rnc: empresa.rnc,
        tipoPersona: empresa.tipoPersona,
        categoriaIrc: solicitud.categoriaIrc?.nombre,
        descripcionActividades: empresa.descripcionActividades,
        fechaInicioOperaciones: empresa.fechaConstitucion ? new Date(empresa.fechaConstitucion).toLocaleDateString() : undefined,
        principalesClientes: empresa.principalesClientes?.map((c: any) => c.nombreCliente).join(', '),
        direccion: empresa.direccion,
        sector: empresa.sector || undefined,
        provincia: empresa.provincia?.nombre,
        telefono: empresa.telefono || undefined,
        telefonoSecundario: empresa.telefonoSecundario || undefined,
        correoElectronico: empresa.correoElectronico || undefined,
        representanteLegal: empresa.personaContacto || undefined,
        cedulaRepresentante: undefined,
        // Persona Moral - del consejo de administración
        presidenteNombre: presidente?.nombreCompleto,
        presidenteCedula: presidente?.cedula,
        presidenteDomicilio: presidente?.domicilio,
        presidenteTelefono: presidente?.telefono,
        presidenteCelular: presidente?.celular,
        presidenteEmail: presidente?.email,
        vicepresidente: undefined,
        secretario: undefined,
        tesorero: undefined,
        administrador: undefined,
        domicilioConsejo: undefined,
        telefonoConsejo: undefined,
        fechaConstitucion: empresa.fechaConstitucion ? new Date(empresa.fechaConstitucion).toLocaleDateString() : undefined,
        // Persona Física
        nombrePropietario: empresa.nombrePropietario || undefined,
        cedulaPropietario: empresa.cedulaPropietario || undefined,
        domicilioPropietario: undefined,
        telefonoPropietario: undefined,
        celularPropietario: undefined,
        emailPropietario: undefined,
        nombreAdministrador: undefined,
        cedulaAdministrador: undefined,
        telefonoAdministrador: undefined,
        fechaInicioActividades: undefined
      }
    };

    // Generar ruta del PDF
    const nombreArchivo = `${numeroCertificado.replace(/\//g, '-')}.pdf`;
    const rutaRelativa = `/uploads/certificados/inspeccion/${year}`;
    const rutaPdf = `${rutaRelativa}/${nombreArchivo}`;
    const rutaAbsoluta = path.join(__dirname, '../../../public', rutaPdf);

    // Generar el PDF (sobrescribe si ya existe)
    await generarCertificadoIRCPDF(datosCertificado, rutaAbsoluta);

    let certificado;
    let mensaje = '';

    // Si ya tiene certificado, actualizarlo; si no, crearlo
    if (solicitud.certificadoId) {
      // REGENERAR: Actualizar certificado existente
      certificado = await prisma.certificadoInspeccion.update({
        where: { id: solicitud.certificadoId },
        data: {
          fechaVencimiento,
          rutaPdf,
          fechaEmision: new Date() // Actualizar fecha de emisión
        }
      });
      mensaje = 'Certificado regenerado exitosamente.';
    } else {
      // GENERAR: Crear nuevo certificado
      certificado = await prisma.certificadoInspeccion.create({
        data: {
          empresaId: empresaId!,
          numeroCertificado,
          numeroRegistro: solicitud.numeroRegistro,
          numeroLibro: solicitud.numeroLibro || null,
          numeroHoja: solicitud.numeroHoja || null,
          facturaId: solicitud.facturaId!,
          fechaVencimiento,
          rutaPdf,
          emitidoPorId: usuarioId
        }
      });
      mensaje = 'Certificado generado exitosamente. Pendiente de firma.';
    }

    // Actualizar solicitud a CERTIFICADO_GENERADO solo si estaba en ASENTADA
    const updateData: any = {
      certificadoId: certificado.id
    };

    if (solicitud.estadoId === 5) {
      updateData.estadoId = 6; // CERTIFICADO_GENERADO
    }

    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        estado: true,
        certificado: true
      }
    });

    return res.json({
      success: true,
      message: mensaje,
      data: {
        solicitud: solicitudActualizada,
        certificado,
        rutaPdf
      }
    });
  } catch (error) {
    console.error('Error al generar certificado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar certificado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 8 - AuU ENTREGA: Marcar certificado como entregado
 * Actualiza de CERTIFICADO_CARGADO (8) a ENTREGADA (9)
 */
export const entregarCertificado = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombreReceptor, cedulaReceptor, esRepresentante } = req.body;
    const usuarioId = req.usuario?.id;
    const file = req.file;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar datos requeridos
    if (!nombreReceptor || !cedulaReceptor) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y cédula del receptor son obligatorios'
      });
    }

    // Si es representante, el documento legal es obligatorio
    if (esRepresentante === 'true' && !file) {
      return res.status(400).json({
        success: false,
        message: 'El documento legal es obligatorio para representantes'
      });
    }

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: true,
        certificado: true
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Debe estar en estado CERTIFICADO_CARGADO (estado 8)
    if (solicitud.estadoId !== 8) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud debe estar en estado CERTIFICADO_CARGADO para poder entregarla'
      });
    }

    // Preparar datos de actualización
    const updateData: any = {
      estadoId: 9, // ENTREGADA
      fechaEntrega: new Date(),
      entregadoPorId: usuarioId,
      nombreReceptor,
      cedulaReceptor,
      esRepresentante: esRepresentante === 'true'
    };

    // Si hay archivo, guardarlo
    if (file) {
      updateData.rutaDocumentoLegal = file.path;
    }

    // Actualizar solicitud a ENTREGADA (estado 9)
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        estado: true,
        certificado: true,
        empresa: true
      }
    });

    // Actualizar empresa según tipo de solicitud
    // Usar la fechaVencimiento de la solicitud (respeta años de vigencia pagados)
    if (solicitud.empresaId) {
      const updateData: any = {
        registrado: true,
        fechaVencimiento: solicitud.fechaVencimiento || new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      };

      if (solicitud.tipoSolicitud === 'REGISTRO_NUEVO') {
        updateData.fechaRegistro = new Date();
      } else if (solicitud.tipoSolicitud === 'RENOVACION') {
        updateData.fechaUltimaRenovacion = new Date();
      }

      await prisma.empresaInspeccionada.update({
        where: { id: solicitud.empresaId },
        data: updateData
      });
    }

    return res.json({
      success: true,
      message: 'Certificado entregado exitosamente. Proceso completado.',
      data: solicitudActualizada
    });
  } catch (error) {
    console.error('Error al entregar certificado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al entregar certificado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Listar solicitudes con filtros
 */
export const listarSolicitudes = async (req: AuthRequest, res: Response) => {
  try {
    const { estadoId, tipoSolicitud, empresaId, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (estadoId) {
      // Permitir múltiples estados separados por coma (ej: "4,5")
      const estadosStr = String(estadoId);
      if (estadosStr.includes(',')) {
        const estados = estadosStr.split(',').map(e => Number(e.trim()));
        where.estadoId = { in: estados };
      } else {
        where.estadoId = Number(estadoId);
      }
    }

    if (tipoSolicitud) {
      where.tipoSolicitud = String(tipoSolicitud);
    }

    if (empresaId) {
      where.empresaId = Number(empresaId);
    }

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudRegistroInspeccion.findMany({
        where,
        include: {
          empresa: {
            include: {
              categoriaIrc: true,
              provincia: true,
              consejoAdministracion: true,
              principalesClientes: true,
              documentos: true
            }
          },
          categoriaIrc: true,
          estado: true,
          factura: {
            include: {
              estado: true
            }
          },
          formulario: {
            select: {
              id: true,
              codigo: true,
              productos: {
                include: {
                  campos: {
                    include: {
                      campo: true
                    }
                  }
                }
              }
            }
          },
          recibidoPor: {
            select: {
              id: true,
              nombrecompleto: true
            }
          },
          certificado: {
            select: {
              id: true,
              numeroCertificado: true,
              rutaPdf: true,
              rutaPdfFirmado: true,
              fechaEmision: true
            }
          }
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.solicitudRegistroInspeccion.count({ where })
    ]);

    return res.json({
      success: true,
      data: solicitudes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar solicitudes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener solicitud por ID
 */
export const obtenerSolicitud = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: {
        empresa: {
          include: {
            categoriaIrc: true,
            provincia: true,
            consejoAdministracion: true,
            principalesClientes: true
          }
        },
        categoriaIrc: true,
        estado: true,
        factura: {
          include: {
            estado: true
          }
        },
        certificado: true,
        recibidoPor: { select: { id: true, nombrecompleto: true } },
        validadoPor: { select: { id: true, nombrecompleto: true } },
        asentadoPor: { select: { id: true, nombrecompleto: true } },
        firmadoPor: { select: { id: true, nombrecompleto: true } },
        entregadoPor: { select: { id: true, nombrecompleto: true } }
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    return res.json({
      success: true,
      data: solicitud
    });
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 6 - REGISTRO FIRMA: Marcar certificado como firmado digitalmente
 * Actualiza de CERTIFICADO_GENERADO (6) a FIRMADA (7)
 */
export const firmarCertificado = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: { estado: true, certificado: true }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Validar que esté en estado CERTIFICADO_GENERADO (estado 6)
    if (solicitud.estadoId !== 6) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud debe estar en estado CERTIFICADO_GENERADO para firmar'
      });
    }

    if (!solicitud.certificadoId) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no tiene un certificado generado'
      });
    }

    // Actualizar certificado con fecha de firma (firma digital)
    await prisma.certificadoInspeccion.update({
      where: { id: solicitud.certificadoId },
      data: {
        fechaFirma: new Date()
      }
    });

    // Actualizar solicitud a FIRMADA (estado 7)
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        estadoId: 7, // FIRMADA
        firmadoPorId: usuarioId
      },
      include: {
        empresa: {
          include: {
            categoriaIrc: true
          }
        },
        estado: true,
        certificado: true
      }
    });

    return res.json({
      success: true,
      data: solicitudActualizada,
      message: 'Certificado firmado digitalmente. Pendiente de cargar PDF firmado.'
    });
  } catch (error) {
    console.error('Error al firmar certificado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al firmar certificado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * PASO 7 - SUBIR PDF FIRMADO: Cargar certificado firmado al sistema
 * Actualiza de FIRMADA (7) a CERTIFICADO_CARGADO (8)
 */
export const subirCertificadoFirmado = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitudRegistroInspeccion.findUnique({
      where: { id: Number(id) },
      include: { estado: true, certificado: true }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Validar que esté en estado CERTIFICADO_GENERADO (estado 6)
    if (solicitud.estadoId !== 6) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud debe estar en estado CERTIFICADO_GENERADO para subir el PDF firmado'
      });
    }

    if (!solicitud.certificadoId) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no tiene un certificado generado'
      });
    }

    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debe subir el certificado firmado (archivo PDF)'
      });
    }

    // Ruta del certificado firmado subido
    const rutaPdfFirmado = `/uploads/certificados/${req.file.filename}`;

    // Actualizar certificado con la ruta del PDF firmado
    await prisma.certificadoInspeccion.update({
      where: { id: solicitud.certificadoId },
      data: {
        rutaPdfFirmado
      }
    });

    // Buscar el estado CERTIFICADO_CARGADO
    const estadoCertificadoCargado = await prisma.estadoSolicitudInspeccion.findUnique({
      where: { nombre: 'CERTIFICADO_CARGADO' }
    });

    if (!estadoCertificadoCargado) {
      return res.status(500).json({
        success: false,
        message: 'Estado CERTIFICADO_CARGADO no encontrado en la base de datos'
      });
    }

    // Actualizar solicitud a CERTIFICADO_CARGADO
    const solicitudActualizada = await prisma.solicitudRegistroInspeccion.update({
      where: { id: Number(id) },
      data: {
        estadoId: estadoCertificadoCargado.id
      },
      include: {
        empresa: {
          include: {
            categoriaIrc: true
          }
        },
        estado: true,
        certificado: true
      }
    });

    return res.json({
      success: true,
      data: solicitudActualizada,
      message: 'Certificado firmado cargado exitosamente. Listo para entrega.'
    });
  } catch (error) {
    console.error('Error al subir certificado firmado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir certificado firmado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener certificados pendientes de firma
 */
export const obtenerCertificadosPendientesFirma = async (req: AuthRequest, res: Response) => {
  try {
    const certificados = await prisma.certificadoInspeccion.findMany({
      where: {
        solicitud: {
          estadoId: 6 // Estado CERTIFICADO_GENERADO
        }
      },
      include: {
        solicitud: {
          include: {
            empresa: {
              include: {
                categoriaIrc: true
              }
            }
          }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    return res.json({
      success: true,
      data: certificados
    });
  } catch (error) {
    console.error('Error al obtener certificados pendientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener certificados pendientes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * MANTENIMIENTO: Crear empresas faltantes de solicitudes ya asentadas
 * Útil para migrar solicitudes asentadas antes de implementar la creación automática
 */
export const crearEmpresasFaltantes = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario?.id || 1;

    // Buscar solicitudes ASENTADAS o superiores que no tienen empresa
    const solicitudesSinEmpresa = await prisma.solicitudRegistroInspeccion.findMany({
      where: {
        empresaId: null,
        estadoId: { gte: 4 } // ASENTADA o superior
      },
      include: {
        formulario: {
          include: {
            productos: {
              include: {
                campos: {
                  include: {
                    campo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (solicitudesSinEmpresa.length === 0) {
      return res.json({
        success: true,
        message: 'No hay solicitudes pendientes de crear empresa',
        data: { procesadas: 0, creadas: 0, actualizadas: 0, errores: 0 }
      });
    }

    // Obtener status ACTIVA
    const statusActiva = await prisma.statusInspeccion.findFirst({
      where: { nombre: 'ACTIVA' }
    });

    if (!statusActiva) {
      return res.status(500).json({
        success: false,
        message: 'No se encontró el status ACTIVA. Ejecuta el seed de la base de datos.'
      });
    }

    let creadas = 0;
    let actualizadas = 0;
    let errores = 0;
    const resultados = [];

    for (const solicitud of solicitudesSinEmpresa) {
      try {
        const formCampos = solicitud?.formulario?.productos?.[0]?.campos || [];
        const getCampoValue = (campoNombre: string) => {
          const campo = formCampos.find(c => c.campo.campo === campoNombre);
          return campo?.valor || null;
        };

        const fechaVenc = new Date();
        fechaVenc.setFullYear(fechaVenc.getFullYear() + 1);

        let empresaId: number | null = null;

        if (solicitud.tipoSolicitud === 'REGISTRO_NUEVO') {
          // Verificar si ya existe por RNC
          const empresaExistente = await prisma.empresaInspeccionada.findFirst({
            where: { rnc: solicitud.rnc }
          });

          if (empresaExistente) {
            empresaId = empresaExistente.id;
            actualizadas++;
            resultados.push({
              solicitud: solicitud.codigo,
              accion: 'vinculada',
              empresa: empresaExistente.nombreEmpresa
            });
          } else {
            // Crear nueva empresa
            const empresaCreada = await prisma.empresaInspeccionada.create({
              data: {
                nombreEmpresa: solicitud.nombreEmpresa!,
                nombreComercial: solicitud.nombreComercial || null,
                rnc: solicitud.rnc,
                direccion: getCampoValue('direccion') || 'N/A',
                telefono: getCampoValue('telefono') || 'N/A',
                fax: getCampoValue('fax'),
                email: getCampoValue('email') || 'N/A',
                paginaWeb: getCampoValue('paginaWeb'),
                categoriaIrcId: solicitud.categoriaIrcId,
                tipoPersona: getCampoValue('tipoPersona') || 'MORAL',
                nombrePropietario: getCampoValue('nombrePropietario'),
                cedulaPropietario: getCampoValue('cedulaPropietario'),
                descripcionActividades: getCampoValue('descripcionActividades') || 'N/A',
                provinciaId: getCampoValue('provincia') ? parseInt(getCampoValue('provincia')!) : null,
                personaContacto: getCampoValue('representanteLegal'),
                statusId: statusActiva.id,
                creadoPorId: usuarioId,
                registrado: true,
                existeEnSistema: true,
                fechaRegistro: solicitud.fechaAsentamiento || new Date(),
                fechaVencimiento: fechaVenc
              }
            });
            empresaId = empresaCreada.id;
            creadas++;
            resultados.push({
              solicitud: solicitud.codigo,
              accion: 'creada',
              empresa: empresaCreada.nombreEmpresa
            });
          }
        } else if (solicitud.tipoSolicitud === 'RENOVACION') {
          // Buscar empresa por RNC
          const empresaExistente = await prisma.empresaInspeccionada.findFirst({
            where: { rnc: solicitud.rnc }
          });

          if (empresaExistente) {
            empresaId = empresaExistente.id;
            // Actualizar renovación
            await prisma.empresaInspeccionada.update({
              where: { id: empresaId },
              data: {
                fechaRenovacion: solicitud.fechaAsentamiento || new Date(),
                fechaVencimiento: fechaVenc,
                statusId: statusActiva.id
              }
            });
            actualizadas++;
            resultados.push({
              solicitud: solicitud.codigo,
              accion: 'renovada',
              empresa: empresaExistente.nombreEmpresa
            });
          } else {
            errores++;
            resultados.push({
              solicitud: solicitud.codigo,
              accion: 'error',
              mensaje: 'No se encontró empresa para renovar'
            });
          }
        }

        // Vincular empresa a la solicitud
        if (empresaId) {
          await prisma.solicitudRegistroInspeccion.update({
            where: { id: solicitud.id },
            data: { empresaId }
          });
        }
      } catch (error) {
        errores++;
        resultados.push({
          solicitud: solicitud.codigo,
          accion: 'error',
          mensaje: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return res.json({
      success: true,
      message: 'Proceso de creación de empresas completado',
      data: {
        procesadas: solicitudesSinEmpresa.length,
        creadas,
        actualizadas,
        errores,
        detalles: resultados
      }
    });
  } catch (error) {
    console.error('Error al crear empresas faltantes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear empresas faltantes',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
