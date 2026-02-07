import { useState, useEffect } from 'react';
import { FiDollarSign, FiFileText, FiAlertTriangle, FiCheckCircle, FiSearch } from 'react-icons/fi';
import api from '../../services/api';

interface Cobro {
  id: number;
  tipo: 'IRC' | 'DENUNCIA' | 'FORMULARIO';
  subtipo: string;
  codigo: string;
  fecha: string;
  descripcion: string;
  monto: number;
  cliente: string;
  rnc: string | null;
  estado: string;
  data: any;
}

interface ModalPagoProps {
  cobro: Cobro;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalPago = ({ cobro, onClose, onSuccess }: ModalPagoProps) => {
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [requiereNCF, setRequiereNCF] = useState(false);
  const [rnc, setRnc] = useState(cobro.rnc || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiereNCF && !rnc.trim()) {
      alert('⚠️ Debes proporcionar el RNC del cliente para emitir comprobante fiscal');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/cajas/cobros/procesar', {
        tipo: cobro.tipo,
        itemId: cobro.id,
        metodoPago,
        referenciaPago: referencia || null,
        observaciones: observaciones || null,
        requiereNCF,
        rnc: requiereNCF ? rnc : null
      });

      const facturaId = response.data.data.factura.id;

      const mensaje = requiereNCF
        ? '✅ Pago procesado exitosamente\n\nSe abrirá la factura con Comprobante Fiscal (NCF) para imprimir.'
        : '✅ Pago procesado exitosamente\n\nSe abrirá la factura para imprimir.';

      alert(mensaje);

      // Abrir factura en nueva pestaña para imprimir
      window.open(`http://localhost:3000/api/facturas/${facturaId}/imprimir`, '_blank');

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ Error al procesar el pago: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Procesar Pago</h2>
          <p className="text-sm text-gray-600 mt-1">{cobro.codigo} - {cobro.descripcion}</p>
        </div>

        <div className="p-6">
          {/* Resumen del cobro */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total a cobrar:</span>
              <span className="text-2xl font-bold text-blue-900">RD$ {cobro.monto.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Cliente:</strong> {cobro.cliente}</p>
              <p><strong>Tipo:</strong> {cobro.tipo} - {cobro.subtipo}</p>
              <p><strong>Fecha:</strong> {new Date(cobro.fecha).toLocaleDateString('es-DO')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Método de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Referencia */}
            {metodoPago !== 'Efectivo' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de Pago
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de referencia, cheque, etc."
                />
              </div>
            )}

            {/* Requiere NCF */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requiereNCF}
                  onChange={(e) => setRequiereNCF(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  ¿Requiere Comprobante Fiscal (NCF)?
                </span>
              </label>
            </div>

            {/* RNC */}
            {requiereNCF && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RNC del Cliente *
                </label>
                <input
                  type="text"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000-00000-0"
                  required={requiereNCF}
                />
              </div>
            )}

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Notas adicionales sobre el pago..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FiDollarSign />
                    Cobrar RD${cobro.monto.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function CobrosPendientesPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [cobroSeleccionado, setCobroSeleccionado] = useState<Cobro | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [vistaActual, setVistaActual] = useState<'pendientes' | 'historial'>('pendientes');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    totalIrc: 0,
    totalDenuncias: 0,
    totalFormularios: 0,
    montoTotal: 0
  });

  useEffect(() => {
    if (vistaActual === 'pendientes') {
      cargarCobros();
    } else {
      cargarHistorial();
    }
  }, [vistaActual, page]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setPage(1);
  }, [filtroTipo, busqueda]);

