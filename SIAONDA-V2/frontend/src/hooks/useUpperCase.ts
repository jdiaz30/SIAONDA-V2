import { useState, useCallback } from 'react';

/**
 * Hook para convertir automáticamente el texto a mayúsculas
 *
 * @param initialValue - Valor inicial del campo
 * @returns [value, handleChange, setValue] - Valor, manejador de cambio y setter manual
 *
 * @example
 * const [nombre, handleNombreChange] = useUpperCase('');
 * <input value={nombre} onChange={handleNombreChange} />
 */
export const useUpperCase = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue.toUpperCase());

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const upperValue = e.target.value.toUpperCase();
    setValue(upperValue);
  }, []);

  return [value, handleChange, setValue] as const;
};

/**
 * Función helper para convertir un objeto completo a mayúsculas
 * Útil para formularios con múltiples campos
 */
export const toUpperCaseObject = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;

  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      result[key] = value.toUpperCase() as any;
    } else {
      result[key] = value;
    }
  }

  return result;
};
