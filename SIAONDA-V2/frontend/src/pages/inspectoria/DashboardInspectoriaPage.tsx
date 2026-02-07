import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerDashboard, DashboardData } from '../../services/inspectoriaService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

export default function DashboardInspectoriaPage() {
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo INSPECTORIA
  if (!canAccessModule('INSPECTORIA')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo de Inspectoría. Esta área es solo para personal de Inspectoría." />
      </div>
    );
  }
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const data = await obtenerDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - Inspectoría</h1>
          <p className="text-gray-600">Panel de control del Departamento de Inspectoría</p>
        </div>
        <button
          onClick={cargarDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tipos de Inspecciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Flujo de Inspecciones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/inspectoria/viajes-oficio"
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-800">Inspecciones de Oficio</p>
                <p className="text-xs text-indigo-600 mt-1">Viajes programados a provincias</p>
              </div>
              <div className="text-indigo-300 group-hover:text-indigo-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            to="/aau/denuncias"
            className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Inspecciones de Parte</p>
                <p className="text-xs text-orange-600 mt-1">Denuncias ciudadanas (RD$3,000)</p>
              </div>
              <div className="text-orange-300 group-hover:text-orange-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            to="/juridico"
            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Casos Jurídicos</p>
                <p className="text-xs text-red-600 mt-1">Tramitados a departamento jurídico</p>
              </div>
              <div className="text-red-300 group-hover:text-red-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Flujo de Certificación IRC */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Proceso de Certificación IRC
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/inspectoria/solicitudes/pagadas" className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Pendientes Asentamiento</p>
                <p className="text-3xl font-bold text-blue-900">{dashboard.solicitudesPendientes.asentamiento}</p>
                <p className="text-sm text-blue-600 mt-1">Paralegal revisa y asienta</p>
                <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Click para asentar registros
                </p>
              </div>
              <div className="text-blue-300 group-hover:text-blue-400 transition-colors">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/inspectoria/solicitudes/certificados-pendientes" className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Pendientes Certificado</p>
                <p className="text-3xl font-bold text-green-900">{dashboard.solicitudesPendientes.certificado || 0}</p>
                <p className="text-sm text-green-600 mt-1">Generar y firmar certificado</p>
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Click para generar y cargar firmado
                </p>
              </div>
              <div className="text-green-300 group-hover:text-green-400 transition-colors">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Casos de Inspección */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Casos de Inspección
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Sin Asignar</p>
            <p className="text-3xl font-bold text-green-900">{dashboard.casosPendientes.pendientesAsignacion}</p>
            <p className="text-sm text-green-600 mt-1">Encargado debe asignar</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">En Plazo de Gracia</p>
            <p className="text-3xl font-bold text-red-900">{dashboard.casosPendientes.enPlazoGracia}</p>
            <p className="text-sm text-red-600 mt-1">10 días para corregir</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800">Para Segunda Visita</p>
            <p className="text-3xl font-bold text-orange-900">{dashboard.casosPendientes.paraSegundaVisita}</p>
            <p className="text-sm text-orange-600 mt-1">Plazo vencido</p>
          </div>
        </div>
      </div>

      {/* Alertas de Vigencia */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vigencia de Inscripciones IRC
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/inspectoria/empresas?filtro=vencidas" className="bg-red-50 border-2 border-red-300 rounded-lg p-6 hover:bg-red-100 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Empresas Vencidas</p>
                <p className="text-4xl font-bold text-red-900">{dashboard.alertasRenovacion.vencidas}</p>
                <p className="text-sm text-red-600 mt-2">⚠️ Requieren renovación urgente</p>
              </div>
              <div className="text-red-300 group-hover:text-red-400 group-hover:scale-110 transition-transform">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/inspectoria/empresas?filtro=porVencer" className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 hover:bg-yellow-100 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Por Vencer (30 días)</p>
                <p className="text-4xl font-bold text-yellow-900">{dashboard.alertasRenovacion.porVencer30Dias}</p>
                <p className="text-sm text-yellow-600 mt-2">⏰ Próximas a vencer</p>
              </div>
              <div className="text-yellow-300 group-hover:text-yellow-400 group-hover:scale-110 transition-transform">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Estadísticas Generales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Total Empresas</p>
            <p className="text-3xl font-bold text-green-900">{dashboard.estadisticas.totalEmpresas}</p>
            <p className="text-sm text-green-600 mt-1">En el sistema</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Total Solicitudes</p>
            <p className="text-3xl font-bold text-green-900">{dashboard.estadisticas.totalSolicitudes}</p>
            <p className="text-sm text-green-600 mt-1">Registro y renovación</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Total Casos</p>
            <p className="text-3xl font-bold text-green-900">{dashboard.estadisticas.totalCasos}</p>
            <p className="text-sm text-green-600 mt-1">Casos abiertos</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Ingresos del Mes</p>
            <p className="text-3xl font-bold text-green-900">
              ${dashboard.estadisticas.ingresosMensuales.toLocaleString('es-DO')}
            </p>
            <p className="text-sm text-green-600 mt-1">Pagos recibidos</p>
          </div>
        </div>
      </div>

      {/* Enlaces Rápidos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/inspectoria/empresas"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏢</div>
            <div className="text-sm font-medium text-gray-900 text-center">Gestión de Empresas IRC</div>
          </Link>

          <Link
            to="/inspectoria/solicitudes"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <div className="text-sm font-medium text-gray-900 text-center">Solicitudes de Registro IRC</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
