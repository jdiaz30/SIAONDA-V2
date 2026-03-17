import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiCheckCircle, FiClock, FiFileText, FiList, FiSend, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getDashboard, getRegistros, DashboardData, Registro } from '../../services/registroService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';
import { getEstadoTexto, getEstadoColor } from '../../utils/estadosRegistro';

const DashboardRegistroPage = () => {
  const navigate = useNavigate();
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo REGISTRO
  if (!canAccessModule('REGISTRO')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo de Registro de Obras. Esta área es solo para personal de Registro." />
      </div>
    );
  }
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [currentPage, itemsPerPage, searchQuery]);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarRegistros = async () => {
    try {
      setLoadingRegistros(true);
      const data = await getRegistros({
        page: currentPage,
        limit: itemsPerPage,
        busqueda: searchQuery || undefined
      });
      setRegistros(data.registros);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No se pudo cargar el dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Obras</h1>
        <p className="text-gray-600">Panel de control del módulo de registro</p>
      </div>

      {/* Resumen Año Actual */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <FiBook className="text-4xl" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total de Registros {dashboard.anioActual}</p>
            <p className="text-4xl font-bold">{dashboard.totalAnioActual.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate('/registro/pendientes')}
          className="group bg-white p-6 rounded-xl hover:shadow-xl transition-all border border-gray-200 text-left transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <FiClock className="text-2xl text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Pendientes</h3>
              <p className="text-sm text-gray-600">Obras por asentar</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/registro/certificados')}
          className="group bg-white p-6 rounded-xl hover:shadow-xl transition-all border border-gray-200 text-left transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <FiFileText className="text-2xl text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Certificados</h3>
              <p className="text-sm text-gray-600">Generar certificados</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/registro/historial')}
          className="group bg-white p-6 rounded-xl hover:shadow-xl transition-all border border-gray-200 text-left transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
              <FiList className="text-2xl text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Historial</h3>
              <p className="text-sm text-gray-600">Ver todos los registros</p>
            </div>
          </div>
        </button>
      </div>

      {/* Estadísticas por Estado */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Distribución por Estado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboard.estadisticas.map((stat) => (
            <div
              key={stat.estado}
              className={`p-4 rounded-lg border ${getEstadoColor(stat.estado)}`}
            >
              <p className="text-sm font-medium mb-1">{getEstadoTexto(stat.estado)}</p>
              <p className="text-2xl font-bold">{stat.cantidad}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Registros con Paginación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registros</h2>
              <p className="text-sm text-gray-500 mt-1">Total: {totalItems.toLocaleString()} registros</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mostrar:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={4}>4</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número de registro, título u autor..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </button>
          </form>
        </div>

        {loadingRegistros ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {registro.numeroRegistro}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{registro.tituloObra}</div>
                        <div className="text-xs text-gray-500">
                          {registro.formularioProducto.formulario.clientes[0]?.cliente.nombrecompleto}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{registro.tipoObra}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getEstadoColor(
                            registro.estado.nombre
                          )}`}
                        >
                          {getEstadoTexto(registro.estado.nombre)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registro.fechaAsentamiento
                          ? new Date(registro.fechaAsentamiento).toLocaleDateString('es-DO')
                          : new Date(registro.creadoEn).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/registro/${registro.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {registros.length === 0 && (
                <div className="text-center py-12">
                  <FiBook className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No hay registros disponibles</p>
                </div>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Primera
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="text-lg" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="text-lg" />
                  </button>

                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardRegistroPage;
