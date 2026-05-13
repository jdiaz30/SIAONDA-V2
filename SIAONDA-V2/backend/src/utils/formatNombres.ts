/**
 * Utilidades para formatear nombres de tipos, roles y estados
 * que están en formato SNAKE_CASE_UPPER a formato legible
 */

/**
 * Mapeo de nombres específicos que requieren formato especial
 */
const NOMBRES_ESPECIALES: Record<string, string> = {
  // Tipos de usuario
  'SUPERUSUARIO': 'Superusuario',
  'ADMINISTRADOR': 'Administrador',
  'SUPERVISOR': 'Supervisor',
  'COORDINADOR': 'Coordinador',
  'CAJERO': 'Cajero',
  'REGISTRADOR': 'Registrador',
  'CERTIFICADOR': 'Certificador',
  'DIGITADOR': 'Digitador',
  'FACTURADOR': 'Facturador',
  'ATENCION_USUARIO': 'Atención al Usuario',
  'RECEPCION': 'Recepción',
  'REGIONAL': 'Regional',
  'CONTABLE': 'Contable',
  'INSPECTORIA': 'Inspectoría',
  'DIRECTOR': 'Director',

  // Roles de autores
  'AUTOR_PRINCIPAL': 'Autor Principal',
  'COAUTOR': 'Coautor',
  'AUTOR': 'Autor',
  'COMPOSITOR': 'Compositor',
  'INTERPRETE': 'Intérprete',
  'EDITOR': 'Editor',
  'PRODUCTOR': 'Productor',
  'TRADUCTOR': 'Traductor',
  'ADAPTADOR': 'Adaptador',

  // Tipos de obras
  'OBRA_LITERARIA': 'Obra Literaria',
  'OBRA_MUSICAL': 'Obra Musical',
  'OBRA_AUDIOVISUAL': 'Obra Audiovisual',
  'OBRA_ARTISTICA': 'Obra Artística',
  'OBRA_DE_ARTE_APLICADO': 'Obra de Arte Aplicado',
  'OBRA_DE_ARTES_VISUALES': 'Obra de Artes Visuales',
  'OBRA_CIENTIFICA': 'Obra Científica',
  'OBRA_FOTOGRAFICA': 'Obra Fotográfica',
  'OBRA_ARQUITECTONICA': 'Obra Arquitectónica',
  'PROGRAMA_ORDENADOR': 'Programa de Ordenador',
  'BASE_DATOS': 'Base de Datos',
  'BASE_ELECTRONICA_DE_DATOS': 'Base Electrónica de Datos',
  'PRODUCCION': 'Producción',

  // Tipos de participación
  'PARTICIPACION_PRINCIPAL': 'Participación Principal',
  'PARTICIPACION_SECUNDARIA': 'Participación Secundaria',

  // Estados
  'ACTIVO': 'Activo',
  'INACTIVO': 'Inactivo',
  'PENDIENTE': 'Pendiente',
  'EN_PROCESO': 'En Proceso',
  'EN_REVISION': 'En Revisión',
  'APROBADO': 'Aprobado',
  'RECHAZADO': 'Rechazado',
  'COMPLETADO': 'Completado',
  'CANCELADO': 'Cancelado',

  // Otros
  'ENCARGADO_ATU': 'Encargado de Atención al Usuario',
  'ADMIN_SERVICIO_CLIENTE': 'Admin. Servicio al Cliente',
  'ATU': 'ATU',
  'IRC': 'IRC'
};

/**
 * Convierte un nombre en formato SNAKE_CASE_UPPER o MAYÚSCULAS
 * a formato Title Case legible
 *
 * Ejemplos:
 * - "AUTOR_PRINCIPAL" -> "Autor Principal"
 * - "ATENCION_USUARIO" -> "Atención al Usuario"
 * - "OBRA LITERARIA" -> "Obra Literaria"
 * - "SUPERUSUARIO" -> "Superusuario"
 *
 * @param nombre - El nombre a formatear
 * @returns El nombre formateado en formato legible
 */
