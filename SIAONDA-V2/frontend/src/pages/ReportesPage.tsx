import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';
import reportesService, {
  DashboardGeneral,
  ReporteIngresos,
  ReporteProductividad,
  ReporteTiempos,
  ReporteCuellosBotella
} from '../services/reportesService';

const ReportesPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardGeneral | null>(null);
  const [reporteActivo, setReporteActivo] = useState<'ingresos' | 'productividad' | 'tiempos' | 'cuellos' | null>(null);

  // Estados para reportes específicos
  const [reporteIngresos, setReporteIngresos] = useState<ReporteIngresos | null>(null);
  const [reporteProductividad, setReporteProductividad] = useState<ReporteProductividad | null>(null);
  const [reporteTiempos, setReporteTiempos] = useState<ReporteTiempos | null>(null);
  const [reporteCuellos, setReporteCuellos] = useState<ReporteCuellosBotella | null>(null);

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getDashboardGeneral();
      setDashboard(data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteIngresos = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getReporteIngresos(fechaInicio, fechaFin);
      setReporteIngresos(data);
      setReporteActivo('ingresos');
    } catch (error) {
      console.error('Error al cargar reporte de ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteProductividad = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getReporteProductividad(fechaInicio, fechaFin);
      setReporteProductividad(data);
      setReporteActivo('productividad');
    } catch (error) {
      console.error('Error al cargar reporte de productividad:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteTiempos = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getReporteTiempos(fechaInicio, fechaFin);
      setReporteTiempos(data);
      setReporteActivo('tiempos');
    } catch (error) {
      console.error('Error al cargar reporte de tiempos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteCuellos = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getReporteCuellosBotella();
      setReporteCuellos(data);
      setReporteActivo('cuellos');
    } catch (error) {
      console.error('Error al cargar reporte de cuellos de botella:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(monto);
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Estadísticas</h1>
        <p className="text-gray-600">Panel de análisis y toma de decisiones</p>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{dashboard.estadisticasMes.formularios}</h3>
            <p className="text-sm text-gray-600">Formularios creados</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {formatearMoneda(dashboard.estadisticasMes.totalFacturado)}
            </h3>
            <p className="text-sm text-gray-600">Total facturado</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{dashboard.estadisticasMes.registros}</h3>
            <p className="text-sm text-gray-600">Registros asentados</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pendientes</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{dashboard.pendientes.formulariosPendientesPago}</h3>
            <p className="text-sm text-gray-600">Pendientes de pago</p>
          </div>
        </div>
      )}

      {/* Filtros de fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Período de Análisis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setReporteActivo(null)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Botones de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={cargarReporteIngresos}
          className="flex items-center gap-3 bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <FiDollarSign className="w-8 h-8 text-blue-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Ingresos</h4>
            <p className="text-sm text-gray-600">Real vs Potencial</p>
          </div>
        </button>

        <button
          onClick={cargarReporteProductividad}
          className="flex items-center gap-3 bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all"
        >
          <FiUsers className="w-8 h-8 text-green-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Productividad</h4>
            <p className="text-sm text-gray-600">Por usuario</p>
          </div>
        </button>

        <button
          onClick={cargarReporteTiempos}
          className="flex items-center gap-3 bg-white border-2 border-purple-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all"
        >
          <FiClock className="w-8 h-8 text-purple-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Tiempos</h4>
            <p className="text-sm text-gray-600">Procesamiento</p>
          </div>
        </button>

        <button
          onClick={cargarReporteCuellos}
          className="flex items-center gap-3 bg-white border-2 border-yellow-200 rounded-lg p-4 hover:border-yellow-500 hover:bg-yellow-50 transition-all"
        >
          <FiAlertTriangle className="w-8 h-8 text-yellow-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Cuellos de Botella</h4>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </button>
      </div>

      {/* Contenido del reporte activo */}
      {reporteActivo === 'ingresos' && reporteIngresos && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Reporte de Ingresos</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FiDownload />
              Exportar
            </button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-green-700 mb-2">Ingresos Reales</h4>
              <p className="text-3xl font-bold text-green-900">
                {formatearMoneda(reporteIngresos.resumen.ingresosReales)}
              </p>
              <p className="text-sm text-green-600 mt-2">
                {reporteIngresos.resumen.cajasNormales} cajas normales
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-yellow-700 mb-2">Ingresos Potenciales (Periodo Gracia)</h4>
              <p className="text-3xl font-bold text-yellow-900">
                {formatearMoneda(reporteIngresos.resumen.ingresosPotenciales)}
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                {reporteIngresos.resumen.cajasGratuitas} cajas gratuitas
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Total General</h4>
              <p className="text-3xl font-bold text-blue-900">
                {formatearMoneda(reporteIngresos.resumen.totalGeneral)}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                {reporteIngresos.resumen.totalCajas} cajas totales
              </p>
            </div>
          </div>

          {/* Detalle por caja */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Detalle por Caja</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facturas</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteIngresos.detalles.map((detalle) => (
                    <tr key={detalle.cajaId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {detalle.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(detalle.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detalle.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {detalle.esGratuita ? (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Gratuita: {detalle.motivoGratuito}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detalle.totalFacturas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatearMoneda(detalle.montoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Otros reportes... */}
      {reporteActivo === 'productividad' && reporteProductividad && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Reporte de Productividad</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Formularios</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Registros</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cajas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reporteProductividad.productividad.map((prod) => (
                  <tr key={prod.usuario.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {prod.usuario.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prod.usuario.tipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {prod.metricas.formulariosCreados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {prod.metricas.registrosAsentados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {prod.metricas.cajasAbiertas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatearMoneda(prod.metricas.totalFacturado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reporteActivo === 'tiempos' && reporteTiempos && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Tiempos Promedio de Procesamiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Asentamiento</h4>
              <p className="text-4xl font-bold text-blue-900">
                {reporteTiempos.promediosDias.asentamiento.toFixed(1)}
              </p>
              <p className="text-sm text-blue-600 mt-2">días</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <h4 className="text-sm font-medium text-purple-700 mb-2">Generación Certificado</h4>
              <p className="text-4xl font-bold text-purple-900">
                {reporteTiempos.promediosDias.generacionCertificado.toFixed(1)}
              </p>
              <p className="text-sm text-purple-600 mt-2">días</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h4 className="text-sm font-medium text-green-700 mb-2">Firma</h4>
              <p className="text-4xl font-bold text-green-900">
                {reporteTiempos.promediosDias.firma.toFixed(1)}
              </p>
              <p className="text-sm text-green-600 mt-2">días</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <h4 className="text-sm font-medium text-orange-700 mb-2">Entrega Total</h4>
              <p className="text-4xl font-bold text-orange-900">
                {reporteTiempos.promediosDias.entrega.toFixed(1)}
              </p>
              <p className="text-sm text-orange-600 mt-2">días</p>
            </div>
          </div>
        </div>
      )}

      {reporteActivo === 'cuellos' && reporteCuellos && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Cuellos de Botella</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Formularios por Estado</h4>
              <div className="space-y-2">
                {reporteCuellos.formulariosPorEstado.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.estado}</span>
                    <span className="text-sm font-bold text-gray-900">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Registros por Estado</h4>
              <div className="space-y-2">
                {reporteCuellos.registrosPorEstado.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.estado}</span>
                    <span className="text-sm font-bold text-gray-900">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesPage;
