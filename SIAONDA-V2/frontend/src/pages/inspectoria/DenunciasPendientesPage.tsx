import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiAlertCircle, FiEye, FiCheckCircle, FiFileText } from 'react-icons/fi';

interface Denuncia {
  id: number;
  codigo: string;
  denuncianteNombre: string;
  denuncianteTelefono: string | null;
  denuncianteEmail: string | null;
  empresaDenunciada: string;
  direccionEmpresa: string | null;
  descripcionHechos: string;
  estadoDenuncia: {
    nombre: string;
  };
  factura: {
    codigo: string;
    total: number;
  } | null;
  recibidoPor: {
    nombrecompleto: string;
  };
}

export default function DenunciasPendientesPage() {
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<Denuncia | null>(null);
  const [mostrarFormularioCaso, setMostrarFormularioCaso] = useState(false);
  const [descripcionCaso, setDescripcionCaso] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  useEffect(() => {
    cargarDenuncias();
  }, [pagination.page]);

  const cargarDenuncias = async () => {
    try {
      setLoading(true);
      const response = await api.get('/denuncias/inspectoria/pagadas', {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });

      setDenuncias(response.data.data.denuncias);
      setPagination({
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages
      });
    } catch (error) {
      console.error('Error cargando denuncias:', error);
      alert('Error al cargar denuncias pagadas');
    } finally {
      setLoading(false);
    }
  };

  const abrirFormularioCaso = (denuncia: Denuncia) => {
    setDenunciaSeleccionada(denuncia);
    setDescripcionCaso(denuncia.descripcionHechos); // Pre-llenar con la descripción de la denuncia
    setMostrarFormularioCaso(true);
  };

  const convertirEnCaso = async () => {
    if (!denunciaSeleccionada) return;

    if (!descripcionCaso.trim()) {
      alert('⚠️ Debe proporcionar una descripción para el caso');
      return;
    }

    try {
      setProcesando(denunciaSeleccionada.id);
      const response = await api.post(`/denuncias/${denunciaSeleccionada.id}/convertir-caso`, {
        descripcionCaso: descripcionCaso
      });

      alert(`✅ ${response.data.message}\n\nCódigo del caso: ${response.data.data.caso.codigo}`);

      // Cerrar modal y limpiar
      setMostrarFormularioCaso(false);
      setDenunciaSeleccionada(null);
      setDescripcionCaso('');

      // Recargar lista
      cargarDenuncias();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.response?.data?.message || 'Error al crear caso'}`);
    } finally {
      setProcesando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Denuncias Pendientes de Atención</h1>
        <p className="text-gray-600 mt-2">Denuncias pagadas listas para convertir en casos de inspección</p>
      </div>

      {denuncias.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay denuncias pendientes
          </h3>
          <p className="text-gray-600">
            Todas las denuncias pagadas han sido procesadas
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Denunciante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa Denunciada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recibido Por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {denuncias.map((denuncia) => (
                  <tr key={denuncia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{denuncia.codigo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{denuncia.denuncianteNombre}</div>
                      <div className="text-sm text-gray-500">{denuncia.denuncianteTelefono || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{denuncia.empresaDenunciada}</div>
                      {denuncia.direccionEmpresa && (
                        <div className="text-sm text-gray-500">{denuncia.direccionEmpresa}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {denuncia.factura ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{denuncia.factura.codigo}</div>
                          <div className="text-sm text-green-600">RD$ {denuncia.factura.total.toLocaleString()}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin factura</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {denuncia.recibidoPor.nombrecompleto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setDenunciaSeleccionada(denuncia)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <FiEye />
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => abrirFormularioCaso(denuncia)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FiCheckCircle />
                        Crear Caso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} denuncias
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de formulario para crear caso */}
      {mostrarFormularioCaso && denunciaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Crear Caso de Inspección
                </h2>
                <button
                  onClick={() => {
                    setMostrarFormularioCaso(false);
                    setDenunciaSeleccionada(null);
                    setDescripcionCaso('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Denuncia:</strong> {denunciaSeleccionada.codigo}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Empresa:</strong> {denunciaSeleccionada.empresaDenunciada}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Caso <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={descripcionCaso}
                    onChange={(e) => setDescripcionCaso(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describa el caso de inspección que se va a generar..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Esta descripción se usará como la descripción principal del caso de inspección
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setMostrarFormularioCaso(false);
                      setDenunciaSeleccionada(null);
                      setDescripcionCaso('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={convertirEnCaso}
                    disabled={procesando === denunciaSeleccionada.id || !descripcionCaso.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {procesando === denunciaSeleccionada.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creando Caso...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        Crear Caso
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {denunciaSeleccionada && !mostrarFormularioCaso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalles de la Denuncia
                </h2>
                <button
                  onClick={() => setDenunciaSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Código</label>
                    <p className="text-gray-900 font-semibold">{denunciaSeleccionada.codigo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <p className="text-gray-900">{denunciaSeleccionada.estadoDenuncia.nombre}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Datos del Denunciante</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nombre</label>
                      <p className="text-gray-900">{denunciaSeleccionada.denuncianteNombre}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-gray-900">{denunciaSeleccionada.denuncianteTelefono || 'No especificado'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{denunciaSeleccionada.denuncianteEmail || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Empresa Denunciada</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nombre</label>
                      <p className="text-gray-900">{denunciaSeleccionada.empresaDenunciada}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dirección</label>
                      <p className="text-gray-900">{denunciaSeleccionada.direccionEmpresa || 'No especificada'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Descripción de los Hechos</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{denunciaSeleccionada.descripcionHechos}</p>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDenunciaSeleccionada(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setDenunciaSeleccionada(null);
                      abrirFormularioCaso(denunciaSeleccionada);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Crear Caso de Inspección
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
