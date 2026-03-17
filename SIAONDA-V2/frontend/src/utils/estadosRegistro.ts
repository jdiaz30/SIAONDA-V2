/**
 * Utilidades para normalizar y dar formato a los estados de registro
 */

export type EstadoRegistro =
  | 'PENDIENTE_ASENTAMIENTO'
  | 'ASENTADO'
  | 'CERTIFICADO_GENERADO'
  | 'ENVIADO_FIRMA'
  | 'CERTIFICADO_FIRMADO'
  | 'LISTO_PARA_ENTREGA'
  | 'ENTREGADO'
  | 'DEVUELTO_AAU'
  | string;

/**
 * Convierte el código de estado a texto legible
 */
export const getEstadoTexto = (estado: string): string => {
  const mapeoEstados: Record<string, string> = {
    'PENDIENTE_ASENTAMIENTO': 'Pendiente Asentamiento',
    'ASENTADO': 'Asentado',
    'CERTIFICADO_GENERADO': 'Certificado Generado',
    'ENVIADO_FIRMA': 'Enviado a Firma',
    'CERTIFICADO_FIRMADO': 'Certificado Firmado',
    'LISTO_PARA_ENTREGA': 'Listo para Entrega',
    'ENTREGADO': 'Entregado',
    'DEVUELTO_AAU': 'Devuelto a AAU',
  };

  return mapeoEstados[estado] || estado;
};

/**
 * Retorna las clases CSS de Tailwind para el badge del estado
 */
export const getEstadoColor = (estado: string): string => {
  const colores: Record<string, string> = {
    'PENDIENTE_ASENTAMIENTO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'ASENTADO': 'bg-blue-100 text-blue-800 border-blue-200',
    'CERTIFICADO_GENERADO': 'bg-purple-100 text-purple-800 border-purple-200',
    'ENVIADO_FIRMA': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'CERTIFICADO_FIRMADO': 'bg-green-100 text-green-800 border-green-200',
    'LISTO_PARA_ENTREGA': 'bg-teal-100 text-teal-800 border-teal-200',
    'ENTREGADO': 'bg-gray-100 text-gray-800 border-gray-200',
    'DEVUELTO_AAU': 'bg-red-100 text-red-800 border-red-200',
  };

  return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
};
