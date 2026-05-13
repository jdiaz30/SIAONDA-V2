import { useState, useCallback } from 'react';
import { applyFormat, detectFormatType } from '../utils/formatters';

/**
 * Hook para manejar inputs con formateo automático
 *
 * @example
 * const { value, handleChange } = useFormattedInput('', 'phone');
 * <input value={value} onChange={handleChange} />
 */
export const useFormattedInput = (
  initialValue: string = '',
  formatType?: 'phone' | 'cedula' | 'rnc' | 'acta' | 'uppercase' | 'titlecase' | 'none',
  fieldName?: string
) => {
  const [value, setValue] = useState(initialValue);

  // Auto-detectar tipo de formato si se proporciona fieldName
  const detectedType = fieldName && !formatType ? detectFormatType(fieldName) : formatType || 'none';

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const formatted = applyFormat(rawValue, detectedType);
    setValue(formatted);

    // Actualizar el evento con el valor formateado
    e.target.value = formatted;
  }, [detectedType]);

  const resetValue = useCallback((newValue: string = '') => {
    const formatted = applyFormat(newValue, detectedType);
    setValue(formatted);
  }, [detectedType]);

  return {
    value,
    handleChange,
    resetValue,
    setValue: (val: string) => setValue(applyFormat(val, detectedType)),
    rawValue: value.replace(/\D/g, ''), // Sin formato (solo dígitos para campos numéricos)
  };
};

export default useFormattedInput;
