import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CertificadoRegistroData {
  numeroRegistro: string;
  tituloObra: string;
  tipoObra: string;
  fechaAsentamiento: Date | null;
  libroNumero?: number | null;
  hojaNumero?: number | null;
  cliente: {
    nombrecompleto: string;
    identificacion: string;
  };
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

      // Título de la obra
      doc.fontSize(11).font('Times-Roman').text('Título de la obra: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((data.tituloObra || '').toUpperCase());
      yPos += 25;

      // Autor(es)
      const autores = data.campos?.find(c => c.campo?.campo?.toLowerCase().includes('autor'))?.valor
        || data.cliente.nombrecompleto;
      doc.font('Times-Roman').text('Autor (es): ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((autores || '').toUpperCase());
      yPos += 25;

      // Documento de identidad
      doc.font('Times-Roman').text('Documento de identidad: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((data.cliente.identificacion || '').toUpperCase());
      yPos += 25;

      // Tipo de obra
      doc.font('Times-Roman').text('Tipo de obra: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((data.tipoObra || '').toUpperCase());
      yPos += 25;

      // Titular
      doc.font('Times-Roman').text('Titular: ', 60, yPos, { continued: true });
      doc.font('Times-Bold').text((data.cliente.nombrecompleto || '').toUpperCase());
      yPos += 25;

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
        60, 680, { width: 492, align: 'left' }
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
  cliente: {
    nombrecompleto: string;
    identificacion: string;
    rnc?: string | null;
    direccion?: string | null;
    tipoPersona?: string | null;
  };
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
        doc.image(logoONDA, 256, 50, { width: 100 }); // Centrado en página LETTER (612px)
      }

      // ==========================================
      // TÍTULOS PRINCIPALES
      // ==========================================

      doc.fontSize(11).font('Times-Bold').fillColor('#000000')
        .text('REPÚBLICA DOMINICANA', 60, 175, { align: 'center', width: 492 });

      doc.fontSize(10).font('Times-Roman')
        .text('MINISTERIO DE INDUSTRIA, COMERCIO Y MIPYMES', 60, 195, { align: 'center', width: 492 });

      doc.fontSize(11).font('Times-Bold')
        .text('OFICINA NACIONAL DE DERECHO DE AUTOR', 60, 213, { align: 'center', width: 492 });

      doc.fontSize(14).font('Times-Bold').fillColor('#666666')
        .text('CERTIFICADO DE REGISTRO', 60, 248, { align: 'center', width: 492 });

      // ==========================================
      // PÁRRAFO INICIAL
      // ==========================================

      let yPos = 270;
      doc.fillColor('#000000');

      // Obtener datos de fecha y hora
      const fechaAsentamiento = data.fechaAsentamiento ? new Date(data.fechaAsentamiento) : new Date();
      const dia = format(fechaAsentamiento, 'dd');
      const mes = format(fechaAsentamiento, 'MM');
      const anio = format(fechaAsentamiento, 'yyyy');
      const hora = format(fechaAsentamiento, 'hh:mm a').toUpperCase();

      // Texto del titular (todo en mayusculas)
      const titularInfo = data.cliente.rnc
        ? `${data.cliente.nombrecompleto.toUpperCase()}, INSTITUCION DOMINICANA. RNC NO. ${data.cliente.rnc} DOMICILIADO EN ${(data.cliente.direccion || 'DIRECCION NO ESPECIFICADA').toUpperCase()}`
        : data.cliente.nombrecompleto.toUpperCase();

      const tituloProduccion = data.tituloProduccion ? data.tituloProduccion.toUpperCase() : '';
      const parrafoInicial = `Certifica que la produccion titulada, ${tituloProduccion} cuyo Titular dice ser ${titularInfo}, ha sido inscrito en el Registro de la Oficina Nacional de Derecho de Autor, el dia ${dia} del mes de ${mes} del año ${anio}, siendo la ${hora}, bajo el numero de registro ${data.numeroRegistroPrimero || data.obras[0]?.numeroRegistro || 'N/A'}, en el libro No. ${data.libroNumero || '___'}, año ${anio}.`;

      doc.fontSize(9).font('Times-Roman')
        .text(parrafoInicial, 60, yPos, { width: 492, align: 'justify' });

      yPos += 70;

      // ==========================================
      // CONCEPTO: REGISTRO DE PRODUCCIÓN
      // ==========================================

      doc.fontSize(10).font('Times-Bold')
        .text(`CONCEPTO: REGISTRO DE PRODUCCIÓN ${data.tipoObra.toUpperCase()}`, 60, yPos, { align: 'left' });

      yPos += 30;

      // ==========================================
      // LISTA DE OBRAS
      // ==========================================

      doc.fontSize(10).font('Times-Bold').text('OBRAS PRODUCCIÓN:', 60, yPos);
      yPos += 18;

      // Renderizar las obras
      data.obras.forEach((obra) => {
        // Verificar si necesitamos una nueva página
        if (yPos > 650) {
          doc.addPage({
            size: 'LETTER',
            margins: { top: 60, bottom: 60, left: 60, right: 60 }
          });
          yPos = 60;
        }

        // Título de la obra (mayúsculas como en la referencia)
        const tituloMayusculas = obra.tituloObra.toUpperCase();

        doc.fontSize(9).font('Times-Roman')
          .text(tituloMayusculas, 60, yPos, { width: 352, continued: false });

        // Número de registro alineado a la derecha en la misma línea
        doc.text(obra.numeroRegistro, 440, yPos, { width: 112, align: 'right' });

        yPos += 14;
      });

      yPos += 20;

      // ==========================================
      // INFORMACIÓN DEL AUTOR
      // ==========================================

      // Verificar espacio para autor
      if (yPos > 620) {
        doc.addPage({
          size: 'LETTER',
          margins: { top: 60, bottom: 60, left: 60, right: 60 }
        });
        yPos = 60;
      }

      doc.fontSize(10).font('Times-Bold').text('AUTOR(ES):', 60, yPos);
      yPos += 15;

      // Formato: NOMBRE AUTOR NAC. DOMINICANA cédula de identidad: XXXXX
      doc.fontSize(9).font('Times-Roman')
        .text(data.cliente.nombrecompleto.toUpperCase(), 60, yPos, { continued: true })
        .font('Times-Bold')
        .text(' AUTOR NAC. DOMINICANA ', { continued: true })
        .font('Times-Roman')
        .text(`cédula de identidad: ${data.cliente.identificacion}`);

      yPos += 30;

      // ==========================================
      // TEXTO LEGAL - REPRESENTANTES
      // ==========================================

      doc.fontSize(9).font('Times-Roman').text(
        `LA(S) SIGUIENTE(S) PERSONA(S) ACTÚAN EN REPRESENTACIÓN DE LA INSTITUCIÓN.`,
        60, yPos, { width: 492, align: 'justify' }
      );

      yPos += 20;

      doc.text(
        `${data.cliente.nombrecompleto.toUpperCase()} NACIONALIDAD DOMINICANA, cédula de identidad ${data.cliente.identificacion}`,
        60, yPos, { width: 492, align: 'justify' }
      );

      yPos += 35;

      // Fecha de expedición
      const diaExpedicion = format(new Date(), 'd');
      const mesExpedicion = format(new Date(), 'MM');
      const anioExpedicion = format(new Date(), 'yyyy');

      doc.text(
        `Se expide en Santo Domingo, Distrito Nacional, capital de la República Dominicana, hoy día (${diaExpedicion}) del mes de ${mesExpedicion} del año ${anioExpedicion}`,
        60, yPos, { width: 492, align: 'justify' }
      );

      yPos += 50;

      // ==========================================
      // PIE DE PÁGINA
      // ==========================================

      doc.fontSize(9).font('Times-Roman').text(
        'El presente es expedido a los fines descritos en los Arts. 57 y 58 del Reglamento de Aplicación de la Ley 65-00 No. 362-01 del 14 de marzo del 2001.',
        60, 680, { width: 492, align: 'left' }
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
