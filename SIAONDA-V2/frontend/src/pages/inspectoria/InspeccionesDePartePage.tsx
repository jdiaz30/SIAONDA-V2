import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiEye, FiFilter, FiSearch } from 'react-icons/fi';

interface Caso {
  id: number;
  codigo: string;
  tipoCaso: string;
  origenCaso: string;
  prioridad: string;
  descripcion: string | null;
  observaciones: string | null;
  creadoEn: string;
  estadoCaso: {
    id: number;
    nombre: string;
  };
  empresa: {
    id: number;
    nombreEmpresa: string;
    direccion: string | null;
  };
  factura: {
    id: number;
    codigo: string;
    total: number;
  } | null;
  asignadoPor: {
    id: number;
    nombrecompleto: string;
  } | null;
  inspectorAsignado: {
    id: number;
    nombrecompleto: string;
  } | null;
}

export default function InspeccionesDePartePage() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  useEffect(() => {
    cargarCasos();
  }, [pagination.page, filtroEstado]);

  const cargarCasos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inspectoria/casos', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          tipoCaso: 'DENUNCIA',
          estadoCasoId: filtroEstado === 'TODOS' ? undefined : filtroEstado
        }
      });

      setCasos(response.data.data || []);
      setPagination(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      });
    } catch (error) {
      console.error('Error cargando casos:', error);
      alert('Error al cargar inspecciones de parte');
    } finally {
      setLoading(false);
    }
  };

  const casosFiltrados = casos.filter(caso =>
    caso.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    caso.empresa.nombreEmpresa.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASIGNADO':
        return 'bg-blue-100 text-blue-800';
      case 'EN_PROCESO':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Inspecciones de Parte</h1>
        <p className="text-gray-600 mt-2">Casos de inspección generados desde denuncias ciudadanas</p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="1">Pendiente</option>
              <option value="2">Asignado</option>
              <option value="3">En Proceso</option>
              <option value="4">Completado</option>
              <option value="5">Cerrado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900">
            {casos.filter(c => c.estadoCaso.nombre === 'PENDIENTE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Asignados</p>
          <p className="text-2xl font-bold text-gray-900">
            {casos.filter(c => c.estadoCaso.nombre === 'ASIGNADO').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <p className="text-sm text-gray-600">En Proceso</p>
          <p className="text-2xl font-bold text-gray-900">
            {casos.filter(c => c.estadoCaso.nombre === 'EN_PROCESO').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Completados</p>
          <p className="text-2xl font-bold text-gray-900">
            {casos.filter(c => c.estadoCaso.nombre === 'COMPLETADO').length}
          </p>
        </div>
      </div>

      {/* Tabla de Casos */}
      {casosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiSearch className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron inspecciones
          </h3>
          <p className="text-gray-600">
            {busqueda ? 'Intenta con otros términos de búsqueda' : 'Aún no hay inspecciones de parte registradas'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código / Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignado A
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {casosFiltrados.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{caso.codigo}</div>
                      <div className="text-sm text-gray-500">{caso.empresa.nombreEmpresa}</div>
                      {caso.empresa.direccion && (
                        <div className="text-xs text-gray-400 mt-1">{caso.empresa.direccion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(caso.estadoCaso.nombre)}`}>
                        {caso.estadoCaso.nombre.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border ${getPrioridadColor(caso.prioridad)}`}>
                        {caso.prioridad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.inspectorAsignado?.nombrecompleto || (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caso.creadoEn).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/inspectoria/casos/${caso.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <FiEye />
                        Ver Detalles
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
                {pagination.total} casos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 border rounded-lg bg-blue-50 text-blue-600 font-semibold">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
