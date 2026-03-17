import { Response } from 'express';
import { prisma } from '../../config/database';
import { AppError, asyncHandler } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

// GET /api/cajas/cobros/pendientes
// Obtener TODOS los servicios pendientes de pago
export const getCobrosPendientes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Obtener caja activa del usuario para filtrar por sucursal
  const cajaActiva = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: { nombre: 'Abierta' }
    },
    include: {
      sucursal: true
    }
  });

  // Filtro por sucursal (solo si la caja tiene sucursal asignada)
  const filtroSucursal = cajaActiva?.sucursalId
    ? { sucursalId: cajaActiva.sucursalId }
    : {};

  // 1. Solicitudes IRC pendientes de pago (PENDIENTE_PAGO)
  const solicitudesIrc = await prisma.solicitudRegistroInspeccion.findMany({
    where: {
      estado: {
        nombre: 'PENDIENTE_PAGO'
      }
    },
    include: {
      estado: true,
      empresa: true
    },
    orderBy: { fechaRecepcion: 'desc' }
  });

  // 2. Denuncias pendientes de pago
  const denuncias = await prisma.denuncia.findMany({
    where: {
      estadoDenuncia: {
        nombre: 'PENDIENTE_PAGO'
      }
    },
    include: {
      estadoDenuncia: true
    },
    orderBy: { creadoEn: 'desc' }
  });

  // 3. Formularios pendientes de pago
  // Incluir: formularios sin factura O formularios con factura en estado Abierta
  const formularios = await prisma.formulario.findMany({
    where: {
      OR: [
        {
          // Formularios sin factura pero en estado pendiente
          AND: [
            {
              OR: [
                { estado: { nombre: 'PENDIENTE_PAGO' } },
                { estado: { nombre: 'PAGADO_PARCIAL' } }
              ]
            },
            { facturaId: null }
          ]
        },
        {
          // Formularios con factura en estado Abierta (IRC)
          factura: {
            estado: { nombre: 'Abierta' }
          }
        }
      ],
      produccionPadreId: null, // Excluir obras hijas de producciones
      ...filtroSucursal // Filtrar por sucursal de la caja activa
    },
    include: {
      estado: true,
      factura: {
        include: {
          estado: true,
          items: true
        }
      },
      productos: {
        include: {
          producto: true
        }
      },
      clientes: {
        include: {
          cliente: true
        }
      },
      solicitudIrc: {
        include: {
          empresa: true,
          categoriaIrc: true
        }
      },
      sucursal: true // Incluir info de sucursal
    },
    orderBy: { fecha: 'desc' }
  });

  // Formatear respuesta unificada
  const cobrosPendientes = [
    ...solicitudesIrc.map(sol => ({
      id: sol.id,
      tipo: 'IRC',
      subtipo: sol.tipoSolicitud, // REGISTRO_NUEVO o RENOVACION
      codigo: sol.codigo,
      fecha: sol.fechaRecepcion,
      descripcion: `${sol.tipoSolicitud} - ${sol.empresa?.nombreEmpresa || sol.nombreEmpresa || 'Sin empresa'}`,
      monto: sol.tipoSolicitud === 'REGISTRO_NUEVO' ? 5000 : 3000, // Precios según tipo
      cliente: sol.empresa?.nombreEmpresa || sol.nombreEmpresa || 'Sin empresa',
      rnc: sol.rnc,
      estado: sol.estado.nombre,
      data: sol
    })),
    ...denuncias.map(den => ({
      id: den.id,
      tipo: 'DENUNCIA',
      subtipo: 'Inspección de Parte',
      codigo: den.codigo,
      fecha: den.creadoEn,
      descripcion: `Denuncia contra ${den.empresaDenunciada}`,
      monto: 3000, // Precio fijo
      cliente: den.denuncianteNombre,
      rnc: null,
      estado: den.estadoDenuncia.nombre,
      data: den
    })),
    ...formularios.map(form => {
      const esProduccion = form.esProduccion;
      const tituloProduccion = form.tituloProduccion;
      const esIRC = !!form.solicitudIrc;

      // Si es IRC, usar datos de la solicitud IRC
      if (esIRC) {
        return {
          id: form.id,
          tipo: 'IRC',
          subtipo: form.solicitudIrc!.tipoSolicitud,
          codigo: form.codigo,
          fecha: form.fecha,
          descripcion: `${form.solicitudIrc!.tipoSolicitud} - ${form.solicitudIrc!.empresa?.nombreEmpresa || 'Sin empresa'}`,
          monto: form.factura ? Number(form.factura.total) : 0,
          cliente: form.solicitudIrc!.empresa?.nombreEmpresa || 'Sin empresa',
          rnc: form.solicitudIrc!.rnc,
          estado: form.factura?.estado.nombre || form.estado.nombre,
          data: form
        };
      }

      // Formulario normal de obra
      return {
        id: form.id,
        tipo: esProduccion ? 'PRODUCCIÓN' : 'FORMULARIO',
        subtipo: form.productos.map(p => p.producto.nombre).join(', '),
        codigo: form.codigo,
        fecha: form.fecha,
        descripcion: esProduccion
          ? `PRODUCCION: ${tituloProduccion}`
          : `Formulario ${form.codigo} - ${form.productos.length} obra(s)`,
        monto: Number(form.montoTotal),
        cliente: form.clientes[0]?.cliente?.nombrecompleto || 'Sin cliente',
        rnc: form.clientes[0]?.cliente?.rnc || null,
        estado: form.estado.nombre,
        data: form
      };
    })
  ];

  // Ordenar por fecha descendente
  cobrosPendientes.sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return fechaB - fechaA;
  });

  res.json({
    success: true,
    data: {
      total: cobrosPendientes.length,
      totalIrc: solicitudesIrc.length,
      totalDenuncias: denuncias.length,
      totalFormularios: formularios.length,
      montoTotal: cobrosPendientes.reduce((sum, c) => sum + c.monto, 0),
      cobros: cobrosPendientes
    }
  });
});

