import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearNombre } from '../utils/formatNombres';

interface CertificadoRegistroData {
  numeroRegistro: string;
  tituloObra: string;
  tipoObra: string;
  subtipoObra?: string | null;
  fechaAsentamiento: Date | null;
  libroNumero?: number | null;
  hojaNumero?: number | null;
  clientes: Array<{
    nombrecompleto: string;
    identificacion: string;
    rnc?: string | null;
    direccion?: string | null;
    tipoRelacion: string; // AUTOR, TITULAR, REPRESENTANTE, INTÉRPRETE
    esPrincipal: boolean; // Para encabezado del certificado
  }>;
  campos?: Array<{
    campo: { campo: string };
    valor: string;
  }>;
}

export async function generarCertificadoRegistro(
  registroId: number,
  data: CertificadoRegistroData
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificados-registro');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `certificado-${registroId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ==========================================
      // LOGO ONDA (CENTRADO)
      // ==========================================

      const assetsDir = path.join(process.cwd(), 'public', 'assets');

      // Logo ONDA centrado
      const logoONDA = path.join(assetsDir, 'ONDA_solo_logo.png');
      if (fs.existsSync(logoONDA)) {
        doc.image(logoONDA, 256, 50, { width: 100 }); // Centrado
      }

      // ==========================================
      // TÍTULOS PRINCIPALES
      // ==========================================

      let yPos = 175;

      doc.fontSize(11).font('Times-Bold').fillColor('#000000')
        .text('REPÚBLICA DOMINICANA', 60, yPos, { align: 'center', width: 492 });

      yPos += 20;
      doc.fontSize(10).font('Times-Roman')
        .text('MINISTERIO DE INDUSTRIA, COMERCIO Y MIPYMES', 60, yPos, { align: 'center', width: 492 });

      yPos += 18;
      doc.fontSize(11).font('Times-Bold')
        .text('OFICINA NACIONAL DE DERECHO DE AUTOR', 60, yPos, { align: 'center', width: 492 });

      yPos += 35;
      doc.fontSize(14).font('Times-Bold').fillColor('#666666')
        .text('CERTIFICADO DE REGISTRO', 60, yPos, { align: 'center', width: 492 });

      // ==========================================
      // CAMPOS DEL CERTIFICADO (FORMATO OFICIAL)
      // ==========================================

      yPos = yPos + 50;
      doc.fillColor('#000000');

      // Obtener cliente principal para el encabezado
      const clientePrincipal = data.clientes.find(c => c.esPrincipal) || data.clientes[0];
      const autores = data.clientes.filter(c => c.tipoRelacion.toUpperCase() === 'AUTOR');
      const titulares = data.clientes.filter(c => c.tipoRelacion.toUpperCase() === 'TITULAR');

      // Título de la obra (ya viene en mayúsculas desde la BD)
      doc.fontSize(11).font('Times-Roman').text('Título de la obra: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text(data.tituloObra || '');
      yPos += 25;

      // Autor(es) - mostrar todos los autores separados por comas
      if (autores.length > 0) {
        const nombresAutores = autores.map(a => a.nombrecompleto.toUpperCase()).join(', ');
        doc.font('Times-Roman').text('Autor (es): ', 60, yPos, { continued: true });
        doc.font('Times-Bold').text(nombresAutores);
        yPos += 25;
      }

      // Documento de identidad (del cliente principal)
      if (clientePrincipal) {
        doc.font('Times-Roman').text('Documento de identidad: ', 60, yPos, { continued: true });
        doc.font('Times-Bold').text((clientePrincipal.identificacion || '').toUpperCase());
        yPos += 25;
      }

      // Tipo de obra - Mostrar subtipo específico si existe, sino mostrar tipo genérico
      doc.font('Times-Roman').text('Tipo de obra: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((data.subtipoObra || data.tipoObra || '').toUpperCase());
      yPos += 25;

      // Titular(es) - mostrar todos los titulares separados por comas
      if (titulares.length > 0) {
        const nombresTitulares = titulares.map(t => t.nombrecompleto.toUpperCase()).join(', ');
        doc.font('Times-Roman').text('Titular (es): ', 60, yPos, { continued: true });
        doc.font('Times-Bold').text(nombresTitulares);
        yPos += 25;
      }

      // Descripción de la Obra
      const descripcion = data.campos?.find(c =>
        c.campo?.campo?.toLowerCase().includes('descripcion') ||
        c.campo?.campo?.toLowerCase().includes('resumen')
      )?.valor || '';
      doc.font('Times-Roman').text('Descripción de la Obra: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text(descripcion.toUpperCase(), { width: 492, align: 'justify' });

      // Calcular espacio usado por la descripcion (aprox 14px por linea)
      const lineasDescripcion = Math.ceil(descripcion.length / 80);
      yPos += 25 + (lineasDescripcion * 14);

      // ==========================================
      // CLIENTES Y ROLES (CUERPO DEL CERTIFICADO)
      // ==========================================

      yPos += 20;

      // Agrupar clientes por rol
      const clientesPorRol: { [key: string]: typeof data.clientes } = {};
      data.clientes.forEach(cliente => {
        const rol = cliente.tipoRelacion.toUpperCase();
        if (!clientesPorRol[rol]) {
          clientesPorRol[rol] = [];
        }
        clientesPorRol[rol].push(cliente);
      });

      // Renderizar cada grupo de roles
      for (const [rol, clientes] of Object.entries(clientesPorRol)) {
        const rolesPlural: { [key: string]: string } = {
          'AUTOR': 'AUTOR(ES)',
          'AUTOR_PRINCIPAL': 'AUTOR(ES) PRINCIPAL(ES)',
          'TITULAR': 'TITULAR(ES)',
          'INTÉRPRETE': 'INTÉRPRETE(S)',
          'REPRESENTANTE': 'REPRESENTANTE(S)'
        };

        const rolFormateado = formatearNombre(rol);
        doc.fontSize(10).font('Times-Bold').text(rolesPlural[rol] || `${rolFormateado.toUpperCase()}(ES):`, 60, yPos);
        yPos += 15;

        clientes.forEach(cliente => {
          doc.fontSize(9).font('Times-Roman')
            .text(cliente.nombrecompleto.toUpperCase(), 60, yPos, { continued: true })
            .font('Times-Bold')
            .text(` ${rolFormateado.toUpperCase()} NAC. DOMINICANA `, { continued: true })
            .font('Times-Roman')
            .text(`cédula de identidad: ${cliente.identificacion}`);
          yPos += 15;
        });

        yPos += 15;
      }

      // Solo mostrar REPRESENTANTE DE INSTITUCIÓN si hay institución (RNC)
      const primerCliente = clientePrincipal || data.clientes[0];
      const hayInstitucion = primerCliente?.rnc != null;
      const representantes = clientesPorRol['REPRESENTANTE'] || [];

      if (hayInstitucion && representantes.length > 0) {
        doc.fontSize(9).font('Times-Roman').text(
          `LA(S) SIGUIENTE(S) PERSONA(S) ACTÚAN EN REPRESENTACIÓN DE LA INSTITUCIÓN.`,
          60, yPos, { width: 492, align: 'justify' }
        );
        yPos += 20;

        representantes.forEach(rep => {
          doc.text(
            `${rep.nombrecompleto.toUpperCase()} NACIONALIDAD DOMINICANA, cédula de identidad ${rep.identificacion}`,
            60, yPos, { width: 492, align: 'justify' }
          );
          yPos += 15;
        });

        yPos += 20;
      }

      // ==========================================
      // TEXTO LEGAL
      // ==========================================

      const partes = data.numeroRegistro.split('/');
      const numeroSecuencial = partes[0] || '__________';
      const libro = data.libroNumero || '__________';
      const fechaInscripcion = data.fechaAsentamiento
        ? format(new Date(data.fechaAsentamiento), "dd/MM/yyyy")
        : '__________';

      doc.fontSize(9).font('Times-Roman').text(
        `Las inscripciones efectuadas en el Registro Nacional de Derecho de Autor surtirán eficacia desde la fecha de recepción de la solicitud, debidamente suscrita por el solicitante, con el número de registro `,
        60, yPos, { width: 492, align: 'justify', continued: true }
      )
      .font('Times-Bold').text(numeroSecuencial, { continued: true })
      .font('Times-Roman').text(' en libro ', { continued: true })
      .font('Times-Bold').text(`${libro}`, { continued: true })
      .font('Times-Roman').text(' en la fecha de inscripción ', { continued: true })
      .font('Times-Bold').text(fechaInscripcion, { continued: true })
      .font('Times-Roman').text(', conforme a lo establecido en el Artículo 61 del Reglamento de Aplicación No. 362-01 de la Ley 65-00 Sobre Derecho de Autor.');

      yPos += 60;

      // ==========================================
      // FECHA DE EXPEDICIÓN
      // ==========================================

      const diaNum = format(new Date(), 'd');
      const diaTexto = format(new Date(), 'EEEE', { locale: es }); // lunes, martes, etc.
      const mes = format(new Date(), 'MMMM', { locale: es });
      const anio = format(new Date(), 'yyyy');

      doc.fontSize(9).font('Times-Roman').text(
        `Se expide en Santo Domingo, Distrito Nacional, Capital de la República Dominicana, hoy día `,
        60, yPos, { width: 492, align: 'justify', continued: true }
      )
      .font('Times-Bold').text(diaTexto, { continued: true })
      .font('Times-Roman').text(` (${diaNum}) del mes de `, { continued: true })
      .font('Times-Bold').text(mes, { continued: true })
      .font('Times-Roman').text(' del año ', { continued: true })
      .font('Times-Bold').text(`${anio}`, { continued: true })
      .font('Times-Roman').text('.');

      yPos += 50;

      // ==========================================
      // PIE DE PÁGINA
      // ==========================================

      doc.fontSize(9).font('Times-Roman').text(
        'El presente es expedido a los fines descritos en los Arts. 57 y 58 del Reglamento de Aplicación de la Ley 65-00 No. 362-01 del 14 de marzo del 2001.',
        60, 720, { width: 492, align: 'left' }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/certificados-registro/${fileName}`);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// ==========================================
// GENERAR CERTIFICADO DE PRODUCCIÓN
// ==========================================

interface ObraProduccion {
  numeroRegistro: string;
  tituloObra: string;
}

interface CertificadoProduccionData {
  tituloProduccion: string;
  tipoObra: string;
  fechaAsentamiento: Date | null;
  libroNumero?: number | null;
  numeroRegistroPrimero?: string;
  clientes: Array<{
    nombrecompleto: string;
    identificacion: string;
    rnc?: string | null;
    direccion?: string | null;
    tipoRelacion: string; // AUTOR, TITULAR, REPRESENTANTE, INTÉRPRETE
  }>;
  obras: ObraProduccion[];
}

export async function generarCertificadoProduccion(
  produccionId: number,
  data: CertificadoProduccionData
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificados-registro');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `certificado-produccion-${produccionId}-${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 80, left: 60, right: 60 }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ==========================================
      // TÍTULOS PRINCIPALES (SIN LOGO - viene en papel timbrado)
      // ==========================================

      let yPos = 50;

      doc.fontSize(11).font('Times-Bold').fillColor('#000000')
        .text('REPÚBLICA DOMINICANA', 60, yPos, { align: 'center', width: 492 });

      yPos += 18;
      doc.fontSize(10).font('Times-Roman')
        .text('MINISTERIO DE INDUSTRIA, COMERCIO Y MIPYMES', 60, yPos, { align: 'center', width: 492 });

      yPos += 18;
      doc.fontSize(11).font('Times-Bold')
        .text('OFICINA NACIONAL DE DERECHO DE AUTOR', 60, yPos, { align: 'center', width: 492 });

      yPos += 30;
      doc.fontSize(14).font('Times-Bold').fillColor('#666666')
        .text('CERTIFICADO DE REGISTRO', 60, yPos, { align: 'center', width: 492 });

      // ==========================================
      // PÁRRAFO INICIAL
      // ==========================================

      yPos += 30;
      doc.fillColor('#000000');

      // Obtener datos de fecha y hora
      const fechaAsentamiento = data.fechaAsentamiento ? new Date(data.fechaAsentamiento) : new Date();
      const dia = format(fechaAsentamiento, 'dd');
      const mes = format(fechaAsentamiento, 'MM');
      const anio = format(fechaAsentamiento, 'yyyy');
      const hora = format(fechaAsentamiento, 'hh:mm a').toUpperCase();

      // Obtener el primer cliente (puede ser AUTOR, TITULAR, etc)
      const primerCliente = data.clientes && data.clientes.length > 0 ? data.clientes[0] : null;

      // Texto del titular/autor: si tiene RNC es institución, sino es persona física
      const titularInfo = primerCliente?.rnc
        ? `${primerCliente.nombrecompleto.toUpperCase()}, INSTITUCION DOMINICANA. RNC NO. ${primerCliente.rnc} DOMICILIADO EN ${(primerCliente.direccion || 'DIRECCION NO ESPECIFICADA').toUpperCase()}`
        : primerCliente?.nombrecompleto.toUpperCase() || 'NO ESPECIFICADO';

      const tituloProduccion = data.tituloProduccion ? data.tituloProduccion.toUpperCase() : '';
      const parrafoInicial = `Certifica que la produccion titulada ${tituloProduccion} cuyo Titular dice ser ${titularInfo}, ha sido inscrito en el Registro de la Oficina Nacional de Derecho de Autor, el dia ${dia} del mes de ${mes} del año ${anio}, siendo la ${hora}, bajo el numero de registro ${data.numeroRegistroPrimero || data.obras[0]?.numeroRegistro || 'N/A'}, en el libro No. ${data.libroNumero || '___'}, año ${anio}.`;

      doc.fontSize(9).font('Times-Roman')
        .text(parrafoInicial, 60, yPos, { width: 492, align: 'justify' });

      yPos += 70;

      // ==========================================
      // CONCEPTO: REGISTRO DE PRODUCCIÓN
      // ==========================================

      const conceptoTexto = `CONCEPTO: REGISTRO DE PRODUCCIÓN DE ${data.tipoObra.toUpperCase()}`;
      doc.fontSize(10).font('Times-Bold')
        .text(conceptoTexto, 60, yPos, { align: 'left' });

      yPos += 30;

      // ==========================================
      // LISTA DE OBRAS
      // ==========================================

      doc.fontSize(10).font('Times-Bold').text('OBRAS PRODUCCIÓN:', 60, yPos);
      yPos += 18;

      // Renderizar las obras
      data.obras.forEach((obra) => {
        // Verificar si necesitamos una nueva página (dejar espacio para firma)
        if (yPos > 680) {
          doc.addPage({
            size: 'LETTER',
            margins: { top: 40, bottom: 80, left: 60, right: 60 }
          });
          yPos = 40;
        }

        // Título de la obra (mayúsculas como en la referencia)
        const tituloMayusculas = obra.tituloObra.toUpperCase();

        doc.fontSize(9).font('Times-Roman')
          .text(tituloMayusculas, 60, yPos, { width: 352, continued: false });

        // Número de registro alineado a la derecha en la misma línea
        doc.text(obra.numeroRegistro, 440, yPos, { width: 112, align: 'right' });

        yPos += 12;
      });

      yPos += 18;

      // ==========================================
      // INFORMACIÓN DE CLIENTES (AUTORES, TITULARES, ETC.)
      // ==========================================

      // Verificar espacio para autores (dejar espacio para firma digital)
      if (yPos > 640) {
        doc.addPage({
          size: 'LETTER',
          margins: { top: 40, bottom: 80, left: 60, right: 60 }
        });
        yPos = 40;
      }

      // Agrupar clientes por rol
      const clientesPorRol: { [key: string]: typeof data.clientes } = {};
      data.clientes.forEach(cliente => {
        const rol = cliente.tipoRelacion.toUpperCase();
        if (!clientesPorRol[rol]) {
          clientesPorRol[rol] = [];
        }
        clientesPorRol[rol].push(cliente);
      });

      // Renderizar cada grupo de roles
      for (const [rol, clientes] of Object.entries(clientesPorRol)) {
        const rolesPlural: { [key: string]: string } = {
          'AUTOR': 'AUTOR(ES)',
          'AUTOR_PRINCIPAL': 'AUTOR PRINCIPAL(ES)',
          'TITULAR': 'TITULAR(ES)',
          'INTÉRPRETE': 'INTÉRPRETE(S)',
          'REPRESENTANTE': 'REPRESENTANTE(S)',
          'COAUTOR': 'COAUTOR(ES)'
        };

        const rolFormatted = rolesPlural[rol] || `${rol.replace('_', ' ')}(ES)`;
        const rolSingular = rol.replace('_', ' '); // Para "AUTOR_PRINCIPAL" → "AUTOR PRINCIPAL"

        doc.fontSize(10).font('Times-Bold').text(rolFormatted + ':', 60, yPos);
        yPos += 15;

        clientes.forEach(cliente => {
          // Formato: NOMBRE ROL NAC. DOMINICANA cédula de identidad: XXXXX
          doc.fontSize(9).font('Times-Roman')
            .text(cliente.nombrecompleto.toUpperCase(), 60, yPos, { continued: true })
            .font('Times-Bold')
            .text(` ${rolSingular.toUpperCase()} NAC. DOMINICANA `, { continued: true })
            .font('Times-Roman')
            .text(`cédula de identidad: ${cliente.identificacion}`);

          yPos += 15;
        });

        yPos += 10;
      }

      // ==========================================
      // TEXTO LEGAL - REPRESENTANTES (SOLO SI HAY INSTITUCIÓN)
      // ==========================================

      const hayInstitucion = primerCliente?.rnc != null;
      const representantes = clientesPorRol['REPRESENTANTE'] || [];

      if (hayInstitucion && representantes.length > 0) {
        doc.fontSize(9).font('Times-Roman').text(
          `LA(S) SIGUIENTE(S) PERSONA(S) ACTÚAN EN REPRESENTACIÓN DE LA INSTITUCIÓN.`,
          60, yPos, { width: 492, align: 'justify' }
        );

        yPos += 20;

        representantes.forEach(rep => {
          doc.text(
            `${rep.nombrecompleto.toUpperCase()} NACIONALIDAD DOMINICANA, cédula de identidad ${rep.identificacion}`,
            60, yPos, { width: 492, align: 'justify' }
          );
          yPos += 15;
        });

        yPos += 20;
      }

      // Fecha de expedición
      const diaExpedicion = format(new Date(), 'd');
      const mesExpedicion = format(new Date(), 'MM');
      const anioExpedicion = format(new Date(), 'yyyy');

      doc.text(
        `Se expide en Santo Domingo, Distrito Nacional, capital de la República Dominicana, hoy día (${diaExpedicion}) del mes de ${mesExpedicion} del año ${anioExpedicion}`,
        60, yPos, { width: 492, align: 'justify' }
      );

      yPos += 35;

      // ==========================================
      // PIE DE PÁGINA (Posición fija para dejar espacio a firma digital)
      // ==========================================

      // Posición fija en la parte inferior, dejando espacio para firma digital
      const yPosPie = 680;

      doc.fontSize(9).font('Times-Roman').text(
        'El presente es expedido a los fines descritos en los Arts. 57 y 58 del Reglamento de Aplicación de la Ley 65-00 No. 362-01 del 14 de marzo del 2001.',
        60, yPosPie, { width: 492, align: 'left' }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/certificados-registro/${fileName}`);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}
