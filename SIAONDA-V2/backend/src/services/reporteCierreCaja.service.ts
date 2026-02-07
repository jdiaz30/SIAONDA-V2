import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '../config/database';
import { LOGO_ONDA_BASE64 } from './logo-onda-base64';

interface DatosCierre {
  caja: any;
  cierre: any;
  facturas: any[];
  usuario: any;
}

export const generarReporteCierreCaja = async (cierreId: number, res: Response) => {
  // Obtener datos del cierre
  const cierre = await prisma.cierre.findUnique({
    where: { id: cierreId },
    include: {
      caja: {
        include: {
          usuario: true,
          sucursal: true
        }
      },
      estado: true
    }
  });

  if (!cierre) {
    throw new Error('Cierre no encontrado');
  }

  // Obtener facturas de esta caja que corresponden a este cierre
  const facturas = await prisma.factura.findMany({
    where: {
      cajaId: cierre.cajaId,
      fecha: {
        gte: cierre.fechaInicio,
        lte: cierre.fechaFinal
      }
    },
    include: {
      items: true,
      estado: true
    },
    orderBy: { codigo: 'asc' }
  });

  // Calcular totales
  const totalesPorMetodo: Record<string, number> = {};
  let totalGeneral = 0;
  let totalFacturas = facturas.length;

  facturas.forEach(factura => {
    const monto = Number(factura.total);
    totalGeneral += monto;

    const metodo = factura.metodoPago || 'Efectivo';
    if (!totalesPorMetodo[metodo]) {
      totalesPorMetodo[metodo] = 0;
    }
    totalesPorMetodo[metodo] += monto;
  });

  // Crear PDF
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, left: 50, right: 50, bottom: 50 }
  });

  // Headers para descarga
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="cierre-caja-${cierre.caja.codigo}.pdf"`);

  doc.pipe(res);

  // Logo ONDA (arriba a la izquierda)
  // Remover el prefijo data:image/png;base64, si existe
  const base64Data = LOGO_ONDA_BASE64.replace(/^data:image\/\w+;base64,/, '');
  const logoBuffer = Buffer.from(base64Data, 'base64');
  doc.image(logoBuffer, 50, 35, { width: 80 });

  // Encabezado institucional compacto (ajustado para dar espacio al logo)
  doc.fontSize(12).font('Helvetica-Bold').text('ONDA', 145, 40);
  doc.fontSize(8).font('Helvetica').text('Oficina Nacional de Derecho de Autor', 145, 55);
  doc.text('República Dominicana | RNC: 401-50879-6', 145, 67);

  // Título del reporte
  doc.fontSize(14).font('Helvetica-Bold').text('REPORTE DE CIERRE DE CAJA', 0, 100, {
    align: 'center',
    width: doc.page.width
  });

  doc.fontSize(9).font('Helvetica').text('Departamento Administrativo y Financiero', 0, 117, {
    align: 'center',
    width: doc.page.width
  });

  // Línea separadora
  doc.moveTo(50, 135).lineTo(doc.page.width - 50, 135).stroke();

  let y = 145;

  // Debug: Log usuario data
  console.log('DEBUG CIERRE - Usuario:', {
    usuarioId: cierre.caja.usuarioId,
    usuario: cierre.caja.usuario,
    nombrecompleto: cierre.caja.usuario?.nombrecompleto,
    codigo: cierre.caja.usuario?.codigo
  });

  // Información de la caja (compacta en 2 columnas)
  doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DE CAJA', 50, y);
  y += 15;

  const horaApertura = new Date(cierre.fechaInicio);
  const horaCierre = new Date(cierre.fechaFinal || new Date());
  const duracion = Math.floor((horaCierre.getTime() - horaApertura.getTime()) / (1000 * 60));
  const horas = Math.floor(duracion / 60);
  const minutos = duracion % 60;

  doc.fontSize(9).font('Helvetica');
  doc.text(`Código: ${cierre.caja.codigo}`, 50, y);
  doc.text(`Cajero: ${cierre.caja.usuario?.nombrecompleto || 'Sistema'}`, 300, y);
  y += 13;

  doc.text(`Fecha: ${new Date(cierre.caja.fecha).toLocaleDateString('es-DO')}`, 50, y);
  doc.text(`Usuario: ${cierre.caja.usuario?.codigo || cierre.caja.usuario?.nombre || 'N/A'}`, 300, y);
  y += 13;

  doc.text(`Apertura: ${horaApertura.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`, 50, y);
  doc.text(`Cierre: ${horaCierre.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`, 300, y);
  y += 13;

  doc.text(`Duración: ${horas}h ${minutos}min`, 50, y);
  if (cierre.caja.descripcion) {
    doc.text(`Descripción: ${cierre.caja.descripcion}`, 300, y);
  }
  y += 20;

  // Resumen financiero compacto
  doc.fontSize(10).font('Helvetica-Bold').text('RESUMEN FINANCIERO', 50, y);
  y += 12;

  // Tabla de totales por método de pago
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Método de Pago', 50, y);
  doc.text('Cant.', 300, y, { width: 60, align: 'right' });
  doc.text('Monto', 470, y, { width: 80, align: 'right' });
  y += 10;

  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 8;

  doc.font('Helvetica');
  Object.entries(totalesPorMetodo).forEach(([metodo, monto]) => {
    const cantidad = facturas.filter(f => (f.metodoPago || 'Efectivo') === metodo).length;
    doc.text(metodo, 50, y);
    doc.text(cantidad.toString(), 300, y, { width: 60, align: 'right' });
    doc.text(`RD$ ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 470, y, { width: 80, align: 'right' });
    y += 12;
  });

  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 8;

  // Total general
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('TOTAL GENERAL', 50, y);
  doc.text(totalFacturas.toString(), 300, y, { width: 60, align: 'right' });
  doc.text(`RD$ ${totalGeneral.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 470, y, { width: 80, align: 'right' });
  y += 18;

  // Detalle de facturas (solo si caben, sino resumir)
  doc.fontSize(10).font('Helvetica-Bold').text('DETALLE DE FACTURAS', 50, y);
  y += 12;

  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('Código', 50, y);
  doc.text('Hora', 150, y);
  doc.text('Método', 210, y);
  doc.text('NCF', 290, y);
  doc.text('Monto', 490, y, { width: 60, align: 'right' });
  y += 9;

  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 6;

  doc.font('Helvetica');

  // Mostrar solo las primeras facturas si hay muchas
  const facturasAMostrar = facturas.slice(0, 15); // Máximo 15 facturas
  facturasAMostrar.forEach((factura: any) => {
    const hora = new Date(factura.fecha).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(factura.codigo, 50, y);
    doc.text(hora, 150, y);
    doc.text(factura.metodoPago || 'Efectivo', 210, y);
    doc.text(factura.ncf || '-', 290, y);
    doc.text(`RD$ ${Number(factura.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 490, y, { width: 60, align: 'right' });
    y += 10;
  });

  if (facturas.length > 15) {
    y += 5;
    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#666666');
    doc.text(`... y ${facturas.length - 15} facturas más (ver sistema para detalle completo)`, 50, y);
    doc.fillColor('#000000');
  }

  y += 15;

  // Firmas (posición fija en la parte inferior)
  const firmasyPos = doc.page.height - 120;

  doc.fontSize(8).font('Helvetica');
  doc.text('_______________________________', 50, firmasyPos);
  doc.text('_______________________________', 320, firmasyPos);

  doc.text('Cajero(a)', 50, firmasyPos + 15, { width: 200, align: 'center' });
  doc.text('Supervisor(a)', 320, firmasyPos + 15, { width: 200, align: 'center' });

  doc.fontSize(7);
  doc.text(cierre.caja.usuario?.nombrecompleto || 'Sistema', 50, firmasyPos + 28, { width: 200, align: 'center' });

  // Pie de página
  doc.fontSize(6).font('Helvetica').fillColor('#666666');
  doc.text(
    `Generado: ${new Date().toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })} | Sistema SIAONDA V2`,
    50,
    doc.page.height - 40,
    {
      align: 'center',
      width: doc.page.width - 100
    }
  );

  doc.end();
};
