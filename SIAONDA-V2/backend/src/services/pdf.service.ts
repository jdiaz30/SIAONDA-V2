import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CertificadoData {
  id: number;
  codigo: string;
  fecha: Date;
  libroNumero: number;
  observaciones: string | null;
  formulario: {
    codigo: string;
    clientes: Array<{
      tipoRelacion: string;
      cliente: {
        id: number;
        codigo: string;
        nombrecompleto: string;
        identificacion: string;
        rnc: string | null;
        fallecido: boolean;
        tipo: {
          nombre: string;
        };
        nacionalidad: {
          nombre: string;
        };
      };
    }>;
    productos: Array<{
      cantidad: number;
      producto: {
        nombre: string;
        categoria: string;
      };
      campos: Array<{
        valor: string;
        campo: {
          campo: string;
          titulo: string;
          tipo: {
            nombre: string;
          };
        };
      }>;
    }>;
  };
}

// Función para obtener el texto del tipo de obra en el certificado
const getTextoTipoObra = (categoria: string): string => {
  const textos: { [key: string]: string } = {
    'Literaria': 'obra literaria',
    'Musical': 'obra musical',
    'Audiovisual': 'obra audiovisual',
    'Artística': 'obra artística',
    'Fotográfica': 'obra fotográfica',
    'Arquitectónica': 'obra arquitectónica',
    'Programa de Computadora': 'programa de computadora',
    'Científica': 'obra científica',
    'Interpretación': 'interpretación o ejecución artística',
    'Fonograma': 'fonograma',
    'Emisión': 'emisión',
    'Base de Datos': 'base de datos'
  };
  return textos[categoria] || 'obra';
};

// Función para generar el texto de autores/titulares
const generarTextoAutores = (clientes: CertificadoData['formulario']['clientes']): string => {
  if (clientes.length === 0) return '';

  const autores = clientes.filter(c => c.tipoRelacion === 'Autor' || c.tipoRelacion === 'Titular');

  if (autores.length === 0) return '';

  if (autores.length === 1) {
    const autor = autores[0].cliente;
    let texto = `<strong>${autor.nombrecompleto.toUpperCase()}</strong>`;

    if (autor.fallecido) {
      texto += ' (FALLECIDO)';
    }

    if (autor.tipo.nombre === 'Jurídica' && autor.rnc) {
      texto += `, RNC: <strong>${autor.rnc}</strong>`;
    } else {
      texto += `, cédula de identidad No. <strong>${autor.identificacion}</strong>`;
    }

    texto += `, de nacionalidad <strong>${autor.nacionalidad.nombre.toUpperCase()}</strong>`;

    return texto;
  } else {
    // Múltiples autores
    let texto = 'los señores ';
    autores.forEach((a, index) => {
      const autor = a.cliente;
      if (index > 0) {
        if (index === autores.length - 1) {
          texto += ' y ';
        } else {
          texto += ', ';
        }
      }

      texto += `<strong>${autor.nombrecompleto.toUpperCase()}</strong>`;

      if (autor.fallecido) {
        texto += ' (FALLECIDO)';
      }

      if (autor.tipo.nombre === 'Jurídica' && autor.rnc) {
        texto += `, RNC: <strong>${autor.rnc}</strong>`;
      } else {
        texto += `, cédula No. <strong>${autor.identificacion}</strong>`;
      }
    });

    return texto;
  }
};

// Función para generar el texto de la obra
const generarTextoObra = (productos: CertificadoData['formulario']['productos']): string => {
  if (productos.length === 0) return '';

  const producto = productos[0];
  const categoria = producto.producto.categoria;

  // Detectar si es una producción (código termina en -P)
  const esProduccion = productos.length > 1;

  // Para producciones, extraer el tipo de obra del nombre del producto
  let tipoObra = getTextoTipoObra(categoria);
  if (esProduccion) {
    // El nombre del producto es como "Dibujos (6-15)" o "Pinturas (6-15)"
    // Extraer solo la parte antes del paréntesis y convertir a minúsculas
    const nombreProducto = producto.producto.nombre.replace(/\s*\(.*\)/, '').toLowerCase();
    tipoObra = nombreProducto;
  }

  // Buscar título de la obra/producción
  const campoTitulo = producto.campos.find(c =>
    c.campo.titulo.toLowerCase().includes('titulo') ||
    c.campo.titulo.toLowerCase().includes('título') ||
    c.campo.campo.toLowerCase().includes('titulo')
  );

  const titulo = campoTitulo ? campoTitulo.valor : producto.producto.nombre;

  // Usar el mismo formato oficial para todas las obras
  let texto = `la ${tipoObra} titulada: <strong>"${titulo.toUpperCase()}"</strong>`;

  // Si hay sub-obras (producciones), agregar la lista al final
  if (esProduccion) {
    texto += ', la cual contiene las siguientes obras: ';
    const subObras = productos.slice(1).map(p => {
      const subTitulo = p.campos.find(c =>
        c.campo.titulo.toLowerCase().includes('titulo') ||
        c.campo.titulo.toLowerCase().includes('título') ||
        c.campo.campo.toLowerCase().includes('titulo')
      );
      return `<strong>"${(subTitulo?.valor || p.producto.nombre).toUpperCase()}"</strong>`;
    });
    texto += subObras.join(', ');
  }

  return texto;
};

