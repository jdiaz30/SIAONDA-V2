import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_ONDA_BASE64 } from './logo-onda-base64';

interface FacturaData {
  id: number;
  codigo: string;
  ncf: string | null;
  fecha: Date;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  cliente?: {
    nombrecompleto: string;
    identificacion: string;
    rnc?: string | null;
    telefono?: string;
    correo?: string;
  };
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  metodoPago?: string;
  observaciones?: string | null;
}

// Obtener logo base64 (embebido directamente en el código)
const getLogoBase64 = (): string => {
  console.log('✅ Usando logo embebido (base64 estático)');
  return LOGO_ONDA_BASE64;
};

// Generar HTML de la factura
const generarHTMLFactura = (factura: FacturaData): string => {
  console.log('🔵 Generando HTML de factura...');
  const fechaTexto = format(factura.fecha, "dd/MM/yyyy", { locale: es });
  const logoBase64 = getLogoBase64();
  console.log('🔵 Logo obtenido, longitud:', logoBase64 ? logoBase64.length : 'VACÍO');

  const itemsHTML = factura.items.map((item, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.descripcion}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.cantidad}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">RD$ ${item.precioUnitario.toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">RD$ ${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${factura.codigo}</title>
  <style>
    @page {
      size: letter;
      margin: 1.5cm;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #1e40af;
    }

    .logo {
      width: 150px;
      height: auto;
      display: block;
    }

    .empresa-info {
      text-align: right;
      flex: 1;
    }

    .empresa-info h1 {
      margin: 0 0 5px 0;
      font-size: 16pt;
      color: #1e40af;
      font-weight: bold;
    }

    .empresa-info p {
      margin: 2px 0;
      font-size: 10pt;
      color: #666;
    }

    .factura-info {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      color: white;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
    }

    .factura-info-col {
      flex: 1;
    }

    .factura-info h2 {
      margin: 0 0 10px 0;
      font-size: 14pt;
      font-weight: bold;
    }

    .factura-info p {
      margin: 3px 0;
      font-size: 10pt;
    }

    .ncf-box {
      background: #dc2626;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
    }

    .ncf-box p {
      margin: 2px 0;
      color: white;
      font-weight: bold;
      font-size: 11pt;
    }

    .cliente-info {
      background: #f3f4f6;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }

    .cliente-info h3 {
      margin: 0 0 10px 0;
      font-size: 12pt;
      color: #1e40af;
      font-weight: bold;
    }

    .cliente-info p {
      margin: 5px 0;
      font-size: 10pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th {
      background: #1e40af;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
      font-size: 10pt;
    }

    td {
      padding: 8px;
      font-size: 10pt;
    }

    .totales {
      margin-left: auto;
      width: 300px;
    }

    .totales table {
      margin-bottom: 10px;
    }

    .totales tr td:first-child {
      text-align: right;
      font-weight: bold;
      padding-right: 15px;
    }

    .totales tr td:last-child {
      text-align: right;
      font-weight: bold;
    }

    .total-final {
      background: #1e40af;
      color: white;
      font-size: 13pt !important;
      padding: 12px !important;
    }

    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }

    .observaciones {
      background: #fef3c7;
      padding: 10px;
      border-radius: 5px;
      border-left: 4px solid #f59e0b;
      margin-top: 20px;
      font-size: 10pt;
    }

    .observaciones strong {
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="ONDA Logo" class="logo">` : ''}
    <div class="empresa-info">
      <h1>ONDA</h1>
      <p><strong>Oficina Nacional de Derecho de Autor</strong></p>
      <p><strong>RNC:</strong> 401-50879-6</p>
      <p>Santo Domingo, República Dominicana</p>
      <p>Tel: (809) 686-2181 | www.onda.gob.do</p>
    </div>
  </div>

  ${factura.ncf ? `
  <div class="ncf-box">
    <p>NCF: ${factura.ncf}</p>
    <p style="font-size: 9pt; font-weight: normal;">Comprobante Fiscal Válido para Fines Tributarios</p>
  </div>
  ` : ''}

  <div class="factura-info">
    <div class="factura-info-col">
      <h2>FACTURA</h2>
      <p><strong>No.</strong> ${factura.codigo}</p>
      <p><strong>Fecha:</strong> ${fechaTexto}</p>
      ${factura.metodoPago ? `<p><strong>Método de Pago:</strong> ${factura.metodoPago}</p>` : ''}
    </div>
  </div>

  ${factura.cliente ? `
  <div class="cliente-info">
    <h3>DATOS DEL CLIENTE</h3>
    <p><strong>Nombre:</strong> ${factura.cliente.nombrecompleto}</p>
    ${factura.cliente.rnc ?
      `<p><strong>RNC:</strong> ${factura.cliente.rnc}</p>` :
      `<p><strong>Cédula:</strong> ${factura.cliente.identificacion}</p>`
    }
    ${factura.cliente.telefono ? `<p><strong>Tel:</strong> ${factura.cliente.telefono}</p>` : ''}
    ${factura.cliente.correo ? `<p><strong>Email:</strong> ${factura.cliente.correo}</p>` : ''}
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">#</th>
        <th>Descripción</th>
        <th style="width: 80px; text-align: center;">Cant.</th>
        <th style="width: 120px; text-align: right;">Precio Unit.</th>
        <th style="width: 120px; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totales">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td>RD$ ${factura.subtotal.toFixed(2)}</td>
      </tr>
      ${factura.descuento > 0 ? `
      <tr>
        <td>Descuento:</td>
        <td style="color: #dc2626;">- RD$ ${factura.descuento.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr>
        <td>ITBIS (18%):</td>
        <td>RD$ ${factura.itbis.toFixed(2)}</td>
      </tr>
      <tr class="total-final">
        <td>TOTAL:</td>
        <td>RD$ ${factura.total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${factura.observaciones ? `
  <div class="observaciones">
    <strong>Observaciones:</strong> ${factura.observaciones}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Gracias por su preferencia</strong></p>
    <p>Esta factura fue generada electrónicamente por el Sistema de Gestión SIAONDA</p>
    <p>Oficina Nacional de Derecho de Autor (ONDA) - República Dominicana</p>
  </div>
</body>
</html>
  `;
};

// Función principal para generar el PDF de la factura
export const generateFacturaPDF = async (factura: FacturaData): Promise<Buffer> => {
  const html = generarHTMLFactura(factura);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};
