import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { getRegistros, Registro, FiltrosRegistro } from '../../services/registroService';

const HistorialRegistroPage = () => {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosRegistro>({ page: 1, limit: 50 });
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    cargarRegistros();
  }, [filtros]);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const data = await getRegistros(filtros);
      setRegistros(data.registros);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    setFiltros({ ...filtros, busqueda, page: 1 });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ page: 1, limit: 50 });
    setBusqueda('');
  };

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'PENDIENTE_ASENTAMIENTO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ASENTADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CERTIFICADO_GENERADO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ENVIADO_FIRMA': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CERTIFICADO_FIRMADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'LISTO_PARA_ENTREGA': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'ENTREGADO': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoTexto = (estado: string): string => {
    switch (estado) {
      case 'PENDIENTE_ASENTAMIENTO': return 'Pendiente';
      case 'ASENTADO': return 'Asentado';
      case 'CERTIFICADO_GENERADO': return 'Cert. Generado';
      case 'ENVIADO_FIRMA': return 'En Firma';
      case 'CERTIFICADO_FIRMADO': return 'Firmado';
      case 'LISTO_PARA_ENTREGA': return 'Listo Entrega';
      case 'ENTREGADO': return 'Entregado';
      default: return estado;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/registro')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Volver al Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Registros</h1>
        <p className="text-gray-600">
          Total: {pagination.total} registro(s) | Página {pagination.page} de {pagination.totalPages}
        </p>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Buscar por número de registro o título..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleBuscar}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiFilter />
            Filtros
          </button>
          {(filtros.busqueda || filtros.tipoObra || filtros.fechaDesde) && (
            <button
              onClick={handleLimpiarFiltros}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <FiX />
              Limpiar
            </button>
          )}
        </div>

        {/* Panel de Filtros Avanzados */}
        {mostrarFiltros && (
          <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Obra
              </label>
              <select
                value={filtros.tipoObra || ''}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipoObra: e.target.value || undefined, page: 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="Literaria">Literaria</option>
                <option value="Musical">Musical</option>
                <option value="Audiovisual">Audiovisual</option>
                <option value="Artística">Artística</option>
                <option value="Software">Software</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde || ''}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaDesde: e.target.value || undefined, page: 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta || ''}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaHasta: e.target.value || undefined, page: 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Registros */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registros.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-blue-600">
                          {registro.numeroRegistro}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {registro.tituloObra}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{registro.tipoObra}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {registro.formularioProducto.formulario.clientes[0]?.cliente.nombrecompleto}
                        </div>
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
                        {new Date(registro.fechaAsentamiento).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/registro/${registro.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {registros.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron registros</p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setFiltros({ ...filtros, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setFiltros({ ...filtros, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistorialRegistroPage;
