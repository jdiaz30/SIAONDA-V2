/**
 * Utilidad para extraer mensajes de error de respuestas del backend
 * Maneja diferentes formatos de error de manera consistente
 */

export const getErrorMessage = (error: any): string => {
  // Si el error tiene una respuesta del servidor
  if (error.response?.data) {
    const data = error.response.data;

    // Prioridad 1: Formato actual del backend (error)
    if (data.error) {
      return data.error;
    }

    // Prioridad 2: Formato alternativo (message)
    if (data.message) {
      return data.message;
    }

    // Prioridad 3: Si hay un array de errores (validación)
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }
  }

  // Si es un error de red o timeout
  if (error.message) {
    if (error.message === 'Network Error') {
      return 'Error de conexión. Por favor, verifique su conexión a internet.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'La solicitud tardó demasiado tiempo. Por favor, intente nuevamente.';
    }
    return error.message;
  }

  // Error genérico como último recurso
  return 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
};
