import React from 'react';

interface UpperCaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Todas las props de input nativo
}

/**
 * Input que automáticamente convierte el texto a mayúsculas
 * Usa este componente en lugar de <input> para campos de texto que deben estar en mayúsculas
 */
export const UpperCaseInput: React.FC<UpperCaseInputProps> = ({ onChange, value, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperValue = e.target.value.toUpperCase();

    // Crear un nuevo evento con el valor en mayúsculas
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: upperValue,
      },
    };

    if (onChange) {
      onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
};

interface UpperCaseTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Todas las props de textarea nativo
}

/**
 * TextArea que automáticamente convierte el texto a mayúsculas
 */
export const UpperCaseTextArea: React.FC<UpperCaseTextAreaProps> = ({ onChange, value, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const upperValue = e.target.value.toUpperCase();

    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: upperValue,
      },
    };

    if (onChange) {
      onChange(newEvent as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  return (
    <textarea
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
};
