/**
 * Utilidades para formateo automático de campos en formularios
 */

/**
 * Formatea número de teléfono dominicano: 809-555-5555
 * Acepta: 8095555555, 809-555-5555, (809)5555555, etc.
 */
export const formatPhoneNumber = (value: string): string => {
  // Remover todo excepto dígitos
  const digits = value.replace(/\D/g, '');

  // Si tiene 10 dígitos, formatear con guiones
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Si tiene 7 dígitos (sin código de área), agregar formato
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  // Devolver lo que hay mientras se escribe
  if (digits.length > 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return digits;
};

/**
 * Formatea cédula dominicana: 000-0000000-0
 * Formato: 3 dígitos - 7 dígitos - 1 dígito
 */
export const formatCedula = (value: string): string => {
  // Remover todo excepto dígitos
  const digits = value.replace(/\D/g, '');

  // Limitar a 11 dígitos
  const limited = digits.slice(0, 11);

  // Formatear progresivamente
  if (limited.length > 10) {
    return `${limited.slice(0, 3)}-${limited.slice(3, 10)}-${limited.slice(10)}`;
  }

  if (limited.length > 3) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  }

  return limited;
};

/**
 * Formatea RNC dominicano: 000-00000-0
 * Formato: 3 dígitos - 5 dígitos - 1 dígito
 */
export const formatRNC = (value: string): string => {
  // Remover todo excepto dígitos
  const digits = value.replace(/\D/g, '');

  // Limitar a 9 dígitos
  const limited = digits.slice(0, 9);

  // Formatear progresivamente
  if (limited.length > 8) {
    return `${limited.slice(0, 3)}-${limited.slice(3, 8)}-${limited.slice(8)}`;
  }

  if (limited.length > 3) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  }

  return limited;
};

/**
 * Formatea acta de nacimiento: formato libre pero con guiones cada 4 dígitos
 * Ejemplo: 0000-0000-0000
 */
export const formatActaNacimiento = (value: string): string => {
  // Remover todo excepto dígitos
  const digits = value.replace(/\D/g, '');

  // Limitar a 16 dígitos
  const limited = digits.slice(0, 16);

  // Formatear en grupos de 4
  const parts = [];
  for (let i = 0; i < limited.length; i += 4) {
    parts.push(limited.slice(i, i + 4));
  }

  return parts.join('-');
};

/**
 * Convierte texto a mayúsculas
 */
export const toUpperCase = (value: string): string => {
  return value.toUpperCase();
};

/**
 * Convierte texto a mayúsculas pero mantiene la primera letra de cada palabra en mayúscula
 * y el resto en minúscula (Title Case)
 */
export const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Aplica formato según el tipo de campo
 */
export const applyFormat = (value: string, formatType: 'phone' | 'cedula' | 'rnc' | 'acta' | 'uppercase' | 'titlecase' | 'none'): string => {
  switch (formatType) {
    case 'phone':
      return formatPhoneNumber(value);
    case 'cedula':
      return formatCedula(value);
    case 'rnc':
      return formatRNC(value);
    case 'acta':
      return formatActaNacimiento(value);
    case 'uppercase':
      return toUpperCase(value);
    case 'titlecase':
      return toTitleCase(value);
    default:
      return value;
  }
};

/**
 * Validación de cédula dominicana usando algoritmo de verificación
 * Basado en el algoritmo oficial de la JCE (Junta Central Electoral)
 * @param cedula - Cédula con o sin guiones (000-0000000-0)
 * @returns true si la cédula es válida, false si no
 */
export const validateCedula = (cedula: string): boolean => {
  // Remover guiones y espacios
  const digits = cedula.replace(/[-\s]/g, '');

  // Debe tener exactamente 11 dígitos
  if (digits.length !== 11 || !/^\d+$/.test(digits)) {
    return false;
  }

  // Algoritmo de validación de cédula dominicana (módulo 10)
  // Basado en https://www.jce.gob.do/Servicios/ConsultaCedula/
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    let product = parseInt(digits[i]) * weights[i];
    // Si el producto es mayor a 9, sumar los dígitos
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }
    sum += product;
  }

  // El dígito verificador es (10 - (sum % 10)) % 10
  const checkDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(digits[10]);

  return checkDigit === lastDigit;
};

/**
 * Validación de RNC dominicano
 * @param rnc - RNC con o sin guiones (000-00000-0)
 * @returns true si el RNC tiene formato válido
 */
export const validateRNC = (rnc: string): boolean => {
  // Remover guiones y espacios
  const digits = rnc.replace(/[-\s]/g, '');

  // Debe tener exactamente 9 dígitos
  if (digits.length !== 9 || !/^\d+$/.test(digits)) {
    return false;
  }

  // RNC válido (formato básico, no hay algoritmo de verificación oficial)
  return true;
};

/**
 * Hook para detectar tipo de formato basado en nombre del campo
 */
export const detectFormatType = (fieldName: string): 'phone' | 'cedula' | 'rnc' | 'acta' | 'uppercase' | 'titlecase' | 'none' => {
  const lowerName = fieldName.toLowerCase();

  if (lowerName.includes('telefono') || lowerName.includes('movil') || lowerName.includes('celular') || lowerName.includes('phone')) {
    return 'phone';
  }

  if (lowerName.includes('cedula') || lowerName === 'identificacion') {
    return 'cedula';
  }

  if (lowerName.includes('rnc')) {
    return 'rnc';
  }

  if (lowerName.includes('acta')) {
    return 'acta';
  }

  // Campos que deben estar en mayúsculas
  if (lowerName.includes('nombre') || lowerName.includes('apellido') ||
      lowerName.includes('titulo') || lowerName.includes('direccion') ||
      lowerName.includes('ciudad') || lowerName.includes('provincia')) {
    return 'uppercase';
  }

  return 'none';
};
