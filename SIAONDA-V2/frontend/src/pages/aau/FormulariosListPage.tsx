import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import aauService, { Formulario } from '../../services/aauService';
import EstadoBadge from '../../components/aau/EstadoBadge';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

const FormulariosListPage = () => {
  const { hasPermission } = usePermissions();

  // Verificar permiso para ver formularios
  if (!hasPermission('atu.formularios.view_all') && !hasPermission('atu.formularios.view_own')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para ver los formularios. Esta funcionalidad es solo para personal de ATU con permisos de visualización." />
      </div>
    );
  }

  const [searchParams] = useSearchParams();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);

  // Paginacion
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || '');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    fetchFormularios();
  }, [filtroEstado, filtroTipo, fechaInicio, fechaFin, buscar]);

  const fetchFormularios = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTipo) params.tipo = filtroTipo;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      if (buscar) params.buscar = buscar;

      const response = await aauService.getFormularios(params);
      const data = response.data || response;

      // Ordenar por fecha mas reciente primero
      const ordenados = data.sort((a: Formulario, b: Formulario) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      setFormularios(ordenados);
      setPaginaActual(1); // Resetear a pagina 1 cuando cambian filtros
    } catch (error) {
      console.error('Error al cargar formularios:', error);
      alert('Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  };

  const getClienteNombre = (formulario: Formulario) => {
    // Si es solicitud IRC, usar nombre de empresa
    if (formulario.solicitudIrc) {
      return formulario.solicitudIrc.nombreEmpresa;
    }
    // Si es formulario de obra, usar cliente
    if (formulario.clientes && formulario.clientes.length > 0) {
      return formulario.clientes[0].cliente.nombrecompleto;
    }
    return 'Sin cliente';
  };

  const getTipo = (formulario: Formulario) => {
    // Si es solicitud IRC, usar categoría IRC
    if (formulario.solicitudIrc) {
      return `IRC - ${formulario.solicitudIrc.categoriaIrc?.codigo || 'N/A'}`;
    }
    // Si es formulario de obra, usar categoría de producto
    if (formulario.productos && formulario.productos.length > 0) {
      return formulario.productos[0].producto.categoria;
    }
    return 'Sin categoría';
  };

  const getEstado = (formulario: Formulario) => {
    // Si es solicitud IRC, usar su propio estado
    if (formulario.solicitudIrc) {
      return formulario.solicitudIrc.estado.nombre;
    }
    // Si es formulario de obra, usar su estado
    return formulario.estado.nombre;
  };

  const getMontoTotal = (formulario: Formulario) => {
    // Si es solicitud IRC, usar precio de categoría IRC
    if (formulario.solicitudIrc?.categoriaIrc) {
      return Number(formulario.solicitudIrc.categoriaIrc.precio);
    }
    // Si es formulario de obra, usar montoTotal
    return Number(formulario.montoTotal);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consulta de Formularios</h1>
          <p className="text-gray-600">Visualiza el estado y detalles de todos los formularios registrados</p>
        </div>
        <Link
          to="/aau"
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
              <option value="EN_REVISION_REGISTRO">En Revisión</option>
              <option value="DEVUELTO">Devuelto</option>
              <option value="ASENTADO">Asentado</option>
              <option value="CERTIFICADO">Certificado</option>
              <option value="ENTREGADO">Entregado</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Obra
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Musical">Musical</option>
              <option value="Audiovisual">Audiovisual</option>
              <option value="Literaria">Literaria</option>
              <option value="IRC">Solicitud IRC</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buscar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Código o cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando formularios...</p>
            </div>
          </div>
        ) : formularios.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay formularios
            </h3>
            <p className="text-gray-600 mb-4">No se encontraron formularios con los filtros aplicados</p>
            <button
              onClick={() => {
                setFiltroEstado('');
                setFiltroTipo('');
                setFechaInicio('');
                setFechaFin('');
                setBuscar('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formularios
                  .slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina)
                  .map((formulario) => (
                  <tr key={formulario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formulario.codigo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getClienteNombre(formulario)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {getTipo(formulario)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(formulario.fecha).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstadoBadge estado={getEstado(formulario)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        RD$ {getMontoTotal(formulario).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Solo Ver Detalles */}
                      <Link
                        to={`/formularios/${formulario.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginacion y Resumen */}
      {!loading && formularios.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {((paginaActual - 1) * itemsPorPagina) + 1}-{Math.min(paginaActual * itemsPorPagina, formularios.length)} de <span className="font-semibold">{formularios.length}</span> formularios
            </p>

            {Math.ceil(formularios.length / itemsPorPagina) > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft />
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Pagina {paginaActual} de {Math.ceil(formularios.length / itemsPorPagina)}
                </span>
                <button
                  onClick={() => setPaginaActual(p => Math.min(Math.ceil(formularios.length / itemsPorPagina), p + 1))}
                  disabled={paginaActual === Math.ceil(formularios.length / itemsPorPagina)}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulariosListPage;