// Generar HTML del certificado
const generarHTMLCertificado = (certificado: CertificadoData): string => {
  const fechaTexto = format(certificado.fecha, "d 'de' MMMM 'del' yyyy", { locale: es });
  const textoAutores = generarTextoAutores(certificado.formulario.clientes);
  const textoObra = generarTextoObra(certificado.formulario.productos);

  // Determinar si es plural o singular
  const esPlural = certificado.formulario.clientes.filter(c =>
    c.tipoRelacion === 'Autor' || c.tipoRelacion === 'Titular'
  ).length > 1;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado ${certificado.codigo}</title>
  <style>
    @page {
      size: letter;
      margin: 2cm;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000;
      text-align: justify;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
    }

    .header h2 {
      font-size: 14pt;
      font-weight: normal;
      margin: 5px 0;
    }

    .codigo {
      text-align: right;
      font-weight: bold;
      margin-bottom: 30px;
      font-size: 11pt;
    }

    .contenido {
      margin: 30px 0;
      text-indent: 50px;
    }

    .contenido p {
      margin: 20px 0;
    }

    .firma {
      margin-top: 80px;
      text-align: center;
    }

    .firma-linea {
      width: 300px;
      margin: 50px auto 10px;
      border-top: 1px solid #000;
    }

    .firma-texto {
      font-size: 11pt;
      font-weight: bold;
    }

    .libro {
      text-align: right;
      margin-top: 30px;
      font-size: 11pt;
    }

    strong {
      font-weight: bold;
    }

    .sello {
      position: absolute;
      bottom: 100px;
      left: 100px;
      opacity: 0.1;
      font-size: 48pt;
      font-weight: bold;
      color: #000;
      transform: rotate(-45deg);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>REPÚBLICA DOMINICANA</h1>
    <h2>OFICINA NACIONAL DE DERECHO DE AUTOR</h2>
    <h2>ONDA</h2>
  </div>

  <div class="codigo">
    Certificado No. ${certificado.codigo}
  </div>

  <div class="libro">
    Libro No. ${certificado.libroNumero}
  </div>

  <div class="contenido">
    <p>
      La <strong>OFICINA NACIONAL DE DERECHO DE AUTOR (ONDA)</strong>,
      en virtud de las atribuciones que le confiere la Ley No. 65-00 sobre Derecho de Autor,
      de fecha 21 de agosto del año 2000, y sus modificaciones,
    </p>

    <p>
      <strong>CERTIFICA:</strong>
    </p>

    <p>
      Que en fecha <strong>${fechaTexto.toUpperCase()}</strong>, ${esPlural ? 'fueron asentados' : 'fue asentado'}
      en los registros de esta Oficina, ${textoAutores}, como
      ${esPlural ? 'autores y titulares' : 'autor y titular'} de ${textoObra}.
    </p>

    <p>
      La presente certificación se expide a solicitud de ${esPlural ? 'los interesados' : 'la parte interesada'},
      para los fines legales que ${esPlural ? 'estimen' : 'estime'} convenientes.
    </p>

    <p>
      Dado en la ciudad de <strong>SANTO DOMINGO DE GUZMÁN</strong>,
      Distrito Nacional, capital de la República Dominicana,
      a los <strong>${fechaTexto.toUpperCase()}</strong>.
    </p>
  </div>

  <div class="firma">
    <div class="firma-linea"></div>
    <div class="firma-texto">
      DIRECTOR/A<br>
      OFICINA NACIONAL DE DERECHO DE AUTOR
    </div>
  </div>

  ${certificado.observaciones ? `
  <div style="margin-top: 40px; font-size: 10pt; font-style: italic;">
    <strong>Observaciones:</strong> ${certificado.observaciones}
  </div>
  ` : ''}
</body>
</html>
  `;
};

// Función principal para generar el PDF
export const generateCertificadoPDF = async (certificado: CertificadoData): Promise<Buffer> => {
  const html = generarHTMLCertificado(certificado);

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
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};
