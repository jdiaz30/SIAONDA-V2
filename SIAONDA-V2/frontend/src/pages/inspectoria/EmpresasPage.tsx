import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { obtenerEmpresas, obtenerCategoriasIRC, obtenerProvincias, EmpresaInspeccionada, CategoriaIRC, Provincia } from '../../services/inspectoriaService';

export default function EmpresasPage() {
  const [searchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState<EmpresaInspeccionada[]>([]);
  const [categorias, setCategorias] = useState<CategoriaIRC[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroRegistrado, setFiltroRegistrado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Contadores de vencimientos
  const [contadores, setContadores] = useState({
    vigentes: 0,
    porVencer: 0,
    vencidas: 0
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarEmpresas();
  }, [pagination.page, filtroCategoria, filtroProvincia, filtroRegistrado, filtroStatus, searchParams.get('refresh')]);

  const cargarCatalogos = async () => {
    try {
      const [catData, provData] = await Promise.all([
        obtenerCategoriasIRC(),
        obtenerProvincias()
      ]);
      setCategorias(catData);
      setProvincias(provData);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const response = await obtenerEmpresas({
        nombreEmpresa: busqueda || undefined,
        rnc: busqueda || undefined,
        categoriaIrcId: filtroCategoria ? parseInt(filtroCategoria) : undefined,
        provinciaId: filtroProvincia ? parseInt(filtroProvincia) : undefined,
        registrado: filtroRegistrado ? filtroRegistrado === 'true' : undefined,
        statusId: filtroStatus ? parseInt(filtroStatus) : undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      const empresasData = response?.empresas || [];
      setEmpresas(empresasData);
      setPagination({
        total: response?.total || 0,
        page: response?.page || 1,
        limit: response?.limit || 10,
        totalPages: response?.totalPages || 0
      });

      // Calcular contadores
      calcularContadores(empresasData);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularContadores = (empresasData: EmpresaInspeccionada[]) => {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    let vigentes = 0;
    let porVencer = 0;
    let vencidas = 0;

    empresasData.forEach((empresa) => {
      if (!empresa.registrado || !empresa.fechaVencimiento) return;

      const vencimiento = new Date(empresa.fechaVencimiento);

      if (vencimiento < hoy) {
        vencidas++;
      } else if (vencimiento <= en30Dias) {
        porVencer++;
      } else {
        vigentes++;
      }
    });

    setContadores({ vigentes, porVencer, vencidas });
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    cargarEmpresas();
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroProvincia('');
    setFiltroRegistrado('');
    setFiltroStatus('');
    setPagination({ ...pagination, page: 1 });
  };

  const getStatusColor = (registrado: boolean, fechaVencimiento?: Date | string) => {
    if (!registrado) return 'bg-gray-100 text-gray-800';

    if (fechaVencimiento) {
      const vencimiento = new Date(fechaVencimiento);
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      if (vencimiento < hoy) return 'bg-red-100 text-red-800';
      if (vencimiento <= en30Dias) return 'bg-yellow-100 text-yellow-800';
    }

    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (registrado: boolean, fechaVencimiento?: Date | string) => {
    if (!registrado) return 'No Registrado';

    if (fechaVencimiento) {
      const vencimiento = new Date(fechaVencimiento);
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      if (vencimiento < hoy) return 'Vencido';
      if (vencimiento <= en30Dias) return 'Por Vencer';
    }

    return 'Vigente';
  };

  if (loading && empresas.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Empresas Inspeccionadas</h1>
          <p className="text-gray-600">Gestión de empresas registradas en Inspectoría (IRC)</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inspectoria/empresas/vigente"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registrar Empresa Vigente
          </Link>
          <Link
            to="/inspectoria/empresas/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Empresa
          </Link>
        </div>
      </div>

      {/* Contadores de Vencimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-800">Vigentes</p>
              <p className="text-2xl font-bold text-green-900">{contadores.vigentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-800">Por Vencer (30 días)</p>
              <p className="text-2xl font-bold text-yellow-900">{contadores.porVencer}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-800">Vencidas</p>
              <p className="text-2xl font-bold text-red-900">{contadores.vencidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <form onSubmit={handleBuscar}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por RNC o Nombre
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="RNC o nombre de empresa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categoría IRC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría IRC
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.codigo} - {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <select
                value={filtroProvincia}
                onChange={(e) => setFiltroProvincia(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {provincias.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado Registro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtroRegistrado}
                onChange={(e) => setFiltroRegistrado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Registrado</option>
                <option value="false">No Registrado</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando empresas...</p>
          </div>
        ) : !empresas || empresas.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza registrando una nueva empresa
            </p>
            <div className="mt-6">
              <Link
                to="/inspectoria/empresas/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Empresa
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
                      RNC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Representante Legal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría IRC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provincia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Inscripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => {
                    // Determinar color de fondo de la fila
                    const vencimiento = empresa.fechaVencimiento ? new Date(empresa.fechaVencimiento) : null;
                    const hoy = new Date();
                    const en30Dias = new Date();
                    en30Dias.setDate(en30Dias.getDate() + 30);

                    let rowClass = 'hover:bg-gray-50';
                    if (vencimiento && empresa.registrado) {
                      if (vencimiento < hoy) {
                        rowClass = 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500';
                      } else if (vencimiento <= en30Dias) {
                        rowClass = 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500';
                      }
                    }

                    return (
                      <tr key={empresa.id} className={rowClass}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/inspectoria/empresas/${empresa.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            {empresa.rnc}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{empresa.nombreEmpresa}</div>
                            {empresa.nombreComercial && (
                              <div className="text-gray-500">{empresa.nombreComercial}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {empresa.personaContacto || empresa.nombrePropietario || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {empresa.categoriaIrc?.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {empresa.provincia?.nombre || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {empresa.fechaRegistro
                            ? new Date(empresa.fechaRegistro).toLocaleDateString('es-DO')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {empresa.fechaVencimiento
                            ? new Date(empresa.fechaVencimiento).toLocaleDateString('es-DO')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(empresa.registrado, empresa.fechaVencimiento)}`}>
                            {getStatusText(empresa.registrado, empresa.fechaVencimiento)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/inspectoria/empresas/${empresa.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Ver
                          </Link>
                          <Link
                            to={`/inspectoria/empresas/${empresa.id}/editar`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
