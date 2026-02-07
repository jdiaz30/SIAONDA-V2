import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiFileText,
  FiPackage,
  FiUsers,
  FiAlertOctagon
} from 'react-icons/fi';
import aauService, { EstadisticasDashboard } from '../../services/aauService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

const DashboardAauPage = () => {
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo ATU
  if (!canAccessModule('ATU')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo de Atención al Usuario. Esta área es solo para personal de ATU." />
      </div>
    );
  }
  const [stats, setStats] = useState<EstadisticasDashboard>({
    pendientes: 0,
    enRevision: 0,
    devueltos: 0,
    certificados: 0,
    recibidosMes: 0,
    asentadosMes: 0,
    entregadosMes: 0,
    devueltosMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await aauService.getEstadisticasDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white border-b-4 border-red-500">
        <h1 className="text-3xl font-bold mb-2">Atención al Usuario</h1>
        <p className="text-blue-50">Gestión de registros de obras y servicios ONDA</p>
      </div>

      {/* Resumen General */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen General</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pendientes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-300 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <FiClock className="text-4xl text-gray-400" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-700">{stats.pendientes}</p>
              </div>
            </div>
            <Link
              to="/aau/formularios?estado=PENDIENTE"
              className="text-sm text-blue-600 hover:text-blue-700 inline-block font-medium"
            >
              Ver todos →
            </Link>
          </div>

          {/* Devueltos - CRÍTICO */}
          <div className="bg-red-50 rounded-xl shadow-sm p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <FiAlertTriangle className="text-4xl text-red-500" />
              <div className="text-right">
                <p className="text-sm font-semibold text-red-700">Devueltos</p>
                <p className="text-3xl font-bold text-red-600">{stats.devueltos}</p>
              </div>
            </div>
            <Link
              to="/aau/formularios/devueltos"
              className="text-sm text-red-600 hover:text-red-700 inline-block font-semibold"
            >
              Corregir ahora →
            </Link>
          </div>

          {/* Certificados */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <FiCheckCircle className="text-4xl text-blue-600" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Listos Entrega</p>
                <p className="text-3xl font-bold text-blue-700">{stats.certificados}</p>
              </div>
            </div>
            <Link
              to="/aau/certificados-entrega"
              className="text-sm text-blue-600 hover:text-blue-700 inline-block font-medium"
            >
              Ver certificados →
            </Link>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recepción de Clientes */}
          <Link
            to="/clientes/nuevo"
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-lg text-white rounded-xl shadow-md p-6 transition-all hover:scale-102"
          >
            <FiPlus className="text-4xl mb-3" />
            <h3 className="text-xl font-bold mb-2">Recepción de Cliente</h3>
            <p className="text-blue-50 text-sm">
              Registrar nuevo cliente en el sistema
            </p>
          </Link>

          {/* Nuevo Registro */}
          <Link
            to="/aau/formularios/nuevo"
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:shadow-lg text-white rounded-xl shadow-md p-6 transition-all hover:scale-102"
          >
            <FiFileText className="text-4xl mb-3" />
            <h3 className="text-xl font-bold mb-2">Nuevo Registro Obra</h3>
            <p className="text-blue-50 text-sm">
              Musical, Audiovisual, Literaria, Científica, etc.
            </p>
          </Link>

          {/* Servicios Inspectoría: IRC y Denuncias */}
          <Link
            to="/aau/formularios-irc"
            className="bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg text-white rounded-xl shadow-md p-6 transition-all hover:scale-102"
          >
            <FiPackage className="text-4xl mb-3" />
            <h3 className="text-xl font-bold mb-2">Servicios Inspectoría</h3>
            <p className="text-red-50 text-sm">
              IRC (Registro/Renovación) y Denuncias
            </p>
          </Link>
        </div>
      </div>

      {/* Gestión de Formularios */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Formularios</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {/* Gestión de Clientes */}
            <Link
              to="/clientes"
              className="flex items-center justify-between p-5 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FiUsers className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Gestión de Clientes</h3>
                  <p className="text-sm text-gray-600">Ver y administrar todos los clientes</p>
                </div>
              </div>
              <div className="text-blue-500 text-xl font-bold">→</div>
            </Link>

            {/* Todos los Registros */}
            <Link
              to="/aau/formularios"
              className="flex items-center justify-between p-5 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <FiFileText className="text-2xl text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Todos los Registros</h3>
                  <p className="text-sm text-gray-600">Ver lista completa con filtros</p>
                </div>
              </div>
              <div className="text-blue-500 text-xl font-bold">→</div>
            </Link>

            {/* Formularios Devueltos - DESTACADO */}
            {stats.devueltos > 0 && (
              <Link
                to="/aau/formularios/devueltos"
                className="flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 transition-all border-l-4 border-red-500 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition-colors">
                    <FiAlertTriangle className="text-2xl text-red-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-700">
                      Formularios Devueltos ({stats.devueltos})
                    </h3>
                    <p className="text-sm text-red-600 font-semibold">
                      REQUIEREN CORRECCIÓN URGENTE
                    </p>
                  </div>
                </div>
                <div className="text-red-600 text-xl font-bold">→</div>
              </Link>
            )}

            {/* Certificados Listos para Entrega */}
            <Link
              to="/aau/certificados-entrega"
              className="flex items-center justify-between p-5 hover:bg-blue-50 transition-all border-l-4 border-blue-500 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FiCheckCircle className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                    Certificados para Entrega ({stats.certificados})
                  </h3>
                  <p className="text-sm text-gray-600">Certificados de obras e IRC listos para entregar</p>
                </div>
              </div>
              <div className="text-blue-500 text-xl font-bold">→</div>
            </Link>

            {/* Historial de Entregas */}
            <Link
              to="/aau/historial-entregas"
              className="flex items-center justify-between p-5 hover:bg-green-50 transition-all border-l-4 border-green-500 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                  <FiCheckCircle className="text-2xl text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700">
                    Historial de Entregas
                  </h3>
                  <p className="text-sm text-gray-600">Consultar todas las entregas de certificados realizadas</p>
                </div>
              </div>
              <div className="text-green-500 text-xl font-bold">→</div>
            </Link>

            {/* Denuncias - Inspecciones de Parte */}
            <Link
              to="/aau/denuncias"
              className="flex items-center justify-between p-5 hover:bg-orange-50 transition-all border-l-4 border-orange-500 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <FiAlertOctagon className="text-2xl text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-700">
                    Denuncias (Inspección de Parte)
                  </h3>
                  <p className="text-sm text-gray-600">Gestionar denuncias ciudadanas - RD$3,000</p>
                </div>
              </div>
              <div className="text-orange-500 text-xl font-bold">→</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Estadísticas del Mes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow border-t-4 border-gray-300">
            <p className="text-sm font-medium text-gray-600 mb-2">Recibidos</p>
            <p className="text-3xl font-bold text-gray-700">{stats.recibidosMes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow border-t-4 border-blue-400">
            <p className="text-sm font-medium text-gray-600 mb-2">Asentados</p>
            <p className="text-3xl font-bold text-blue-600">{stats.asentadosMes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow border-t-4 border-blue-500">
            <p className="text-sm font-medium text-gray-600 mb-2">Entregados</p>
            <p className="text-3xl font-bold text-blue-700">{stats.entregadosMes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-shadow border-t-4 border-red-500">
            <p className="text-sm font-medium text-gray-600 mb-2">Devueltos</p>
            <p className="text-3xl font-bold text-red-600">{stats.devueltosMes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAauPage;