export function formatearNombre(nombre: string | null | undefined): string {
  if (!nombre) return '';

  // Limpiar espacios
  const nombreLimpio = nombre.trim();

  // Si está vacío después de limpiar
  if (!nombreLimpio) return '';

  // Convertir a mayúsculas para comparación
  const nombreUpper = nombreLimpio.toUpperCase();

  // Si existe en el mapeo especial, usar ese valor
  if (NOMBRES_ESPECIALES[nombreUpper]) {
    return NOMBRES_ESPECIALES[nombreUpper];
  }

  // Si ya está en formato normal (no todo mayúsculas), devolverlo como está
  if (nombreLimpio !== nombreUpper) {
    return nombreLimpio;
  }

  // Formateo automático para nombres no mapeados
  return nombreUpper
    // Reemplazar guiones bajos por espacios
    .replace(/_/g, ' ')
    // Capitalizar primera letra de cada palabra
    .split(' ')
    .map(palabra => {
      if (palabra.length === 0) return '';

      // Palabras que deben ir en minúscula (artículos, preposiciones)
      const palabrasMinusculas = ['de', 'del', 'la', 'el', 'los', 'las', 'al', 'a', 'y', 'o', 'en'];

      if (palabrasMinusculas.includes(palabra.toLowerCase())) {
        return palabra.toLowerCase();
      }

      // Capitalizar primera letra, resto en minúscula
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    })
    .join(' ')
    // Capitalizar primera letra del resultado
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Convierte un nombre legible a formato SNAKE_CASE_UPPER
 * Útil para búsquedas en base de datos
 *
 * Ejemplos:
 * - "Autor Principal" -> "AUTOR_PRINCIPAL"
 * - "Atención al Usuario" -> "ATENCION_USUARIO"
 *
 * @param nombre - El nombre a convertir
 * @returns El nombre en formato SNAKE_CASE_UPPER
 */
export function nombreAConstante(nombre: string | null | undefined): string {
  if (!nombre) return '';

  return nombre
    .trim()
    // Remover acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Convertir a mayúsculas
    .toUpperCase()
    // Reemplazar espacios por guiones bajos
    .replace(/\s+/g, '_')
    // Remover caracteres especiales excepto guiones bajos
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * Formatea múltiples nombres en un objeto
 *
 * @param obj - Objeto con propiedades a formatear
 * @param campos - Array de nombres de campos a formatear
 * @returns Nuevo objeto con campos formateados
 */
export function formatearObjeto<T extends Record<string, any>>(
  obj: T,
  campos: (keyof T)[]
): T {
  const resultado = { ...obj };

  for (const campo of campos) {
    if (typeof resultado[campo] === 'string') {
      resultado[campo] = formatearNombre(resultado[campo] as string) as any;
    }
  }

  return resultado;
}

/**
 * Formatea nombres en un array de objetos
 *
 * @param array - Array de objetos
 * @param campos - Campos a formatear en cada objeto
 * @returns Nuevo array con objetos formateados
 */
export function formatearArray<T extends Record<string, any>>(
  array: T[],
  campos: (keyof T)[]
): T[] {
  return array.map(obj => formatearObjeto(obj, campos));
}

/**
 * Convierte un string a mayúsculas, manejando null/undefined
 * Útil para datos de entrada del usuario
 */
export function toUpperCase(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim().toUpperCase();
}

/**
 * Campos que deben estar siempre en mayúsculas en la base de datos
 */
export const CAMPOS_MAYUSCULAS = [
  'nombre',
  'apellido',
  'nombrecompleto',
  'direccion',
  'nombreEmpresa',
  'nombreComercial',
  'nombrePropietario',
  'personaContacto',
  'tituloObra',
  'tituloProduccion',
  'descripcion',
  'observaciones',
  'sector',
  'cargo',
  'nombreCliente',
  'nombreCompleto',
  'titulo'
] as const;

/**
 * Campos que NO deben convertirse a mayúsculas (excepciones)
 */
const EXCEPCIONES_MAYUSCULAS = [
  'email',
  'correo',
  'password',
  'contrasena',
  'url',
  'web',
  'ruta',
  'path',
  'codigo', // códigos pueden tener formato específico
  'rnc',
  'cedula',
  'identificacion'
];

/**
 * Verifica si un campo debe ser excluido de la conversión a mayúsculas
 */
function esExcepcion(key: string): boolean {
  const keyLower = key.toLowerCase();
  return EXCEPCIONES_MAYUSCULAS.some(excepcion => keyLower.includes(excepcion));
}

/**
 * Convierte automáticamente TODOS los campos de texto a mayúsculas
 * excepto los que están en la lista de excepciones
 * Aplica esto en los controladores antes de guardar en BD
 *
 * @param obj - Objeto con los datos
 * @returns Nuevo objeto con campos de texto en mayúsculas
 */
export function autoUpperCase<T extends Record<string, any>>(obj: T): T {
  const resultado = { ...obj };

  for (const key in resultado) {
    const value = resultado[key];

    // Convertir strings a mayúsculas si es un campo de texto
    if (typeof value === 'string' && value.trim() !== '') {
      // Si es una excepción, no convertir
      if (esExcepcion(key)) {
        continue;
      }

      // Convertir TODO a mayúsculas por defecto
      resultado[key] = value.trim().toUpperCase() as any;
    }
    // Si es un objeto anidado, aplicar recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      resultado[key] = autoUpperCase(value) as any;
    }
    // Si es un array de objetos, aplicar a cada elemento
    else if (Array.isArray(value)) {
      resultado[key] = value.map(item =>
        typeof item === 'object' && item !== null ? autoUpperCase(item) : item
      ) as any;
    }
  }

  return resultado;
}
