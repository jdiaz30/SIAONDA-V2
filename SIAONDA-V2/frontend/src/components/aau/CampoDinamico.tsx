import { ChangeEvent } from 'react';

interface TipoCampo {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Campo {
  id: number;
  campo: string;
  titulo: string;
  descripcion: string | null;
  placeholder: string | null;
  opciones: string | null;
  requerido: boolean;
  orden: number;
  grupo: string | null;
  tipo: TipoCampo;
}

interface Props {
  campo: Campo;
  valor: any;
  onChange: (campo: string, valor: any) => void;
  visible?: boolean;
}

const CampoDinamico = ({ campo, valor, onChange, visible = true }: Props) => {
  if (!visible) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value, type } = e.target;

    if (type === 'checkbox') {
      onChange(campo.campo, (e.target as HTMLInputElement).checked);
    } else if (type === 'number') {
      onChange(campo.campo, value ? parseFloat(value) : '');
    } else {
      // DEBUG: Log cuando se cambia tipo_obra
      if (campo.campo === 'tipo_obra') {
        console.log('🔍 CampoDinamico: Cambio en tipo_obra', {
          campo: campo.campo,
          valor: value,
          campoId: campo.id
        });
      }
      onChange(campo.campo, value);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange(campo.campo, e.target.files[0]);
    }
  };

  // Renderizar según el tipo de campo
  const renderInput = () => {
    switch (campo.tipo.nombre) {
      case 'texto':
        // Si el título contiene "descripción" o "observaciones", usar textarea
        const usarTextarea = campo.titulo.toLowerCase().includes('descripción') ||
                            campo.titulo.toLowerCase().includes('observaciones') ||
                            campo.campo.includes('descripcion');

        if (usarTextarea) {
          return (
            <div>
              <textarea
                id={campo.campo}
                name={campo.campo}
                value={valor || ''}
                onChange={handleChange}
                placeholder={campo.placeholder || ''}
                required={campo.requerido}
                maxLength={400}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {(valor || '').length}/400 caracteres
              </div>
            </div>
          );
        }

        return (
          <input
            type="text"
            id={campo.campo}
            name={campo.campo}
            value={valor || ''}
            onChange={handleChange}
            placeholder={campo.placeholder || ''}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'numerico':
        return (
          <input
            type="number"
            id={campo.campo}
            name={campo.campo}
            value={valor || ''}
            onChange={handleChange}
            placeholder={campo.placeholder || ''}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'listado':
        // Las opciones están en el campo opciones separadas por coma, o en descripcion separadas por |
        const opcionesStr = campo.opciones || campo.descripcion || '';
        const separador = campo.opciones ? ',' : '|';
        const opciones = opcionesStr ? opcionesStr.split(separador) : [];
        return (
          <select
            id={campo.campo}
            name={campo.campo}
            value={valor || ''}
            onChange={handleChange}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{campo.placeholder || 'Seleccione una opción'}</option>
            {opciones.map((opcion, index) => (
              <option key={index} value={opcion.trim()}>
                {opcion.trim()}
              </option>
            ))}
          </select>
        );

      case 'fecha':
        return (
          <input
            type="date"
            id={campo.campo}
            name={campo.campo}
            value={valor || ''}
            onChange={handleChange}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={campo.campo}
              name={campo.campo}
              checked={valor || false}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={campo.campo} className="ml-2 text-sm text-gray-700">
              Sí
            </label>
          </div>
        );

      case 'archivo':
        return (
          <div>
            <input
              type="file"
              id={campo.campo}
              name={campo.campo}
              onChange={handleFileChange}
              accept={campo.descripcion || undefined}
              required={campo.requerido}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {campo.descripcion && (
              <p className="text-xs text-gray-500 mt-1">
                Formatos permitidos: {campo.descripcion}
              </p>
            )}
            {valor && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Archivo seleccionado: {valor.name}
              </p>
            )}
          </div>
        );

      case 'divisor':
        return null; // El divisor se renderiza de manera especial en el componente padre

      default:
        return (
          <input
            type="text"
            id={campo.campo}
            name={campo.campo}
            value={valor || ''}
            onChange={handleChange}
            placeholder={campo.placeholder || ''}
            required={campo.requerido}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  // Si es un divisor, renderizar como encabezado de sección
  if (campo.tipo.nombre === 'divisor') {
    return (
      <div className="pt-6 pb-2 border-b-2 border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">{campo.titulo}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={campo.campo} className="block text-sm font-medium text-gray-700">
        {campo.titulo}
        {campo.requerido && <span className="text-red-600 ml-1">*</span>}
      </label>

      {renderInput()}

      {campo.descripcion && campo.tipo.nombre !== 'listado' && campo.tipo.nombre !== 'archivo' && (
        <p className="text-xs text-gray-500 mt-1">{campo.descripcion}</p>
      )}
    </div>
  );
};

export default CampoDinamico;
