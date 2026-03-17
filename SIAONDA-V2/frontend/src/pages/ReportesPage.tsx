import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiDownload,
  FiBarChart2,
  FiDatabase
} from 'react-icons/fi';
import reportesService, {
  DashboardGeneral,
  ReporteIngresos,
  ReporteProductividad,
  ReporteTiempos,
  ReporteCuellosBotella,
  MetricasRegistros,
  FiltrosReporte
} from '../services/reportesService';

const ReportesPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardGeneral | null>(null);
  const [reporteActivo, setReporteActivo] = useState<'ingresos' | 'productividad' | 'tiempos' | 'cuellos' | 'metricas' | 'exportar' | null>(null);

  // Estados para reportes específicos
  const [reporteIngresos, setReporteIngresos] = useState<ReporteIngresos | null>(null);
  const [reporteProductividad, setReporteProductividad] = useState<ReporteProductividad | null>(null);
  const [reporteTiempos, setReporteTiempos] = useState<ReporteTiempos | null>(null);
  const [reporteCuellos, setReporteCuellos] = useState<ReporteCuellosBotella | null>(null);
  const [metricasRegistros, setMetricasRegistros] = useState<MetricasRegistros | null>(null);

  // Filtros para exportación
  const [filtrosExport, setFiltrosExport] = useState<FiltrosReporte>({});
  const [exportando, setExportando] = useState(false);

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

  const cargarMetricasRegistros = async () => {
    try {
      setLoading(true);
      const filtros = {
        fechaInicio,
        fechaFin
      };
      const data = await reportesService.getMetricasRegistros(filtros);
      setMetricasRegistros(data);
      setReporteActivo('metricas');
    } catch (error) {
      console.error('Error al cargar métricas de registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirExportacion = () => {
    setReporteActivo('exportar');
    setFiltrosExport({
      fechaInicio,
      fechaFin
    });
  };

  const handleExportarExcel = async () => {
    try {
      setExportando(true);
      await reportesService.exportarExcel(filtrosExport);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo. Por favor intente nuevamente.');
    } finally {
      setExportando(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

        <button
          onClick={cargarMetricasRegistros}
          className="flex items-center gap-3 bg-white border-2 border-indigo-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
        >
          <FiBarChart2 className="w-8 h-8 text-indigo-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Métricas de Registros</h4>
            <p className="text-sm text-gray-600">Uso IA y certificados</p>
          </div>
        </button>

        <button
          onClick={abrirExportacion}
          className="flex items-center gap-3 bg-white border-2 border-teal-200 rounded-lg p-4 hover:border-teal-500 hover:bg-teal-50 transition-all"
        >
          <FiDatabase className="w-8 h-8 text-teal-600" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Exportar Registros</h4>
            <p className="text-sm text-gray-600">Descargar Excel</p>
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

      {reporteActivo === 'metricas' && metricasRegistros && (
        <div className="space-y-6">
          {/* Resumen general */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Métricas de Registros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Total Registros</h4>
                <p className="text-4xl font-bold text-indigo-900">{metricasRegistros.totalRegistros}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <h4 className="text-sm font-medium text-green-700 mb-2">Certificados Generados</h4>
                <p className="text-4xl font-bold text-green-900">{metricasRegistros.certificados.generados}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Certificados Entregados</h4>
                <p className="text-4xl font-bold text-blue-900">{metricasRegistros.certificados.entregados}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">Certificados Pendientes</h4>
                <p className="text-4xl font-bold text-yellow-900">{metricasRegistros.certificados.pendientes}</p>
              </div>
            </div>

            {/* Uso de IA */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">Uso de Inteligencia Artificial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-purple-700 mb-1">Con IA</h5>
                      <p className="text-3xl font-bold text-purple-900">{metricasRegistros.usoIA.conIA}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">
                        {metricasRegistros.totalRegistros > 0
                          ? ((metricasRegistros.usoIA.conIA / metricasRegistros.totalRegistros) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Sin IA</h5>
                      <p className="text-3xl font-bold text-gray-900">{metricasRegistros.usoIA.sinIA}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-700">
                        {metricasRegistros.totalRegistros > 0
                          ? ((metricasRegistros.usoIA.sinIA / metricasRegistros.totalRegistros) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registros por estado */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">Registros por Estado</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricasRegistros.registrosPorEstado.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">{item.estado}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.cantidad}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Registros por tipo */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Registros por Tipo de Obra</h4>
              <div className="space-y-2">
                {metricasRegistros.registrosPorTipo.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.tipo}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${metricasRegistros.totalRegistros > 0
                              ? (item.cantidad / metricasRegistros.totalRegistros) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{item.cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tendencia mensual */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Tendencia Mensual</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metricasRegistros.tendenciaMensual.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {item.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reporteActivo === 'exportar' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Exportar Registros a Excel</h3>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              El archivo Excel contendrá las siguientes columnas: Fecha Formulario, Fecha Certificado, Estado,
              Código Formulario, Número Obra, Código Producto, Producto, y Nombre Obra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtrosExport.fechaInicio || ''}
                onChange={(e) => setFiltrosExport({ ...filtrosExport, fechaInicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtrosExport.fechaFin || ''}
                onChange={(e) => setFiltrosExport({ ...filtrosExport, fechaFin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Obra (opcional)
              </label>
              <input
                type="text"
                value={filtrosExport.tipoObra || ''}
                onChange={(e) => setFiltrosExport({ ...filtrosExport, tipoObra: e.target.value })}
                placeholder="Ej: Obra Literaria, Obra Musical..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (opcional)
              </label>
              <select
                value={filtrosExport.estado || ''}
                onChange={(e) => setFiltrosExport({ ...filtrosExport, estado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="ASENTADO">Asentado</option>
                <option value="CERTIFICADO GENERADO">Certificado Generado</option>
                <option value="CERTIFICADO FIRMADO">Certificado Firmado</option>
                <option value="CERTIFICADO ENTREGADO">Certificado Entregado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uso de IA (opcional)
              </label>
              <select
                value={filtrosExport.usoIA || ''}
                onChange={(e) => setFiltrosExport({ ...filtrosExport, usoIA: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Con IA</option>
                <option value="false">Sin IA</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleExportarExcel}
              disabled={exportando}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exportando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  Descargar Excel
                </>
              )}
            </button>
            <button
              onClick={() => setReporteActivo(null)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesPage;
