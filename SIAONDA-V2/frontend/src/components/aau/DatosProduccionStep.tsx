import { useState } from 'react';

interface DatosProduccionStepProps {
  productoNombre: string;
  tituloProduccionInicial?: string;
  onContinue: (tituloProduccion: string) => void;
  onBack: () => void;
}

const DatosProduccionStep = ({
  productoNombre,
  tituloProduccionInicial = '',
  onContinue,
  onBack
}: DatosProduccionStepProps) => {
  const [tituloProduccion, setTituloProduccion] = useState(tituloProduccionInicial);
  const [error, setError] = useState('');

  const handleContinue = () => {
    // Validar que el título no esté vacío
    if (!tituloProduccion.trim()) {
      setError('El título de la producción es requerido');
      return;
    }

    if (tituloProduccion.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres');
      return;
    }

    onContinue(tituloProduccion.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Datos de la Producción</h2>
        <p className="text-blue-100">
          Una producción agrupa varias obras bajo un mismo título (mínimo 6, máximo 15 obras)
        </p>
      </div>

      {/* Información del tipo de producción */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900">Tipo de Producción</h3>
            <p className="text-blue-700 mt-1">{productoNombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Título de la Producción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la Producción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tituloProduccion}
              onChange={(e) => {
                setTituloProduccion(e.target.value);
                setError('');
              }}
              placeholder="Ej: SOMOS UNO EN SU MANO"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={500}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Este es el título general que aparecerá en el certificado de producción
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Información Importante</h4>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Deberás agregar entre <strong>6 y 15 obras individuales</strong> a esta producción
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Todas las obras deben ser del mismo tipo de producción
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Los autores serán los mismos para todas las obras de la producción
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Se paga un <strong>solo precio</strong> por toda la producción completa
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continuar a Obras →
        </button>
      </div>
    </div>
  );
};

export default DatosProduccionStep;
