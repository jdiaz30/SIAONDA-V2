import { useState } from 'react';

interface ProductoSeleccionado {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
}

interface ObraEnCarrito {
  id: string; // UUID temporal
  producto: ProductoSeleccionado;
  datosFormulario: any;
}

interface CarritoObrasStepProps {
  obrasEnCarrito: ObraEnCarrito[];
  onAgregarObra: () => void;
  onEditarObra: (obraId: string) => void;
  onEliminarObra: (obraId: string) => void;
  onContinuar: () => void;
  onVolver: () => void;
  esProduccion?: boolean;
  tituloProduccion?: string;
  precioProduccion?: number;
}

const CarritoObrasStep = ({
  obrasEnCarrito,
  onAgregarObra,
  onEditarObra,
  onEliminarObra,
  onContinuar,
  onVolver,
  esProduccion = false,
  tituloProduccion = '',
  precioProduccion = 0
}: CarritoObrasStepProps) => {
  const [obraAEliminar, setObraAEliminar] = useState<string | null>(null);

  const calcularTotal = (): number => {
    if (obrasEnCarrito.length === 0) return 0;
    // Si es producción, el precio es fijo independiente del número de obras
    if (esProduccion) return precioProduccion;
    // Si no es producción, sumar el precio de cada obra
    return obrasEnCarrito.reduce((sum, obra) => {
      const precio = Number(obra.producto.precio) || 0;
      return sum + precio;
    }, 0);
  };

  const minimoObras = esProduccion ? 6 : 1;
  const maximoObras = esProduccion ? 15 : Infinity;
  const puedeAgregarMas = obrasEnCarrito.length < maximoObras;
  const puedeContinuar = obrasEnCarrito.length >= minimoObras;

  const confirmarEliminar = (obraId: string) => {
    setObraAEliminar(obraId);
  };

  const handleEliminar = () => {
    if (obraAEliminar) {
      onEliminarObra(obraAEliminar);
      setObraAEliminar(null);
    }
  };

  const getValorCampo = (datos: any, campo: string): string => {
    return datos?.camposEspecificos?.[campo] || 'N/A';
  };

  const formatearPrecio = (precio: number | string): string => {
    return Number(precio || 0).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${
        esProduccion
          ? 'bg-gradient-to-r from-purple-50 to-purple-100'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            {esProduccion && (
              <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold mb-2">
                PRODUCCIÓN
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {esProduccion ? tituloProduccion : 'Carrito de Obras'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {obrasEnCarrito.length} {obrasEnCarrito.length === 1 ? 'obra' : 'obras'}
              {esProduccion && ` (mínimo ${minimoObras}, máximo ${maximoObras})`}
            </p>
            {esProduccion && obrasEnCarrito.length < minimoObras && (
              <p className="text-sm text-amber-600 font-medium mt-1">
                Faltan {minimoObras - obrasEnCarrito.length} obras para continuar
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {esProduccion ? 'Precio de la producción' : 'Total a pagar'}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              RD$ {formatearPrecio(calcularTotal())}
            </p>
            {esProduccion && (
              <p className="text-xs text-gray-500 mt-1">
                (Precio fijo por toda la producción)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lista de obras */}
      <div className="p-6">
        {obrasEnCarrito.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay obras en el carrito</h3>
            <p className="mt-2 text-sm text-gray-500">
              Agregue al menos una obra para continuar con el registro
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {obrasEnCarrito.map((obra, index) => (
              <div
                key={obra.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header de la obra */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{obra.producto.nombre}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          {obra.producto.codigo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{obra.producto.categoria}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-lg font-bold text-gray-900">
                      ${formatearPrecio(obra.producto.precio)}
                    </p>
                  </div>
                </div>

                {/* Detalles de la obra */}
                <div className="bg-gray-50 rounded-md p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {/* Mostrar título si existe */}
                    {getValorCampo(obra.datosFormulario, 'titulo') !== 'N/A' && (
                      <div>
                        <span className="font-medium text-gray-700">Título:</span>
                        <span className="text-gray-900 ml-2">
                          {getValorCampo(obra.datosFormulario, 'titulo')}
                        </span>
                      </div>
                    )}

                    {/* Mostrar ritmo si existe (para obras musicales) */}
                    {getValorCampo(obra.datosFormulario, 'ritmo') !== 'N/A' && (
                      <div>
                        <span className="font-medium text-gray-700">Ritmo:</span>
                        <span className="text-gray-900 ml-2">
                          {getValorCampo(obra.datosFormulario, 'ritmo')}
                        </span>
                      </div>
                    )}

                    {/* Mostrar género si existe */}
                    {getValorCampo(obra.datosFormulario, 'genero') !== 'N/A' && (
                      <div>
                        <span className="font-medium text-gray-700">Género:</span>
                        <span className="text-gray-900 ml-2">
                          {getValorCampo(obra.datosFormulario, 'genero')}
                        </span>
                      </div>
                    )}

                    {/* Contar campos completados */}
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-gray-600 text-xs">
                        {Object.keys(obra.datosFormulario?.camposEspecificos || {}).length} campos completados
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditarObra(obra.id)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => confirmarEliminar(obra.id)}
                    className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón Agregar Otra Obra */}
        <div className="mt-6">
          <button
            onClick={onAgregarObra}
            disabled={!puedeAgregarMas}
            className={`w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium shadow-md ${
              puedeAgregarMas
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {esProduccion ? `Agregar Obra a la Producción (${obrasEnCarrito.length}/${maximoObras})` : 'Agregar Otra Obra al Carrito'}
          </button>
          {!puedeAgregarMas && esProduccion && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Has alcanzado el máximo de 15 obras permitidas en una producción
            </p>
          )}
        </div>
      </div>

      {/* Footer con botones */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between gap-4 rounded-b-lg">
        <button
          onClick={onVolver}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <button
          onClick={onContinuar}
          disabled={!puedeContinuar}
          title={
            !puedeContinuar && esProduccion
              ? `Necesitas al menos ${minimoObras} obras para continuar`
              : ''
          }
          className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
            !puedeContinuar
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
          }`}
        >
          {esProduccion ? 'Continuar a Revisión' : 'Continuar'}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Modal de confirmación de eliminación */}
      {obraAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea eliminar esta obra del carrito? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setObraAEliminar(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoObrasStep;
