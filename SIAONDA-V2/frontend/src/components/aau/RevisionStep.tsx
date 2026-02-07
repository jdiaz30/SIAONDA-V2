import { useState } from 'react';
import { FiCheckCircle, FiUser, FiFileText, FiAlertCircle, FiShoppingCart, FiEdit3, FiPackage } from 'react-icons/fi';
import FirmaDigital from '../formularios/FirmaDigital';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
}

interface Autor {
  id: number;
  cliente: any;
  rol: string;
  orden: number;
}

interface ObraEnCarrito {
  id: string;
  producto: Producto;
  datosFormulario: {
    camposEspecificos: Record<string, any>;
    camposMetadata?: Record<string, { titulo: string; tipo: string }>;
    archivos?: File[];
  };
}

interface Props {
  autores: Autor[];
  obras: ObraEnCarrito[]; // Ahora recibe un array de obras
  onEnviar: () => void;
  onVolver: () => void;
  esProduccion?: boolean;
  tituloProduccion?: string;
  precioProduccion?: number;
}

const ROLES_LABELS: Record<string, string> = {
  AUTOR_PRINCIPAL: 'Autor Principal',
  COAUTOR: 'Coautor',
  COMPOSITOR: 'Compositor',
  INTERPRETE: 'Intérprete',
  EDITOR: 'Editor',
  PRODUCTOR: 'Productor',
  ARREGLISTA: 'Arreglista',
  DIRECTOR: 'Director',
  OTRO: 'Otro',
};

const RevisionStep = ({
  autores,
  obras,
  onEnviar,
  onVolver,
  esProduccion = false,
  tituloProduccion = '',
  precioProduccion = 0
}: Props) => {
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [firmaCliente, setFirmaCliente] = useState('');

  const handleEnviar = async () => {
    if (!confirmado) {
      alert('Debe confirmar que la informacion es correcta');
      return;
    }

    if (!firmaCliente) {
      alert('Debe capturar la firma del cliente antes de enviar');
      return;
    }

    setEnviando(true);
    try {
      await onEnviar();
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Hubo un error al enviar el formulario');
    } finally {
      setEnviando(false);
    }
  };

  // Calcular total
  const calcularTotal = (): number => {
    if (obras.length === 0) return 0;
    // Si es producción, el precio es fijo
    if (esProduccion) return precioProduccion;
    // Si no, sumar precios individuales
    return obras.reduce((sum, obra) => {
      const precio = Number(obra.producto.precio) || 0;
      return sum + precio;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <FiCheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {esProduccion ? 'Revision Final - Produccion' : 'Paso 3: Revision Final'}
            </h3>
            <p className="text-sm text-blue-800">
              Revise cuidadosamente toda la informacion antes de enviar. Una vez enviado, el formulario pasara a
              estado PENDIENTE y se generara una factura para pago en caja.
            </p>
            <p className="text-sm font-semibold text-blue-900 mt-2">
              Total de obras: {obras.length} {obras.length === 1 ? 'obra' : 'obras'}
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Producción */}
      {esProduccion && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiPackage className="text-4xl" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{tituloProduccion}</h2>
              <p className="text-purple-100 mb-4">
                Produccion de {obras.length} obras - {obras[0]?.producto.nombre}
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-purple-200 text-sm">Tipo de produccion</p>
                    <p className="font-semibold">{obras[0]?.producto.codigo}</p>
                  </div>
                  <div>
                    <p className="text-purple-200 text-sm">Cantidad de obras</p>
                    <p className="font-semibold">{obras.length} obras</p>
                  </div>
                  <div>
                    <p className="text-purple-200 text-sm">Precio total</p>
                    <p className="font-semibold text-xl">RD$ {precioProduccion.toLocaleString('es-DO')}</p>
                  </div>
                </div>
                <p className="text-purple-100 text-sm mt-3">
                  Precio fijo por toda la produccion - Cada obra tendra su numero de registro individual
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección 1: Autores */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <FiUser className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Autores y Colaboradores</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {autores.map((autor, index) => (
              <div key={autor.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{autor.cliente.nombrecompleto}</p>
                  <p className="text-sm text-gray-600">Cédula: {autor.cliente.identificacion}</p>
                  {autor.cliente.telefono && (
                    <p className="text-sm text-gray-500">Tel: {autor.cliente.telefono}</p>
                  )}
                </div>
                <div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {ROLES_LABELS[autor.rol] || autor.rol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección 2: Obras en el Carrito */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <FiShoppingCart className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Obras a Registrar ({obras.length})</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {obras.map((obra, index) => (
              <div key={obra.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header de la obra */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{obra.producto.nombre}</h3>
                        <p className="text-sm text-gray-600">{obra.producto.codigo} - {obra.producto.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        RD$ {Number(obra.producto.precio).toLocaleString('es-DO')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datos de la obra */}
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(obra.datosFormulario.camposEspecificos || {}).map(([campo, valor]) => {
                      // No mostrar campos vacíos, booleanos false, o archivos
                      if (!valor || valor === false || typeof valor === 'object') return null;

                      // Ignorar claves con prefijo campo_ (son duplicadas)
                      if (campo.startsWith('campo_')) return null;

                      // Obtener el título desde metadata o generar desde el nombre del campo
                      const metadata = obra.datosFormulario.camposMetadata?.[campo];
                      const titulo = metadata?.titulo || campo
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                      return (
                        <div key={campo} className={typeof valor === 'string' && valor.length > 100 ? 'md:col-span-2' : ''}>
                          <p className="text-xs text-gray-500 mb-1">{titulo}</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {typeof valor === 'boolean' ? (valor ? 'Si' : 'No') : String(valor)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Archivos de esta obra */}
                  {obra.datosFormulario.archivos && obra.datosFormulario.archivos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Archivos Adjuntos ({obra.datosFormulario.archivos.length})
                      </p>
                      <div className="space-y-2">
                        {obra.datosFormulario.archivos.map((archivo, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                          >
                            <FiFileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{archivo.name}</p>
                              <p className="text-gray-500">
                                {(archivo.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monto Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-blue-100 mb-1">Monto Total a Pagar</p>
            <p className="text-4xl font-bold">RD$ {calcularTotal().toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-blue-100 mt-2">
              {obras.length} {obras.length === 1 ? 'obra' : 'obras'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">
              El pago se realizara en Caja una vez<br />enviado el formulario
            </p>
          </div>
        </div>
      </div>

      {/* Firma Digital del Cliente */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiEdit3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Firma del Cliente</h3>
            <p className="text-sm text-gray-600">
              Solicite al cliente que firme en el recuadro usando la tableta o dispositivo de firma
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <FirmaDigital
            onFirmaChange={(firma) => setFirmaCliente(firma)}
            firmaInicial={firmaCliente}
          />
        </div>
      </div>

      {/* Confirmación */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <FiAlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-3">Declaracion Jurada</h3>
            <p className="text-sm text-yellow-800 mb-4">
              Declaro bajo fe de juramento que toda la informacion contenida en este formulario es veridica y correcta.
              Acepto que cualquier informacion falsa puede resultar en la anulacion del registro.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <span className="font-medium text-yellow-900">
                Confirmo que he revisado toda la informacion y acepto los terminos de esta declaracion jurada.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={onVolver}
          disabled={enviando}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Carrito
        </button>

        <button
          onClick={handleEnviar}
          disabled={!confirmado || enviando}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
        >
          {enviando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <FiCheckCircle className="w-5 h-5" />
              Enviar Formulario
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RevisionStep;
