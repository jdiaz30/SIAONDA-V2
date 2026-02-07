import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiClock, FiFileText, FiLock, FiUnlock, FiAlertCircle, FiCheckCircle, FiCalendar, FiHash } from 'react-icons/fi';
import cajasService, { Caja } from '../../services/cajasService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';
import { getErrorMessage } from '../../utils/errorHandler';

const CajasPage = () => {
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo CAJAS
  if (!canAccessModule('CAJAS')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo de Cajas. Esta área es solo para personal de Cajas." />
      </div>
    );
  }
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null);
  const [mostrarFormAbrir, setMostrarFormAbrir] = useState(false);
  const [loading, setLoading] = useState(true);
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [esGratuita, setEsGratuita] = useState(false);
  const [motivoGratuito, setMotivoGratuito] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarCajaActiva();
  }, []);

  const cargarCajaActiva = async () => {
    try {
      setLoading(true);
      const caja = await cajasService.getCajaActiva();
      setCajaActiva(caja);
    } catch (error: any) {
      console.log('No hay caja activa');
      setCajaActiva(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim()) {
      alert('La descripción es requerida');
      return;
    }

    if (esGratuita && !motivoGratuito.trim()) {
      alert('Si la caja es gratuita, debe especificar el motivo');
      return;
    }

    try {
      await cajasService.abrirCaja({
        descripcion,
        observaciones: observaciones || undefined,
        esGratuita,
        motivoGratuito: esGratuita ? motivoGratuito : undefined
      });

      alert('Caja abierta exitosamente');
      setMostrarFormAbrir(false);
      setDescripcion('');
      setObservaciones('');
      setEsGratuita(false);
      setMotivoGratuito('');
      cargarCajaActiva();
    } catch (error: any) {
      alert('❌ ' + getErrorMessage(error));
    }
  };

  const handleCerrarCaja = async () => {
    if (!cajaActiva) return;

    if (!confirm('¿Estás seguro de cerrar la caja? Se generará el reporte de cierre para Contabilidad.')) {
      return;
    }

    try {
      const response = await cajasService.cerrarCaja(cajaActiva.id);
      const cierreId = response.cierreId;

      alert('✅ Caja cerrada exitosamente\n\nSe abrirá el reporte de cierre para imprimir y entregar a Contabilidad.');

      // Abrir reporte de cierre en nueva pestaña
      window.open(`http://localhost:3000/api/cajas/cierre/${cierreId}/imprimir`, '_blank');

      cargarCajaActiva();
    } catch (error: any) {
      alert('❌ Error al cerrar la caja: ' + getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando información de caja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl shadow-lg p-8 mb-6 border-b-4 border-red-600">
          <div className="flex items-center gap-3">
            <FiDollarSign className="text-white text-4xl" />
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Caja</h1>
              <p className="text-blue-200 mt-1">Sistema de control de operaciones de caja</p>
            </div>
          </div>
        </div>

        {!cajaActiva ? (
          // No hay caja abierta
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="max-w-2xl w-full">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-blue-600">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
                  <FiAlertCircle className="text-yellow-600 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No tienes una caja abierta</h2>
                <p className="text-gray-600 mb-8">
                  Debes abrir una caja para procesar pagos y generar facturas
                </p>

                {!mostrarFormAbrir ? (
                  <button
                    onClick={() => setMostrarFormAbrir(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
                  >
                    <FiUnlock className="text-xl" />
                    Abrir Caja
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 mt-6 border-l-4 border-blue-600 text-left">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Abrir Nueva Caja</h3>
                    <form onSubmit={handleAbrirCaja}>
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Ej: Caja del turno de mañana"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Observaciones
                        </label>
                        <textarea
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Notas adicionales (opcional)"
                        />
                      </div>

                      {/* Periodo de Gracia */}
                      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="esGratuita"
                            checked={esGratuita}
                            onChange={(e) => setEsGratuita(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="esGratuita" className="text-sm font-semibold text-gray-900">
                            Caja Gratuita (Periodo de Gracia)
                          </label>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          Los registros procesados en esta caja no tendrán costo (para eventos, ferias, etc.)
                        </p>

                        {esGratuita && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Motivo *
                            </label>
                            <input
                              type="text"
                              value={motivoGratuito}
                              onChange={(e) => setMotivoGratuito(e.target.value)}
                              placeholder="Ej: Feria del Libro 2026, Evento MICM, etc."
                              className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                              required={esGratuita}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
                        >
                          Confirmar Apertura
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarFormAbrir(false);
                            setDescripcion('');
                            setObservaciones('');
                            setEsGratuita(false);
                            setMotivoGratuito('');
                          }}
                          className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors shadow-md font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Caja abierta
          <div className="space-y-6">
            {/* Estado de la Caja */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <FiCheckCircle className="text-green-600 text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Caja Activa</h2>
                  <p className="text-green-600 font-semibold">En operación</p>
                </div>
              </div>

              {/* Información de la Caja en Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Código */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiHash className="text-blue-600 text-xl" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Código</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{cajaActiva.codigo}</p>
                </div>

                {/* Descripción */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiFileText className="text-purple-600 text-xl" />
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Descripción</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{cajaActiva.descripcion}</p>
                </div>

                {/* Fecha Apertura */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiCalendar className="text-orange-600 text-xl" />
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Fecha Apertura</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(cajaActiva.horaApertura).toLocaleDateString('es-DO')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(cajaActiva.horaApertura).toLocaleTimeString('es-DO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Total Facturas */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiDollarSign className="text-green-600 text-xl" />
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Recaudado</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    RD$ {Number(cajaActiva.totalFacturas || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Facturas Procesadas */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiFileText className="text-indigo-600 text-xl" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Facturas</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">{cajaActiva._count?.facturas || 0}</p>
                  <p className="text-sm text-gray-600">procesadas</p>
                </div>

                {/* Tiempo Activo */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <FiClock className="text-yellow-600 text-xl" />
                    <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Tiempo Activo</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {(() => {
                      const inicio = new Date(cajaActiva.horaApertura);
                      const ahora = new Date();
                      const diff = Math.floor((ahora.getTime() - inicio.getTime()) / 1000 / 60);
                      const horas = Math.floor(diff / 60);
                      const minutos = diff % 60;
                      return `${horas}h ${minutos}m`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/cajas/cobros-pendientes')}
                className="group bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-white/20 p-4 rounded-lg group-hover:bg-white/30 transition-colors">
                    <FiDollarSign className="text-4xl" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-bold mb-1">Cobros Pendientes</h3>
                    <p className="text-green-100">Procesar pagos y generar facturas</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleCerrarCaja}
                className="group bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-white/20 p-4 rounded-lg group-hover:bg-white/30 transition-colors">
                    <FiLock className="text-4xl" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-bold mb-1">Cerrar Caja</h3>
                    <p className="text-red-100">Generar reporte de cierre</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Link a NCF */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <button
                onClick={() => navigate('/cajas/ncf')}
                className="w-full flex items-center justify-center gap-2 text-blue-700 hover:text-blue-800 font-semibold transition-colors"
              >
                <FiFileText className="text-xl" />
                Gestión de Comprobantes Fiscales (NCF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CajasPage;
