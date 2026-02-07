import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiAlertTriangle } from 'react-icons/fi';
import ncfService, { EstadisticasNcf, SecuenciaNcfInput } from '../../services/ncfService';

export default function GestionNCFPage() {
  const navigate = useNavigate();
  const [estadisticasNcf, setEstadisticasNcf] = useState<EstadisticasNcf[]>([]);
  const [mostrarModalNcf, setMostrarModalNcf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formNcf, setFormNcf] = useState<SecuenciaNcfInput>({
    tipoComprobante: 'B01',
    serie: 'E',
    numeroInicial: '',
    numeroFinal: '',
    fechaVencimiento: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarEstadisticasNcf();
  }, []);

  const cargarEstadisticasNcf = async () => {
    try {
      setLoading(true);
      const stats = await ncfService.getEstadisticas();
      setEstadisticasNcf(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas NCF:', error);
      alert('Error al cargar las estadísticas de NCF');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSecuenciaNcf = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNcf.numeroInicial || !formNcf.numeroFinal || !formNcf.fechaVencimiento) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await ncfService.crearSecuencia({
        ...formNcf,
        numeroInicial: parseInt(formNcf.numeroInicial),
        numeroFinal: parseInt(formNcf.numeroFinal)
      });

      alert('✅ Secuencia NCF creada exitosamente');
      setMostrarModalNcf(false);
      setFormNcf({
        tipoComprobante: 'B01',
        serie: 'E',
        numeroInicial: '',
        numeroFinal: '',
        fechaVencimiento: '',
        observaciones: ''
      });
      cargarEstadisticasNcf();
    } catch (error: any) {
      alert('❌ Error al crear la secuencia: ' + (error.response?.data?.message || error.message));
    }
  };

  const calcularDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diff = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de NCF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/cajas')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft />
          Volver a Cajas
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprobantes Fiscales (NCF)</h1>
            <p className="text-gray-600 mt-1">Gestión de secuencias de Números de Comprobante Fiscal</p>
          </div>
          <button
            onClick={() => setMostrarModalNcf(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <FiPlus />
            Nueva Secuencia
          </button>
        </div>
      </div>

      {/* Secuencias NCF */}
      {estadisticasNcf.length === 0 ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <FiAlertTriangle className="mx-auto text-6xl text-yellow-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No hay secuencias NCF configuradas</h2>
          <p className="text-gray-600 mb-6">
            Configure al menos una secuencia B01 para poder emitir facturas con comprobante fiscal.
          </p>
          <button
            onClick={() => setMostrarModalNcf(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Crear Primera Secuencia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estadisticasNcf.map((est, index) => {
            const diasRestantes = calcularDiasRestantes(est.fechaVencimiento);
            const alertaBaja = est.disponibles < 50;
            const alertaVencimiento = diasRestantes < 30;
            const tieneAlerta = alertaBaja || alertaVencimiento;

            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${
                  tieneAlerta ? 'border-2 border-red-300' : ''
                }`}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{est.tipoComprobante}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        est.activo
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {est.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">Serie: {est.serie || 'N/A'}</p>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Disponibles */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Disponibles</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {est.disponibles?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (est.porcentajeUtilizado || 0) > 90
                            ? 'bg-red-600'
                            : (est.porcentajeUtilizado || 0) > 70
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${est.porcentajeUtilizado || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(est.porcentajeUtilizado || 0).toFixed(1)}% utilizado
                    </p>
                  </div>

                  {/* Vencimiento */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vencimiento</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(est.fechaVencimiento).toLocaleDateString('es-DO')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Vencida'}
                    </p>
                  </div>

                  {/* Alertas */}
                  {tieneAlerta && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <FiAlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-red-800">
                          {alertaBaja && <p>Quedan menos de 50 comprobantes</p>}
                          {alertaVencimiento && <p>Vence en menos de 30 días</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rango */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <strong>Rango:</strong> {est.numeroInicial?.toLocaleString()} - {est.numeroFinal?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Actual:</strong> {est.numeroActual?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">Información sobre NCF</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>B01:</strong> Factura de Crédito Fiscal (más común)</li>
          <li>• <strong>B02:</strong> Factura de Consumo</li>
          <li>• <strong>B14:</strong> Regímenes Especiales de Tributación</li>
          <li>• <strong>B15:</strong> Comprobante Gubernamental</li>
          <li>• Las secuencias deben ser autorizadas previamente por la DGII</li>
          <li>• Renovar secuencias antes de su vencimiento para evitar interrupciones</li>
        </ul>
      </div>

      {/* Modal para crear secuencia */}
      {mostrarModalNcf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Nueva Secuencia NCF</h2>
            </div>

            <form onSubmit={handleCrearSecuenciaNcf} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Comprobante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Comprobante *
                  </label>
                  <select
                    value={formNcf.tipoComprobante}
                    onChange={(e) => setFormNcf({ ...formNcf, tipoComprobante: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="B01">B01 - Crédito Fiscal</option>
                    <option value="B02">B02 - Consumo</option>
                    <option value="B14">B14 - Regímenes Especiales</option>
                    <option value="B15">B15 - Gubernamental</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">B01 es el más común</p>
                </div>

                {/* Serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serie *
                  </label>
                  <select
                    value={formNcf.serie}
                    onChange={(e) => setFormNcf({ ...formNcf, serie: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="E">E - Electrónico</option>
                    <option value="P">P - Físico</option>
                  </select>
                </div>

                {/* Número Inicial */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Inicial *
                  </label>
                  <input
                    type="number"
                    value={formNcf.numeroInicial}
                    onChange={(e) => setFormNcf({ ...formNcf, numeroInicial: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="1"
                    required
                  />
                </div>

                {/* Número Final */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Final *
                  </label>
                  <input
                    type="number"
                    value={formNcf.numeroFinal}
                    onChange={(e) => setFormNcf({ ...formNcf, numeroFinal: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="1000"
                    required
                  />
                </div>

                {/* Fecha de Vencimiento */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={formNcf.fechaVencimiento}
                    onChange={(e) => setFormNcf({ ...formNcf, fechaVencimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Fecha límite autorizada por la DGII</p>
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formNcf.observaciones}
                    onChange={(e) => setFormNcf({ ...formNcf, observaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Información adicional sobre esta secuencia..."
                  />
                </div>
              </div>

              {/* Info de comprobantes */}
              {formNcf.numeroInicial && formNcf.numeroFinal && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Se crearán{' '}
                    <strong>
                      {(parseInt(formNcf.numeroFinal) - parseInt(formNcf.numeroInicial) + 1).toLocaleString()}
                    </strong>{' '}
                    comprobantes disponibles
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModalNcf(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Secuencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
