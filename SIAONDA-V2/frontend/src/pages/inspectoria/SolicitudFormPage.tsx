import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  crearSolicitud,
  buscarEmpresaPorRNC,
  obtenerCategoriasIRC,
  EmpresaInspeccionada,
  CategoriaIRC
} from '../../services/inspectoriaService';
import { formatRNC } from '../../utils/formatters';

export default function SolicitudFormPage() {
  const navigate = useNavigate();

  const [tipoSolicitud, setTipoSolicitud] = useState<'REGISTRO_NUEVO' | 'RENOVACION'>('REGISTRO_NUEVO');
  const [categorias, setCategorias] = useState<CategoriaIRC[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Para buscar empresa existente (renovación)
  const [rncBusqueda, setRncBusqueda] = useState('');
  const [empresaEncontrada, setEmpresaEncontrada] = useState<EmpresaInspeccionada | null>(null);

  // Para registro nuevo
  const [datosNuevaEmpresa, setDatosNuevaEmpresa] = useState({
    nombreEmpresa: '',
    nombreComercial: '',
    rnc: '',
    categoriaIrcId: 0
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const data = await obtenerCategoriasIRC();
      setCategorias(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const handleBuscarEmpresa = async () => {
    if (!rncBusqueda) {
      setError('Ingrese un RNC para buscar');
      return;
    }

    try {
      setBuscandoEmpresa(true);
      setError(null);
      setEmpresaEncontrada(null);

      const empresa = await buscarEmpresaPorRNC(rncBusqueda);

      if (empresa) {
        setEmpresaEncontrada(empresa);

        // Verificar si ya está registrado
        if (!empresa.registrado) {
          setError('Esta empresa no está registrada. Use "Registro Nuevo" en su lugar.');
          setEmpresaEncontrada(null);
        }
      } else {
        setError('No se encontró ninguna empresa con ese RNC. Use "Registro Nuevo" para crear una nueva.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar empresa');
    } finally {
      setBuscandoEmpresa(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (tipoSolicitud === 'RENOVACION') {
      if (!empresaEncontrada) {
        setError('Debe buscar y seleccionar una empresa existente para renovación');
        return;
      }
    } else {
      if (!datosNuevaEmpresa.nombreEmpresa || !datosNuevaEmpresa.rnc || !datosNuevaEmpresa.categoriaIrcId) {
        setError('Complete todos los campos obligatorios');
        return;
      }

      // Validar formato RNC
      const rncRegex = /^\d{3}-?\d{5}-?\d{1}$/;
      if (!rncRegex.test(datosNuevaEmpresa.rnc)) {
        setError('El RNC debe tener el formato XXX-XXXXX-X');
        return;
      }
    }

    try {
      setLoading(true);

      const solicitudData: any = {
        tipoSolicitud
      };

      if (tipoSolicitud === 'RENOVACION') {
        solicitudData.empresaId = empresaEncontrada!.id;
      } else {
        solicitudData.rnc = datosNuevaEmpresa.rnc;
        solicitudData.nombreEmpresa = datosNuevaEmpresa.nombreEmpresa;
        solicitudData.nombreComercial = datosNuevaEmpresa.nombreComercial || null;
        solicitudData.categoriaIrcId = datosNuevaEmpresa.categoriaIrcId;
      }

      const solicitud = await crearSolicitud(solicitudData);

      // Redirigir al workflow de la solicitud creada
      navigate(`/inspectoria/solicitudes/${solicitud.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Registro IRC</h1>
          <p className="text-gray-600">Crear solicitud de registro nuevo o renovación</p>
        </div>
        <button
          onClick={() => navigate('/inspectoria/solicitudes')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Solicitud */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Solicitud</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
              tipoSolicitud === 'REGISTRO_NUEVO' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="tipoSolicitud"
                value="REGISTRO_NUEVO"
                checked={tipoSolicitud === 'REGISTRO_NUEVO'}
                onChange={(e) => {
                  setTipoSolicitud(e.target.value as 'REGISTRO_NUEVO');
                  setEmpresaEncontrada(null);
                  setRncBusqueda('');
                }}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Registro Nuevo</div>
                <div className="text-sm text-gray-500">Primera vez que la empresa se registra</div>
              </div>
            </label>

            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
              tipoSolicitud === 'RENOVACION' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              <input
                type="radio"
                name="tipoSolicitud"
                value="RENOVACION"
                checked={tipoSolicitud === 'RENOVACION'}
                onChange={(e) => {
                  setTipoSolicitud(e.target.value as 'RENOVACION');
                  setDatosNuevaEmpresa({ nombreEmpresa: '', nombreComercial: '', rnc: '', categoriaIrcId: 0 });
                }}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Renovación</div>
                <div className="text-sm text-gray-500">Renovación anual de empresa ya registrada</div>
              </div>
            </label>
          </div>
        </div>

        {/* Renovación - Buscar Empresa */}
        {tipoSolicitud === 'RENOVACION' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Empresa</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RNC de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rncBusqueda}
                    onChange={(e) => setRncBusqueda(formatRNC(e.target.value))}
                    placeholder="XXX-XXXXX-X"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleBuscarEmpresa}
                    disabled={buscandoEmpresa}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {buscandoEmpresa && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Buscar
                  </button>
                </div>
              </div>

              {empresaEncontrada && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">Empresa Encontrada</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-green-700 font-medium">Nombre:</span>
                          <div className="text-green-900">{empresaEncontrada.nombreEmpresa}</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">RNC:</span>
                          <div className="text-green-900">{empresaEncontrada.rnc}</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Categoría:</span>
                          <div className="text-green-900">{empresaEncontrada.categoriaIrc?.codigo} - {empresaEncontrada.categoriaIrc?.nombre}</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Vencimiento:</span>
                          <div className="text-green-900">
                            {empresaEncontrada.fechaVencimiento
                              ? new Date(empresaEncontrada.fechaVencimiento).toLocaleDateString('es-DO')
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registro Nuevo - Datos Básicos */}
        {tipoSolicitud === 'REGISTRO_NUEVO' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Nueva Empresa</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <strong>Nota:</strong> Aquí solo ingresará los datos básicos. Los datos completos de la empresa
                  se completarán en el módulo de Empresas antes de validar la solicitud.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={datosNuevaEmpresa.nombreEmpresa}
                  onChange={(e) => setDatosNuevaEmpresa({ ...datosNuevaEmpresa, nombreEmpresa: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={datosNuevaEmpresa.nombreComercial}
                  onChange={(e) => setDatosNuevaEmpresa({ ...datosNuevaEmpresa, nombreComercial: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RNC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={datosNuevaEmpresa.rnc}
                  onChange={(e) => setDatosNuevaEmpresa({ ...datosNuevaEmpresa, rnc: formatRNC(e.target.value) })}
                  placeholder="XXX-XXXXX-X"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: XXX-XXXXX-X</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría IRC <span className="text-red-500">*</span>
                </label>
                <select
                  value={datosNuevaEmpresa.categoriaIrcId}
                  onChange={(e) => setDatosNuevaEmpresa({ ...datosNuevaEmpresa, categoriaIrcId: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.codigo} - {cat.nombre} (RD$ {cat.precio.toLocaleString('es-DO')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/inspectoria/solicitudes')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (tipoSolicitud === 'RENOVACION' && !empresaEncontrada)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Crear Solicitud
          </button>
        </div>
      </form>
    </div>
  );
}