// POST /api/cajas/cobros/procesar
// Procesar pago de cualquier tipo de servicio
export const procesarCobro = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('=== INICIO PROCESAMIENTO COBRO ===');
  console.log('Tipo:', req.body.tipo);
  console.log('ItemId:', req.body.itemId);
  console.log('MetodoPago:', req.body.metodoPago);

  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  const {
    tipo, // 'IRC', 'DENUNCIA', 'FORMULARIO'
    itemId,
    metodoPago,
    referenciaPago,
    observaciones,
    requiereNCF,
    rnc
  } = req.body;

  if (!tipo || !itemId || !metodoPago) {
    throw new AppError('Tipo, itemId y metodoPago son requeridos', 400);
  }

  // Obtener caja activa del usuario
  const cajaActiva = await prisma.caja.findFirst({
    where: {
      usuarioId: req.usuario.id,
      estado: {
        nombre: 'Abierta'
      }
    }
  });

  if (!cajaActiva) {
    throw new AppError('No tienes una caja activa. Debes abrir una caja primero.', 400);
  }

  let factura;
  let monto = 0;
  let concepto = '';

  // Obtener estado "Abierta" de facturas (factura generada, pendiente de pago)
  const estadoAbierta = await prisma.facturaEstado.findFirst({
    where: { nombre: 'Abierta' }
  });

  if (!estadoAbierta) {
    throw new AppError('Estado Abierta no encontrado', 500);
  }

  // Generar código de factura
  // Con protección contra race conditions en concurrencia
  const generateCodigoFactura = async (): Promise<string> => {
    const now = new Date();
    const año = now.getFullYear();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const dia = now.getDate().toString().padStart(2, '0');
    const fecha = `${año}${mes}${dia}`;

    // Retry hasta 5 veces si hay colisión
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await prisma.factura.count({
        where: {
          fecha: {
            gte: new Date(año, now.getMonth(), now.getDate(), 0, 0, 0),
            lt: new Date(año, now.getMonth(), now.getDate() + 1, 0, 0, 0)
          }
        }
      });

      const numero = (count + 1 + attempt).toString().padStart(4, '0');
      const codigo = `FAC-${fecha}-${numero}`;

      // Verificar que no exista
      const existe = await prisma.factura.findUnique({
        where: { codigo }
      });

      if (!existe) {
        return codigo;
      }

      // Si existe, esperar un tiempo aleatorio antes de reintentar
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    // Fallback: usar timestamp
    const timestamp = Date.now().toString().slice(-4);
    return `FAC-${fecha}-${timestamp}`;
  };

  // Generar NCF si se requiere (solo si requiereNCF es true)
  // Con protección contra race conditions usando transacción y locking
  const generateNCF = async (tipoComprobante: string = 'B01'): Promise<string | null> => {
    // Usar transacción con serializable isolation para evitar race conditions
    return await prisma.$transaction(async (tx) => {
      // Buscar todas las secuencias activas de este tipo
      // Usar SELECT FOR UPDATE para bloquear la fila durante la transacción
      const secuencias = await tx.$queryRaw<any[]>`
        SELECT * FROM "secuencias_ncf"
        WHERE "tipoComprobante" = ${tipoComprobante}
          AND "activo" = true
          AND "fecha_vencimiento" >= NOW()
        ORDER BY "fecha_vencimiento" DESC
        FOR UPDATE
      `;

      // Encontrar la primera secuencia que aún tenga números disponibles
      let secuenciaDisponible = null;
      for (const sec of secuencias) {
        if (Number(sec.numero_actual) < Number(sec.numero_final)) {
          secuenciaDisponible = sec;
          break;
        }
      }

      if (!secuenciaDisponible) {
        throw new AppError(`No hay secuencias NCF activas disponibles para ${tipoComprobante}`, 400);
      }

      const numeroActual = Number(secuenciaDisponible.numero_actual) + 1;
      const ncf = `${secuenciaDisponible.serie}${secuenciaDisponible.tipoComprobante}${numeroActual.toString().padStart(8, '0')}`;

      // Actualizar el número actual dentro de la misma transacción
      await tx.secuenciaNcf.update({
        where: { id: secuenciaDisponible.id },
        data: { numeroActual: BigInt(numeroActual) }
      });

      return ncf;
    }, {
      isolationLevel: 'Serializable', // Nivel más alto de aislamiento
      timeout: 10000 // 10 segundos timeout
    });
  };

  console.log('Generando código de factura...');
  const codigo = await generateCodigoFactura();
  console.log('Código generado:', codigo);

  let ncf: string | null = null;

  if (requiereNCF) {
    console.log('NCF requerido, generando...');
    if (!rnc) {
      throw new AppError('RNC requerido para emitir NCF', 400);
    }
    ncf = await generateNCF('B01');
    console.log('NCF generado:', ncf);
  }

  console.log('Procesando tipo:', tipo);

  // Procesar según tipo
  switch (tipo) {
    case 'IRC': {
      // itemId es el ID del formulario, no de la solicitud
      const formulario = await prisma.formulario.findUnique({
        where: { id: itemId },
        include: {
          solicitudIrc: {
            include: {
              empresa: true,
              estado: true,
              categoriaIrc: true
            }
          },
          factura: {
            include: {
              items: true,
              estado: true
            }
          }
        }
      });

      if (!formulario || !formulario.solicitudIrc) {
        throw new AppError('Formulario IRC no encontrado', 404);
      }

      const solicitud = formulario.solicitudIrc;

      // La factura ya existe, fue creada al enviar a caja
      if (!formulario.factura) {
        throw new AppError('Factura no encontrada para esta solicitud IRC', 404);
      }

      factura = formulario.factura;

      // Verificar que la factura esté en estado Abierta
      if (factura.estado.nombre !== 'Abierta') {
        throw new AppError('Esta factura ya fue procesada', 400);
      }

      monto = Number(factura.total);
      concepto = `Solicitud IRC ${solicitud.codigo} - ${solicitud.tipoSolicitud}`;

      // Obtener estado "Pagada" de facturas
      const estadoPagada = await prisma.facturaEstado.findFirst({
        where: { nombre: 'Pagada' }
      });

      if (!estadoPagada) {
        throw new AppError('Estado Pagada no encontrado', 500);
      }

      // Actualizar la factura existente con los datos de pago
      factura = await prisma.factura.update({
        where: { id: factura.id },
        data: {
          estadoId: estadoPagada.id,
          metodoPago,
          referenciaPago: referenciaPago || null,
          ncf,
          rnc: rnc || null,
          fechaPago: new Date(),
          pagado: monto,
          observaciones: observaciones || factura.observaciones
        },
        include: { items: true, estado: true }
      });

      // Actualizar estado de la solicitud IRC a PAGADA
      const estadoSolicitudPagada = await prisma.estadoSolicitudInspeccion.findFirst({
        where: { nombre: 'PAGADA' }
      });

      if (!estadoSolicitudPagada) {
        throw new AppError('Estado PAGADA de solicitud no encontrado', 500);
      }

      await prisma.solicitudRegistroInspeccion.update({
        where: { id: solicitud.id },
        data: {
          estadoId: estadoSolicitudPagada.id,
          fechaPago: new Date()
        }
      });

      // Actualizar estado del formulario a PAGADO
      const estadoFormularioPagado = await prisma.formularioEstado.findFirst({
        where: { nombre: 'PAGADO' }
      });

      if (estadoFormularioPagado) {
        await prisma.formulario.update({
          where: { id: formulario.id },
          data: { estadoId: estadoFormularioPagado.id }
        });
      }

      break;
    }

    case 'DENUNCIA': {
      console.log('Caso DENUNCIA, buscando denuncia ID:', itemId);
      const denuncia = await prisma.denuncia.findUnique({
        where: { id: itemId },
        include: { estadoDenuncia: true }
      });

      console.log('Denuncia encontrada:', denuncia ? denuncia.codigo : 'NO ENCONTRADA');

      if (!denuncia) {
        throw new AppError('Denuncia no encontrada', 404);
      }

      if (denuncia.estadoDenuncia.nombre !== 'PENDIENTE_PAGO') {
        throw new AppError('Esta denuncia ya fue pagada', 400);
      }

      monto = 3000;

      // Si la caja es gratuita (periodo de gracia), el monto es 0
      if (cajaActiva.esGratuita) {
        monto = 0;
      }

      concepto = `Denuncia ${denuncia.codigo}`;

      console.log('Creando factura para denuncia...');
      console.log('Datos:', { codigo, monto, concepto, cajaId: cajaActiva.id });

      // Crear factura
      factura = await prisma.factura.create({
        data: {
          codigo,
          fecha: new Date(),
          total: monto,
          itbis: 0,
          subtotal: monto,
          estadoId: estadoAbierta.id,
          metodoPago,
          referenciaPago: referenciaPago || null,
          ncf,
          rnc: rnc || null,
          observaciones: observaciones || null,
          cajaId: cajaActiva.id,
          items: {
            create: [
              {
                concepto,
                cantidad: 1,
                precioUnitario: monto,
                subtotal: monto,
                itbis: 0,
                total: monto
              }
            ]
          }
        },
        include: { items: true, estado: true }
      });

      // Actualizar denuncia a PAGADA
      const estadoPagada = await prisma.estadoDenuncia.findFirst({
        where: { nombre: 'PAGADA' }
      });

      await prisma.denuncia.update({
        where: { id: itemId },
        data: {
          estadoDenunciaId: estadoPagada!.id,
          facturaId: factura.id
        }
      });

      break;
    }

    case 'FORMULARIO': {
      const formulario = await prisma.formulario.findUnique({
        where: { id: itemId },
        include: {
          estado: true,
          productos: {
            include: {
              producto: true,
              campos: {
                include: {
                  campo: true
                }
              }
            }
          }
        }
      });

      if (!formulario) {
        throw new AppError('Formulario no encontrado', 404);
      }

      if (!['PENDIENTE_PAGO', 'PAGADO_PARCIAL'].includes(formulario.estado.nombre)) {
        throw new AppError('Este formulario ya fue pagado', 400);
      }

      monto = Number(formulario.montoTotal);

      // Si la caja es gratuita (periodo de gracia), el monto es 0
      if (cajaActiva.esGratuita) {
        monto = 0;
      }

      concepto = `Formulario ${formulario.codigo}`;

      // Obtener estado Pagada para la factura
      const estadoFacturaPagada = await prisma.facturaEstado.findFirst({
        where: { nombre: 'Pagada' }
      });

      if (!estadoFacturaPagada) {
        throw new AppError('Estado Pagada no encontrado', 500);
      }

      // Crear factura
      factura = await prisma.factura.create({
        data: {
          codigo,
          fecha: new Date(),
          total: monto,
          itbis: 0,
          subtotal: monto,
          pagado: monto, // Monto pagado
          fechaPago: new Date(), // Fecha del pago
          estadoId: estadoFacturaPagada.id, // Estado Pagada
          metodoPago,
          referenciaPago: referenciaPago || null,
          ncf,
          rnc: rnc || null,
          observaciones: observaciones || null,
          cajaId: cajaActiva.id,
          items: {
            create: formulario.productos.map(p => ({
              concepto: p.producto.nombre,
              cantidad: 1,
              precioUnitario: Number(formulario.montoTotal) / formulario.productos.length,
              subtotal: Number(formulario.montoTotal) / formulario.productos.length,
              itbis: 0,
              total: Number(formulario.montoTotal) / formulario.productos.length
            }))
          }
        },
        include: { items: true, estado: true }
      });

      // Actualizar formulario a PAGADO
      const estadoPagado = await prisma.formularioEstado.findFirst({
        where: { nombre: 'PAGADO' }
      });

      await prisma.formulario.update({
        where: { id: itemId },
        data: {
          estadoId: estadoPagado!.id,
          facturaId: factura.id
        }
      });

      // CREAR REGISTROS AUTOMÁTICAMENTE
      // Obtener estado PENDIENTE_ASENTAMIENTO
      const estadoPendienteAsentamiento = await prisma.registroEstado.findFirst({
        where: { nombre: 'PENDIENTE_ASENTAMIENTO' }
      });

      if (estadoPendienteAsentamiento) {
        // Crear un registro por cada producto (obra) en el formulario
        for (const producto of formulario.productos) {
          // Buscar campo "titulo" en los campos del producto para obtener el título REAL
          const campoTituloObra = producto.campos?.find(c =>
            c.campo.campo.toLowerCase().includes('titulo') ||
            c.campo.campo.toLowerCase().includes('título')
          );

          // Buscar campo de subtipo - puede ser "tipo_obra" o "subcategoria" dependiendo del producto
          const campoSubtipo = producto.campos?.find(c =>
            c.campo.campo === 'tipo_obra' || c.campo.campo === 'subcategoria'
          );

          // DEBUG: Ver todos los campos disponibles
          console.log('🔍 COBROS - Campos disponibles en producto:', producto.campos?.map(c => ({
            campo: c.campo.campo,
            valor: c.valor
          })));
          console.log('🔍 COBROS - Campo subtipo encontrado:', campoSubtipo ? {
            campo: campoSubtipo.campo.campo,
            valor: campoSubtipo.valor
          } : 'NO ENCONTRADO');

          // Normalizar a mayúsculas para consistencia en certificados
          const tituloObra = (campoTituloObra?.valor || `${producto.producto.nombre} - Formulario ${formulario.codigo}`).toUpperCase();
          const subtipoObra = campoSubtipo?.valor ? campoSubtipo.valor.toUpperCase() : null;

          console.log('🔍 COBROS - subtipoObra final:', subtipoObra);

          // Para tipoObra: usar categoría general en lugar del nombre del producto
          const categoriaMap: Record<string, string> = {
            'Literaria': 'OBRA LITERARIA',
            'Musical': 'OBRA MUSICAL',
            'Audiovisual': 'OBRA AUDIOVISUAL',
            'Artes Visuales': 'OBRA DE ARTES VISUALES',
            'Escénica': 'OBRA ESCÉNICA',
            'Científica': 'OBRA CIENTÍFICA',
            'Arte Aplicado': 'OBRA DE ARTE APLICADO',
            'ACTOS_CONTRATOS': 'ACTO O CONTRATO',
            'PRODUCCIONES': 'PRODUCCIÓN',
            'Inspectoría': 'INSCRIPCIÓN IRC'
          };

          const tipoObraCategoria = categoriaMap[producto.producto.categoria] || producto.producto.categoria.toUpperCase();

          // Generar número de registro
          const anioActual = new Date().getFullYear();
          const mesActual = (new Date().getMonth() + 1).toString().padStart(2, '0');

          const secuencia = await prisma.secuenciaRegistro.upsert({
            where: { anio: anioActual },
            update: { secuencia: { increment: 1 } },
            create: { anio: anioActual, secuencia: 1 }
          });

          const numeroSecuencial = secuencia.secuencia.toString().padStart(8, '0');
          const numeroRegistro = `${numeroSecuencial}/${mesActual}/${anioActual}`;

          // Crear registro (sin fechaAsentamiento todavía, se asigna al asentar)
          await prisma.registro.create({
            data: {
              numeroRegistro,
              formularioProductoId: producto.id,
              tipoObra: tipoObraCategoria,
              subtipoObra,
              tituloObra,
              estadoId: estadoPendienteAsentamiento.id,
              usuarioAsentamientoId: req.usuario!.id
            }
          });
        }
      }

      break;
    }

    case 'PRODUCCIÓN': {
      // Las producciones se procesan exactamente igual que los formularios
      const formulario = await prisma.formulario.findUnique({
        where: { id: itemId },
        include: {
          estado: true,
          productos: {
            include: {
              producto: true,
              campos: {
                include: {
                  campo: true
                }
              }
            }
          },
          obrasHijas: {
            include: {
              productos: {
                include: {
                  producto: true,
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

      if (!formulario) {
        throw new AppError('Producción no encontrada', 404);
      }

      if (!['PENDIENTE_PAGO', 'PAGADO_PARCIAL'].includes(formulario.estado.nombre)) {
        throw new AppError('Esta producción ya fue pagada', 400);
      }

      monto = Number(formulario.montoTotal);

      // Si la caja es gratuita (periodo de gracia), el monto es 0
      if (cajaActiva.esGratuita) {
        monto = 0;
      }

      concepto = `PRODUCCION: ${formulario.tituloProduccion} (${formulario.obrasHijas.length} obras)`;

      // Obtener estado Pagada para la factura
      const estadoFacturaPagada = await prisma.facturaEstado.findFirst({
        where: { nombre: 'Pagada' }
      });

      if (!estadoFacturaPagada) {
        throw new AppError('Estado Pagada no encontrado', 500);
      }

      // Crear factura
      factura = await prisma.factura.create({
        data: {
          codigo,
          fecha: new Date(),
          total: monto,
          itbis: 0,
          subtotal: monto,
          pagado: monto, // Monto pagado
          fechaPago: new Date(), // Fecha del pago
          estadoId: estadoFacturaPagada.id,
          metodoPago,
          referenciaPago: referenciaPago || null,
          ncf,
          rnc: rnc || null,
          observaciones: observaciones || null,
          cajaId: cajaActiva.id,
          items: {
            create: [
              {
                concepto,
                cantidad: 1,
                precioUnitario: monto,
                subtotal: monto,
                itbis: 0,
                total: monto
              }
            ]
          }
        },
        include: { items: true, estado: true }
      });

      // Actualizar el formulario padre a PAGADO
      const estadoPagado = await prisma.formularioEstado.findFirst({
        where: { nombre: 'PAGADO' }
      });

      await prisma.formulario.update({
        where: { id: formulario.id },
        data: {
          estadoId: estadoPagado!.id,
          facturaId: factura.id
        }
      });

      // Actualizar todas las obras hijas a PAGADO también
      await prisma.formulario.updateMany({
        where: { produccionPadreId: formulario.id },
        data: {
          estadoId: estadoPagado!.id,
          facturaId: factura.id
        }
      });

      // Obtener estado PENDIENTE_ASENTAMIENTO para Registro
      const estadoPendienteAsentamiento = await prisma.registroEstado.findFirst({
        where: { nombre: 'PENDIENTE_ASENTAMIENTO' }
      });

      if (!estadoPendienteAsentamiento) {
        throw new AppError('Estado PENDIENTE_ASENTAMIENTO no encontrado en Registro', 500);
      }

      // Crear registros para CADA OBRA HIJA (no para el padre)
      for (const obraHija of formulario.obrasHijas) {
        for (const producto of obraHija.productos) {
          // DEBUG: Ver todos los campos disponibles
          console.log('=== CAMPOS DISPONIBLES PARA OBRA ===');
          producto.campos.forEach(c => {
            console.log(`Campo: "${c.campo.campo}" | Título: "${c.campo.titulo}" | Valor: "${c.valor}"`);
          });

          // Extraer título de la obra de los campos
          let tituloObra = `Obra de ${formulario.tituloProduccion}`;
          const campoTitulo = producto.campos.find(c => {
            const campo = c.campo.campo.toLowerCase();
            const titulo = c.campo.titulo?.toLowerCase() || '';
            return campo.includes('titulo') || titulo.includes('titulo') || campo === 'titulo';
          });

          console.log('Campo encontrado:', campoTitulo ? `"${campoTitulo.campo.campo}" = "${campoTitulo.valor}"` : 'NINGUNO');

          if (campoTitulo && campoTitulo.valor) {
            tituloObra = campoTitulo.valor;
          }

          console.log('Título final asignado:', tituloObra);
          console.log('=====================================');

          // Buscar campo de subtipo - puede ser "tipo_obra" o "subcategoria" dependiendo del producto
          const campoSubtipo = producto.campos.find(c =>
            c.campo.campo === 'tipo_obra' || c.campo.campo === 'subcategoria'
          );

          // Normalizar a mayúsculas para consistencia en certificados
          tituloObra = tituloObra.toUpperCase();
          const subtipoObra = campoSubtipo?.valor ? campoSubtipo.valor.toUpperCase() : null;

          // Para tipoObra: usar categoría general en lugar del nombre del producto
          const categoriaMap: Record<string, string> = {
            'Literaria': 'OBRA LITERARIA',
            'Musical': 'OBRA MUSICAL',
            'Audiovisual': 'OBRA AUDIOVISUAL',
            'Artes Visuales': 'OBRA DE ARTES VISUALES',
            'Escénica': 'OBRA ESCÉNICA',
            'Científica': 'OBRA CIENTÍFICA',
            'Arte Aplicado': 'OBRA DE ARTE APLICADO',
            'ACTOS_CONTRATOS': 'ACTO O CONTRATO',
            'PRODUCCIONES': 'PRODUCCIÓN',
            'Inspectoría': 'INSCRIPCIÓN IRC'
          };

          const tipoObraCategoria = categoriaMap[producto.producto.categoria] || producto.producto.categoria.toUpperCase();

          // Generar número de registro
          const anioActual = new Date().getFullYear();
          const mesActual = (new Date().getMonth() + 1).toString().padStart(2, '0');

          const secuencia = await prisma.secuenciaRegistro.upsert({
            where: { anio: anioActual },
            update: { secuencia: { increment: 1 } },
            create: { anio: anioActual, secuencia: 1 }
          });

          const numeroSecuencial = secuencia.secuencia.toString().padStart(8, '0');
          const numeroRegistro = `${numeroSecuencial}/${mesActual}/${anioActual}`;

          await prisma.registro.create({
            data: {
              numeroRegistro,
              formularioProductoId: producto.id,
              tipoObra: tipoObraCategoria,
              subtipoObra,
              tituloObra,
              estadoId: estadoPendienteAsentamiento.id,
              usuarioAsentamientoId: req.usuario!.id
            }
          });
        }
      }

      break;
    }

    default:
      throw new AppError('Tipo de cobro no válido', 400);
  }

  console.log('=== COBRO PROCESADO EXITOSAMENTE ===');
  console.log('Factura ID:', factura.id);
  console.log('Código factura:', factura.codigo);

  res.json({
    success: true,
    message: 'Pago procesado exitosamente',
    data: {
      factura,
      tipo,
      itemId,
      monto,
      concepto
    }
  });
});

// GET /api/cajas/cobros/historial
// Obtener historial de cobros procesados (últimos 100)
export const getHistorialCobros = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.usuario) {
    throw new AppError('No autenticado', 401);
  }

  // Parámetros de consulta
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  // Filtros de fecha
  const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined;
  const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined;

  // Búsqueda
  const busqueda = req.query.busqueda as string;

  // Construir filtros - Mostrar todas las facturas pagadas del sistema
  const where: any = {
    estado: {
      nombre: 'Pagada'
    }
  };

  // Filtro de fechas
  if (fechaInicio || fechaFin) {
    where.fecha = {};
    if (fechaInicio) {
      where.fecha.gte = fechaInicio;
    }
    if (fechaFin) {
      // Agregar 1 día para incluir todo el día final
      const fechaFinConHora = new Date(fechaFin);
      fechaFinConHora.setHours(23, 59, 59, 999);
      where.fecha.lte = fechaFinConHora;
    }
  }

  // DEBUG: Log de filtros
  console.log('═══════════════════════════════════════');
  console.log('DEBUG - Historial de Cobros');
  console.log('Usuario ID:', req.usuario.id);
  console.log('Página:', page);
  console.log('Límite:', limit);
  console.log('Fecha Inicio:', fechaInicio);
  console.log('Fecha Fin:', fechaFin);
  console.log('Filtro WHERE:', JSON.stringify(where, null, 2));

  // Contar total de facturas
  const total = await prisma.factura.count({ where });
  console.log('Total facturas encontradas:', total);

  // Obtener facturas con paginación
  const facturas = await prisma.factura.findMany({
    where,
    include: {
      items: true,
      estado: true,
      caja: {
        include: {
          usuario: true
        }
      },
      solicitudInspeccion: {
        include: {
          empresa: true
        }
      },
      denuncia: true,
      formularios: {
        include: {
          clientes: {
            include: {
              cliente: true
            }
          }
        }
      }
    },
    orderBy: { fecha: 'desc' },
    skip,
    take: limit
  });

  // Transformar a formato de cobros
  const historial = facturas.map(factura => {
    let tipo: 'IRC' | 'DENUNCIA' | 'FORMULARIO' = 'FORMULARIO';
    let subtipo = '';
    let codigo = factura.codigo;
    let descripcion = '';
    let cliente = 'N/A';

    if (factura.solicitudInspeccion) {
      tipo = 'IRC';
      subtipo = factura.solicitudInspeccion.tipoSolicitud || 'Registro';
      codigo = factura.solicitudInspeccion.codigo;
      descripcion = `Solicitud IRC - ${factura.solicitudInspeccion.empresa?.nombreComercial || 'N/A'}`;
      cliente = factura.solicitudInspeccion.empresa?.nombreComercial || 'N/A';
    } else if (factura.denuncia) {
      tipo = 'DENUNCIA';
      subtipo = 'Inspección';
      codigo = factura.denuncia.codigo;
      descripcion = `Denuncia - ${factura.denuncia.empresaDenunciada}`;
      cliente = factura.denuncia.denuncianteNombre;
    } else if (factura.formularios.length > 0) {
      tipo = 'FORMULARIO';
      const formulario = factura.formularios[0];
      codigo = formulario.codigo;
      descripcion = `Formulario de Obras`;
      cliente = formulario.clientes[0]?.cliente?.nombrecompleto || 'N/A';
    }

    return {
      id: factura.id,
      tipo,
      subtipo,
      codigo,
      fecha: factura.fecha.toISOString(),
      descripcion,
      monto: Number(factura.total),
      cliente,
      rnc: factura.rnc,
      estado: factura.estado.nombre,
      metodoPago: factura.metodoPago || 'N/A',
      ncf: factura.ncf || null,
      facturaId: factura.id
    };
  });

  // Calcular estadísticas del historial (de toda la consulta, no solo la página actual)
  const totalIrc = historial.filter(h => h.tipo === 'IRC').length;
  const totalDenuncias = historial.filter(h => h.tipo === 'DENUNCIA').length;
  const totalFormularios = historial.filter(h => h.tipo === 'FORMULARIO').length;
  const montoTotal = historial.reduce((sum, h) => sum + h.monto, 0);

  res.json({
    success: true,
    data: {
      historial,
      total,
      totalPagina: historial.length,
      totalIrc,
      totalDenuncias,
      totalFormularios,
      montoTotal,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});
