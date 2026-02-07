import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CertificadoData {
  numeroRegistro: string;
  tituloObra?: string;
  tipoObra?: string;
  fechaAsentamiento: Date | null;
  libroNumero?: number | null;
  cliente?: {
    nombrecompleto?: string;
    identificacion?: string;
  };
}

export async function generarCertificadoOficial(
  registroId: number,
  data: CertificadoData
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
        margins: { top: 50, bottom: 50, left: 80, right: 80 }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ==========================================
      // LOGO ONDA (CENTRADO)
      // ==========================================

      const assetsDir = path.join(process.cwd(), 'public', 'assets');
      const logoONDA = path.join(assetsDir, 'ONDA_solo_logo.png');

      if (fs.existsSync(logoONDA)) {
        doc.image(logoONDA, 256, 50, { width: 100 }); // Centrado
      }

      // ==========================================
      // ENCABEZADO
      // ==========================================

      let yPos = 175;

      doc.fontSize(11).font('Times-Bold').fillColor('#000000')
        .text('REPÚBLICA DOMINICANA', 80, yPos, { align: 'center', width: 452 });

      yPos += 20;
      doc.fontSize(10).font('Times-Roman')
        .text('MINISTERIO DE INDUSTRIA, COMERCIO Y MIPYMES', 80, yPos, { align: 'center', width: 452 });

      yPos += 18;
      doc.fontSize(11).font('Times-Bold')
        .text('OFICINA NACIONAL DE DERECHO DE AUTOR', 80, yPos, { align: 'center', width: 452 });

      yPos += 35;
      doc.fontSize(14).font('Times-Bold').fillColor('#666666')
        .text('CERTIFICADO DE REGISTRO', 80, yPos, { align: 'center', width: 452 });

      // ==========================================
      // CAMPOS DEL CERTIFICADO
      // ==========================================

      yPos += 50;
      doc.fillColor('#000000').fontSize(11).font('Times-Roman');

      // Título de la obra
      doc.text('Título de la obra: ', 80, yPos);
      yPos += 25;

      // Autor(es)
      doc.text('Autor (es):', 80, yPos);
      yPos += 25;

      // Documento de identidad
      doc.text('Documento de identidad:', 80, yPos);
      yPos += 25;

      // Tipo de obra
      doc.text('Tipo de obra: ', 80, yPos);
      yPos += 25;

      // Titular
      doc.text('Titular: ', 80, yPos);
      yPos += 25;

      // Descripción de la Obra
      doc.text('Descripción de la Obra:', 80, yPos);
      yPos += 40;

      // ==========================================
      // TEXTO LEGAL
      // ==========================================

      const numeroSecuencial = data.numeroRegistro || '-------------- ';
      const libro = data.libroNumero ? data.libroNumero.toString() : '-------------';
      const fechaInscripcion = data.fechaAsentamiento
        ? format(new Date(data.fechaAsentamiento), 'dd/MM/yyyy')
        : '-------------------';

      doc.fontSize(10).font('Times-Roman').text(
        `Las inscripciones efectuadas en el Registro Nacional de Derecho de Autor surtirán eficacia desde la fecha de recepción de la solicitud, debidamente suscrita por el solicitante, con el número de registro `,
        80, yPos, { width: 452, align: 'justify', continued: true }
      )
      .font('Times-Bold').text(numeroSecuencial, { continued: true })
      .font('Times-Roman').text(' en libro ', { continued: true })
      .font('Times-Bold').text(libro, { continued: true })
      .font('Times-Roman').text(' en la fecha de inscripción ', { continued: true })
      .font('Times-Bold').text(fechaInscripcion, { continued: true })
      .font('Times-Roman').text(', conforme a lo establecido en el Artículo 61 del Reglamento de Aplicación No. 362-01 de la Ley 65-00 Sobre Derecho de Autor.');

      yPos += 70;

      // ==========================================
      // FECHA DE EXPEDICIÓN
      // ==========================================

      const diaNum = format(new Date(), 'd');
      const mes = format(new Date(), 'MMMM', { locale: es });
      const anio = format(new Date(), 'yyyy');

      doc.fontSize(10).font('Times-Roman').text(
        `Se expide en Santo Domingo, Distrito Nacional, Capital de la República Dominicana, hoy día ________________________ (${diaNum}) del mes de ${mes} del año ${anio}.`,
        80, yPos, { width: 452, align: 'justify' }
      );

      yPos += 60;

      // ==========================================
      // PIE DE PÁGINA
      // ==========================================

      doc.fontSize(9).font('Times-Roman').text(
        'El presente es expedido a los fines descritos en los Arts. 57 y 58 del Reglamento de Aplicación de la Ley 65-00 No. 362-01 del 14 de marzo del 2001.',
        80, 680, { width: 452, align: 'left' }
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