  const cargarCobros = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cajas/cobros/pendientes');
      setCobros(response.data.data.cobros || []);
      setStats({
        total: response.data.data.total || 0,
        totalIrc: response.data.data.totalIrc || 0,
        totalDenuncias: response.data.data.totalDenuncias || 0,
        totalFormularios: response.data.data.totalFormularios || 0,
        montoTotal: response.data.data.montoTotal || 0
      });
    } catch (error) {
      console.error('Error cargando cobros:', error);
      alert('Error al cargar los cobros pendientes');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cajas/cobros/historial');
      setCobros(response.data.data.historial || []);
      setStats({
        total: response.data.data.total || 0,
        totalIrc: 0,
        totalDenuncias: 0,
        totalFormularios: 0,
        montoTotal: 0
      });
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial de cobros');
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = (cobro: Cobro) => {
    setCobroSeleccionado(cobro);
    setMostrarModal(true);
  };

  const handleSuccess = () => {
    if (vistaActual === 'pendientes') {
      cargarCobros();
    } else {
      cargarHistorial();
    }
  };

  // Filtrar y paginar cobros
  const cobrosFiltrados = cobros.filter(cobro => {
    const pasaTipo = filtroTipo === 'TODOS' || cobro.tipo === filtroTipo;
    const pasaBusqueda = busqueda === '' ||
      cobro.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      cobro.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      cobro.cliente.toLowerCase().includes(busqueda.toLowerCase());
    return pasaTipo && pasaBusqueda;
  });

  // Calcular paginación del lado del cliente
  const totalFilteredPages = Math.ceil(cobrosFiltrados.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const cobrosPaginados = cobrosFiltrados.slice(startIndex, endIndex);

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'IRC': return 'bg-blue-100 text-blue-800';
      case 'DENUNCIA': return 'bg-orange-100 text-orange-800';
      case 'FORMULARIO': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cobros pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {vistaActual === 'pendientes' ? 'Cobros Pendientes' : 'Historial de Cobros'}
          </h1>
          <p className="text-gray-600 mt-1">
            {vistaActual === 'pendientes'
              ? 'Todos los servicios pendientes de pago'
              : 'Últimos 100 cobros procesados'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActual('pendientes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActual === 'pendientes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setVistaActual('historial')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActual === 'historial'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Pendientes</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-sm text-blue-600 mb-1">Solicitudes IRC</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalIrc}</div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4">
          <div className="text-sm text-orange-600 mb-1">Denuncias</div>
          <div className="text-2xl font-bold text-orange-900">{stats.totalDenuncias}</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <div className="text-sm text-purple-600 mb-1">Formularios</div>
          <div className="text-2xl font-bold text-purple-900">{stats.totalFormularios}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-sm text-green-600 mb-1">Monto Total</div>
          <div className="text-xl font-bold text-green-900">RD$ {stats.montoTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtro por tipo */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODOS">Todos los servicios</option>
              <option value="IRC">Solicitudes IRC</option>
              <option value="DENUNCIA">Denuncias</option>
              <option value="FORMULARIO">Formularios</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código, descripción, cliente..."
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de cobros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cobrosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <FiCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
            <p className="text-xl font-medium text-gray-900">¡No hay cobros pendientes!</p>
            <p className="text-gray-600 mt-2">Todos los servicios están al día con sus pagos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  {vistaActual === 'historial' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cobrosPaginados.map((cobro) => (
                  <tr key={`${cobro.tipo}-${cobro.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoBadgeColor(cobro.tipo)}`}>
                        {cobro.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cobro.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cobro.descripcion}
                      <div className="text-xs text-gray-500">{cobro.subtipo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cobro.cliente}
                      {cobro.rnc && <div className="text-xs text-gray-500">RNC: {cobro.rnc}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cobro.fecha).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      RD$ {cobro.monto.toLocaleString()}
                    </td>
                    {vistaActual === 'historial' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cobro.estado === 'Abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cobro.estado}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vistaActual === 'pendientes' ? (
                        <button
                          onClick={() => handleCobrar(cobro)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <FiDollarSign />
                          Cobrar
                        </button>
                      ) : (
                        <button
                          onClick={() => window.open(`http://localhost:3000/api/facturas/${(cobro as any).facturaId}/imprimir`, '_blank')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <FiFileText />
                          Ver Factura
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalFilteredPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>Mostrando</span>
                  <span className="font-medium">{startIndex + 1}</span>
                  <span>a</span>
                  <span className="font-medium">{Math.min(endIndex, cobrosFiltrados.length)}</span>
                  <span>de</span>
                  <span className="font-medium">{cobrosFiltrados.length}</span>
                  <span>cobros</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                      let pageNum;
                      if (totalFilteredPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalFilteredPages - 2) {
                        pageNum = totalFilteredPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalFilteredPages, p + 1))}
                    disabled={page === totalFilteredPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {mostrarModal && cobroSeleccionado && (
        <ModalPago
          cobro={cobroSeleccionado}
          onClose={() => {
            setMostrarModal(false);
            setCobroSeleccionado(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
