import { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiUsers, FiCalendar, FiMapPin } from 'react-icons/fi';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface CajaInfo {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  sucursal: string;
  cajero: string;
  montoInicial: number;
  totalRecaudado: number;
  totalTransacciones: number;
  fechaApertura: string;
}

interface MetricasFinancieras {
  totalRecaudadoHoy: number;
  totalRecaudadoMes: number;
  totalRecaudadoPeriodo: number;
  cajasAbiertas: number;
  pagosPendientes: number;
  transaccionesHoy: number;
  cajas: CajaInfo[];
  ingresosPorDia: Array<{ fecha: string; monto: number }>;
  ingresosPorSucursal: Array<{ sucursal: string; monto: number }>;
  periodo?: string;
}

export default function DashboardFinancieroPage() {
  const { canAccessModule, isAdmin, isDirector } = usePermissions();

  // Verificar acceso al módulo - Solo admin, director o cajeros
  if (!isAdmin() && !isDirector() && !canAccessModule('CAJAS')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo de Finanzas. Esta área es solo para personal de Finanzas." />
      </div>
    );
  }

  const [metricas, setMetricas] = useState<MetricasFinancieras | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  useEffect(() => {
    cargarMetricas();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarMetricas, 30000);
    return () => clearInterval(interval);
  }, [periodoSeleccionado]);

  const cargarMetricas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/financiero/metricas?periodo=${periodoSeleccionado}`);
      setMetricas(response.data);
    } catch (error) {
      console.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoCajaColor = (estado: string) => {
    return estado === 'Abierta'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && !metricas) {
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
          <p className="text-gray-600">Monitoreo en tiempo real de cajas e ingresos</p>
        </div>

        {/* Selector de período */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setPeriodoSeleccionado('hoy')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoSeleccionado === 'hoy'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriodoSeleccionado('semana')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoSeleccionado === 'semana'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setPeriodoSeleccionado('mes')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoSeleccionado === 'mes'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Este mes
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total recaudado según período */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 rounded-full p-2">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">
            Recaudado {periodoSeleccionado === 'hoy' ? 'Hoy' : periodoSeleccionado === 'semana' ? 'Esta Semana' : 'Este Mes'}
          </p>
          <p className="text-3xl font-bold">
            RD$ {(metricas?.totalRecaudadoPeriodo || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">{metricas?.transaccionesHoy || 0} transacciones</p>
        </div>

        {/* Total recaudado mes */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FiCalendar className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 rounded-full p-2">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Recaudado Este Mes</p>
          <p className="text-3xl font-bold">
            RD$ {(metricas?.totalRecaudadoMes || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">Acumulado</p>
        </div>

        {/* Cajas abiertas */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FiCreditCard className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 rounded-full p-2">
              <FiUsers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Cajas Abiertas</p>
          <p className="text-3xl font-bold">{metricas?.cajasAbiertas || 0}</p>
          <p className="text-xs opacity-75 mt-2">Activas ahora</p>
        </div>

        {/* Pagos pendientes */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FiCreditCard className="w-8 h-8 opacity-80" />
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-sm font-bold">{metricas?.pagosPendientes || 0}</span>
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Pagos Pendientes</p>
          <p className="text-3xl font-bold">{metricas?.pagosPendientes || 0}</p>
          <p className="text-xs opacity-75 mt-2">Por cobrar</p>
        </div>
      </div>

      {/* Gráfica simple de ingresos por día (últimos 7 días) */}
      {metricas?.ingresosPorDia && metricas.ingresosPorDia.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos Diarios (Últimos 7 días)</h2>
          <div className="space-y-3">
            {metricas.ingresosPorDia.map((dia, index) => {
              const maxMonto = Math.max(...metricas.ingresosPorDia.map(d => d.monto));
              const porcentaje = maxMonto > 0 ? (dia.monto / maxMonto) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(dia.fecha).toLocaleDateString('es-DO', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${porcentaje}%` }}
                    >
                      {porcentaje > 20 && (
                        <span className="text-white text-sm font-medium">
                          RD$ {dia.monto.toLocaleString('es-DO')}
                        </span>
                      )}
                    </div>
                  </div>
                  {porcentaje <= 20 && (
                    <div className="w-32 text-sm font-medium text-gray-900 text-right">
                      RD$ {dia.monto.toLocaleString('es-DO')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de cajas e ingresos por sucursal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cajas activas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Cajas Activas</h2>
            <p className="text-sm text-gray-600">Estado actual de todas las cajas</p>
          </div>

          <div className="p-6">
            {metricas?.cajas && metricas.cajas.length > 0 ? (
              <div className="space-y-4">
                {metricas.cajas.map((caja) => (
                  <div
                    key={caja.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{caja.nombre}</h3>
                        <p className="text-sm text-gray-600">{caja.cajero}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoCajaColor(caja.estado)}`}>
                        {caja.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Sucursal</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          {caja.sucursal}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Transacciones</p>
                        <p className="font-medium text-gray-900">{caja.totalTransacciones}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monto Inicial</p>
                        <p className="font-medium text-gray-900">
                          RD$ {caja.montoInicial.toLocaleString('es-DO')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recaudado</p>
                        <p className="font-medium text-green-600">
                          RD$ {caja.totalRecaudado.toLocaleString('es-DO')}
                        </p>
                      </div>
                    </div>

                    {caja.fechaApertura && (
                      <p className="text-xs text-gray-500 mt-3">
                        Abierta: {new Date(caja.fechaApertura).toLocaleString('es-DO')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No hay cajas abiertas en este momento</p>
              </div>
            )}
          </div>
        </div>

        {/* Ingresos por sucursal */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Ingresos por Sucursal</h2>
            <p className="text-sm text-gray-600">Distribución de recaudación</p>
          </div>

          <div className="p-6">
            {metricas?.ingresosPorSucursal && metricas.ingresosPorSucursal.length > 0 ? (
              <div className="space-y-4">
                {metricas.ingresosPorSucursal.map((sucursal, index) => {
                  const totalGlobal = metricas.ingresosPorSucursal.reduce((sum, s) => sum + s.monto, 0);
                  const porcentaje = totalGlobal > 0 ? (sucursal.monto / totalGlobal) * 100 : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{sucursal.sucursal}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          RD$ {sucursal.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{porcentaje.toFixed(1)}% del total</span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-900">Total Global</span>
                    <span className="text-blue-600">
                      RD$ {metricas.ingresosPorSucursal.reduce((sum, s) => sum + s.monto, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No hay datos de ingresos por sucursal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Última actualización */}
      <div className="text-center text-sm text-gray-500">
        Última actualización: {new Date().toLocaleTimeString('es-DO')} •
        <button onClick={cargarMetricas} className="ml-2 text-blue-600 hover:text-blue-800">
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}
