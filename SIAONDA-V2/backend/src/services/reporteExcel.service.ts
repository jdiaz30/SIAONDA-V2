import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatosRegistro {
  fecha_formulario: Date;
  fecha_certificado: Date | null;
  estado: string;
  codigo_formulario: string;
  numero_obra: string;
  codigo_producto: string;
  producto: string;
  nombre_obra: string;
}

export async function generarReporteExcelRegistros(
  datos: DatosRegistro[],
  filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    tipoObra?: string;
    estado?: string;
  }
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registros');

  // Configurar columnas según el formato del Excel de ejemplo
  worksheet.columns = [
    { header: 'fecha_formulario', key: 'fecha_formulario', width: 18 },
    { header: 'fecha_certificado', key: 'fecha_certificado', width: 18 },
    { header: 'estado', key: 'estado', width: 25 },
    { header: 'codigo_formulario', key: 'codigo_formulario', width: 20 },
    { header: 'numero_obra', key: 'numero_obra', width: 20 },
    { header: 'codigo_producto', key: 'codigo_producto', width: 18 },
    { header: 'producto', key: 'producto', width: 50 },
    { header: 'nombre_obra', key: 'nombre_obra', width: 50 }
  ];

  // Estilo del encabezado (fondo azul oscuro, texto blanco)
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4788' } // Azul oscuro
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' }, // Blanco
      bold: true,
      size: 11
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Agregar filas de datos
  datos.forEach((registro) => {
    worksheet.addRow({
      fecha_formulario: registro.fecha_formulario ? format(new Date(registro.fecha_formulario), 'yyyy-MM-dd', { locale: es }) : '',
      fecha_certificado: registro.fecha_certificado ? format(new Date(registro.fecha_certificado), 'yyyy-MM-dd', { locale: es }) : '',
      estado: registro.estado,
      codigo_formulario: registro.codigo_formulario,
      numero_obra: registro.numero_obra,
      codigo_producto: registro.codigo_producto,
      producto: registro.producto,
      nombre_obra: registro.nombre_obra
    });
  });

  // Estilo para las filas de datos
  for (let i = 2; i <= worksheet.rowCount; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      };
    });
  }

  // Auto-filtros en encabezados
  worksheet.autoFilter = {
    from: 'A1',
    to: 'H1'
  };

  // Congelar primera fila (encabezados)
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  return await workbook.xlsx.writeBuffer();
}
