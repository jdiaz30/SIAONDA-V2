import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface DatosEmpresa {
  nombreEmpresa: string;
  nombreComercial?: string;
  rnc: string;
  tipoPersona?: string;
  direccion?: string;
  sector?: string;
  provincia?: string;
  telefono?: string;
  telefonoSecundario?: string;
  correoElectronico?: string;
  representanteLegal?: string;
  cedulaRepresentante?: string;
  categoriaIrc?: string;
  descripcionActividades?: string;
  fechaInicioOperaciones?: string;
  principalesClientes?: string;
  // Persona Moral
  presidenteNombre?: string;
  presidenteCedula?: string;
  presidenteDomicilio?: string;
  presidenteTelefono?: string;
  presidenteCelular?: string;
  presidenteEmail?: string;
  vicepresidente?: string;
  secretario?: string;
  tesorero?: string;
  administrador?: string;
  domicilioConsejo?: string;
  telefonoConsejo?: string;
  fechaConstitucion?: string;
  // Persona Física
  nombrePropietario?: string;
  cedulaPropietario?: string;
  domicilioPropietario?: string;
  telefonoPropietario?: string;
  celularPropietario?: string;
  emailPropietario?: string;
  nombreAdministrador?: string;
  cedulaAdministrador?: string;
  telefonoAdministrador?: string;
  fechaInicioActividades?: string;
}

interface DatosCertificado {
  numeroRegistro: string;
  numeroLibro: string;
  numeroHoja: string;
  fechaInscripcion: Date;
  fechaVencimiento: Date;
  tipoSolicitud: string;
  empresa: DatosEmpresa;
}

export const generarCertificadoIRCPDF = async (
  datos: DatosCertificado,
  rutaDestino: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(rutaDestino);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Crear documento PDF (tamaño carta)
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72
        }
      });

      // Stream al archivo
      const stream = fs.createWriteStream(rutaDestino);
      doc.pipe(stream);

      // ===========================
      // ENCABEZADO
      // ===========================
      // Los logos y encabezado están en la hoja timbrada pre-impresa
      // Dejar espacio en blanco para el membrete oficial

      doc.moveDown(7); // Espacio reducido para membrete

      // ===========================
      // TÍTULO
      // ===========================
      doc
        .fontSize(14)
        .font('Times-Bold')
        .text('CERTIFICADO DE REGISTRO', { align: 'center' });

      doc.moveDown(1);

      // ===========================
      // TEXTO INTRODUCTORIO (CENTRADO)
      // ===========================
      doc
        .fontSize(11)
        .font('Times-Roman')
        .text(
          'En virtud de lo dispuesto en el artículo 109 del Reglamento No. 362-01, de aplicación de la Ley 65-00, la Oficina Nacional de Derecho de Autor (ONDA), ',
          72,
          doc.y,
          { align: 'justify', continued: true }
        )
        .font('Times-Bold')
        .text('CERTIFICA ', { continued: true })
        .font('Times-Roman')
        .text('que, en el Libro de Inscripciones para los importadores, distribuidores y comercializadores de bienes, servicios o equipos vinculados al derecho de autor o derechos afines, se encuentra registrada la persona que se describe a continuación:', { align: 'justify' });

      doc.moveDown(1.5);

      // ===========================
      // DATOS DE LA EMPRESA (Formato simple)
      // ===========================
      const leftCol = 72;
      const rightCol = 340;
      const fechaVenc = new Date(datos.fechaVencimiento);

      const mesNombres = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];

      // Núm. de Registro y Fecha de vigencia
      let currentY = doc.y;
      doc.fontSize(11).font('Times-Bold').text('Núm. de Registro: ', leftCol, currentY, { continued: true });
      doc.font('Times-Roman').text(datos.numeroRegistro);

      doc.fontSize(11).font('Times-Bold').text('Fecha de vigencia: ', rightCol, currentY, { continued: true });
      doc.font('Times-Roman').text(`${fechaVenc.getDate()}/${fechaVenc.getMonth() + 1}/${fechaVenc.getFullYear()}`);

      doc.moveDown(0.8);

      // Tipo de Persona (con casillas)
      doc.fontSize(11).font('Times-Bold').text('Tipo de Persona: ', leftCol, doc.y);

      currentY = doc.y;

      // Casilla Física
      const checkBoxSize = 10;
      const checkBoxY = currentY - 11;
      const physicaX = leftCol + 120;

      doc.rect(physicaX, checkBoxY, checkBoxSize, checkBoxSize).stroke();
      if (datos.empresa.tipoPersona === 'FISICA') {
        doc.fontSize(11).font('Times-Bold').text('X', physicaX + 2, checkBoxY);
      }
      doc.fontSize(11).font('Times-Roman').text('Física', physicaX + 15, checkBoxY + 1);

      // Casilla Jurídica
      const juridicaX = leftCol + 200;
      doc.rect(juridicaX, checkBoxY, checkBoxSize, checkBoxSize).stroke();
      if (datos.empresa.tipoPersona === 'MORAL') {
        doc.fontSize(11).font('Times-Bold').text('X', juridicaX + 2, checkBoxY);
      }
      doc.fontSize(11).font('Times-Roman').text('Jurídica', juridicaX + 15, checkBoxY + 1);

      doc.moveDown(0.8);

      // Nombre o razón social
      doc.fontSize(11).font('Times-Bold').text('Nombre o razón social: ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(datos.empresa.nombreEmpresa || 'N/A');

      doc.moveDown(0.7);

      // RNC
      doc.fontSize(11).font('Times-Bold').text('RNC: ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(datos.empresa.rnc || 'N/A');

      doc.moveDown(0.7);

      // Dirección
      doc.fontSize(11).font('Times-Bold').text('Dirección: ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(datos.empresa.direccion || 'N/A', { width: 450 });

      doc.moveDown(0.7);

      // Teléfono(s)
      const telefonos = [datos.empresa.telefono, datos.empresa.telefonoSecundario].filter(t => t).join(', ');
      doc.fontSize(11).font('Times-Bold').text('Teléfono(s): ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(telefonos || 'N/A');

      doc.moveDown(0.7);

      // Persona Responsable
      const personaResponsable = datos.empresa.representanteLegal ||
                                 datos.empresa.presidenteNombre ||
                                 datos.empresa.nombrePropietario ||
                                 'N/A';
      doc.fontSize(11).font('Times-Bold').text('Persona Responsable: ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(personaResponsable);

      doc.moveDown(0.7);

      // Actividad
      doc.fontSize(11).font('Times-Bold').text('Actividad: ', leftCol, doc.y, { continued: true });
      doc.font('Times-Roman').text(datos.empresa.descripcionActividades || datos.empresa.categoriaIrc || 'N/A', { width: 470 });

      doc.moveDown(1.5);

      // ===========================
      // FECHA DE EXPEDICIÓN
      // ===========================

      const hoy = new Date();

      doc
        .fontSize(11)
        .font('Times-Roman')
        .text(
          `En Santo Domingo, Distrito Nacional, República Dominicana, a los (${hoy.getDate()}) días del mes de ${mesNombres[hoy.getMonth()]} del año Dos Mil Veinticinco (${hoy.getFullYear()}).`,
          leftCol,
          doc.y,
          { align: 'justify' }
        );

      // El certificado termina aquí
      // La firma digital se agregará mediante el servicio externo de firma

      // Finalizar documento
      doc.end();

      // Resolver promesa cuando termine
      stream.on('finish', () => {
        resolve(rutaDestino);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
