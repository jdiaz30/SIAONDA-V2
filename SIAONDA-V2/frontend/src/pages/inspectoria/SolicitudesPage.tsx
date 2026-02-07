import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { obtenerSolicitudes, obtenerTodosCatalogos, SolicitudRegistro, Catalogos } from '../../services/inspectoriaService';

export default function SolicitudesPage() {
  const [searchParams] = useSearchParams();
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || '');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [pagination.page, filtroEstado, filtroTipo]);

  const cargarCatalogos = async () => {
    try {
      const data = await obtenerTodosCatalogos();
      setCatalogos(data);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await obtenerSolicitudes({
        estadoId: filtroEstado ? parseInt(filtroEstado) : undefined,
        tipoSolicitud: filtroTipo || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      setSolicitudes(response.solicitudes);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (orden: number) => {
    const colores: Record<number, string> = {
      1: 'bg-gray-100 text-gray-800',        // PENDIENTE
      2: 'bg-green-100 text-green-800',      // PAGADA
      3: 'bg-blue-100 text-blue-800',        // EN_REVISION
      4: 'bg-yellow-100 text-yellow-800',    // DEVUELTA
      5: 'bg-indigo-100 text-indigo-800',    // ASENTADA
      6: 'bg-purple-100 text-purple-800',    // CERTIFICADO_GENERADO
      7: 'bg-pink-100 text-pink-800',        // FIRMADA
      8: 'bg-orange-100 text-orange-800',    // CERTIFICADO_CARGADO
      9: 'bg-green-100 text-green-800',      // ENTREGADA
      99: 'bg-red-100 text-red-800'          // RECHAZADA
    };
    return colores[orden] || 'bg-gray-100 text-gray-800';
  };

  const solicitudesFiltradas = solicitudes?.filter(s => {
    if (!busqueda) return true;
    return s.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
           s.empresa?.nombreEmpresa.toLowerCase().includes(busqueda.toLowerCase()) ||
           s.empresa?.rnc.includes(busqueda);
  }) || [];

  if (loading && (!solicitudes || solicitudes.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Registro</h1>
          <p className="text-gray-600">Flujo de trabajo de registro y renovación de empresas (PR-DI-002)</p>
        </div>
        <Link
          to="/inspectoria/solicitudes/nueva"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Solicitud
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código, empresa, RNC..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {catalogos?.estadosSolicitud.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="REGISTRO_NUEVO">Registro Nuevo</option>
              <option value="RENOVACION">Renovación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflow Progress Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Flujo de Trabajo (9 Pasos)</h3>
        <div className="flex flex-wrap gap-2">
          {catalogos?.estadosSolicitud.filter(e => e.orden !== 99).map((estado) => (
            <div key={estado.id} className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(estado.orden)}`}>
                {estado.orden}. {estado.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {solicitudesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva solicitud de registro
            </p>
            <div className="mt-6">
              <Link
                to="/inspectoria/solicitudes/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Solicitud
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Recepción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudesFiltradas.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/inspectoria/solicitudes/${solicitud.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {solicitud.codigo}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{solicitud.empresa?.nombreEmpresa}</div>
                          <div className="text-gray-500">RNC: {solicitud.empresa?.rnc}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          solicitud.tipoSolicitud === 'REGISTRO_NUEVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Nuevo' : 'Renovación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(solicitud.estado?.orden || 1)}`}>
                          {solicitud.estado?.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {solicitud.fechaRecepcion
                          ? new Date(solicitud.fechaRecepcion).toLocaleDateString('es-DO')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${((solicitud.estado?.orden || 1) / 9) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{solicitud.estado?.orden}/9</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/inspectoria/solicitudes/${solicitud.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver / Procesar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de <span className="font-medium">{pagination.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPagination({ ...pagination, page: i + 1 })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
