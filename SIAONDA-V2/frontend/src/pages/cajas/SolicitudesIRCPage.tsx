import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface SolicitudIRC {
  id: number;
  codigo: string;
  nombreEmpresa: string;
  nombreComercial: string | null;
  rnc: string;
  tipoSolicitud: string;
  fechaRecepcion: string;
  categoriaIrc: {
    id: number;
    codigo: string;
    nombre: string;
    precio: number;
  };
  estado: {
    id: number;
    nombre: string;
  };
  recibidoPor: {
    id: number;
    nombrecompleto: string;
  };
  formulario: {
    id: number;
    codigo: string;
  } | null;
  factura: {
    id: number;
    codigo: string;
    ncf: string | null;
    fecha: string;
    total: number;
    metodoPago: string;
  } | null;
}

interface ModalCobrarProps {
  solicitud: SolicitudIRC | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCobrar = ({ solicitud, onClose, onSuccess }: ModalCobrarProps) => {
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [requiereNCF, setRequiereNCF] = useState(false);
  const [rnc, setRnc] = useState('');
  const [anosVigencia, setAnosVigencia] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!solicitud) return null;

  const precioAnual = Number(solicitud.categoriaIrc.precio);
  const total = precioAnual * anosVigencia;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiereNCF && !rnc.trim()) {
      alert('⚠️ Debes proporcionar el RNC del cliente para emitir comprobante fiscal');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/cajas/cobrar-solicitud/${solicitud.id}`, {
        metodoPago,
        referencia: referencia || null,
        observaciones: observaciones || null,
        requiereNCF,
        rnc: requiereNCF ? rnc : null,
        anosVigencia: anosVigencia
      });

      const facturaId = response.data.factura.id;

      const mensaje = requiereNCF
        ? '✅ Pago registrado exitosamente\n\nSe abrirá la factura con Comprobante Fiscal (NCF) para imprimir.'
        : '✅ Pago registrado exitosamente\n\nSe abrirá la factura para imprimir.';

      alert(mensaje);

      // Abrir factura en nueva pestaña para imprimir
      window.open(`http://localhost:3000/api/facturas/${facturaId}/imprimir`, '_blank');

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('❌ Error al registrar el pago: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cobrar Solicitud IRC</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Información de la Solicitud */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Solicitud</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-medium">{solicitud.codigo}</span>
              </div>
              <div>
                <span className="text-gray-600">RNC:</span>
                <span className="ml-2 font-medium">{solicitud.rnc}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Empresa:</span>
                <span className="ml-2 font-medium">{solicitud.nombreEmpresa}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Categoría:</span>
                <span className="ml-2 font-medium">{solicitud.categoriaIrc.codigo} - {solicitud.categoriaIrc.nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">{solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Registro Nuevo' : 'Renovación'}</span>
              </div>
              <div>
                <span className="text-gray-600">Recibido por:</span>
                <span className="ml-2 font-medium">{solicitud.recibidoPor.nombrecompleto}</span>
              </div>
            </div>
          </div>

          {/* Años de Vigencia */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Años de Vigencia *
            </label>
            <p className="text-xs text-purple-700 mb-3">
              Selecciona cuántos años desea pagar el cliente (precio: RD$ {precioAnual.toLocaleString('es-DO', { minimumFractionDigits: 2 })} por año)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((anos) => (
                <button
                  key={anos}
                  type="button"
                  onClick={() => setAnosVigencia(anos)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    anosVigencia === anos
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  {anos} {anos === 1 ? 'año' : 'años'}
                </button>
              ))}
            </div>
            {anosVigencia > 1 && (
              <p className="text-sm text-purple-700 mt-2 font-medium">
                ✓ Se cobrarán {anosVigencia} años de vigencia
              </p>
            )}
          </div>

          {/* Monto a Pagar */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-900 text-lg">TOTAL A PAGAR:</span>
              <span className="font-bold text-green-900 text-2xl">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
            {anosVigencia > 1 && (
              <p className="text-xs text-green-700 mt-2">
                {precioAnual.toLocaleString('es-DO', { minimumFractionDigits: 2 })} × {anosVigencia} años
              </p>
            )}
          </div>

          {/* Formulario de Pago */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {metodoPago !== 'Efectivo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia / No. de Transacción
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: AUTH-123456, CHQ-789, etc."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>

              {/* Comprobante Fiscal (NCF) */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="requiereNCF"
                    checked={requiereNCF}
                    onChange={(e) => setRequiereNCF(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiereNCF" className="ml-2 block text-sm font-medium text-gray-700">
                    ¿El cliente requiere Comprobante Fiscal (NCF)?
                  </label>
                </div>

                {requiereNCF && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RNC del Cliente *
                    </label>
                    <input
                      type="text"
                      value={rnc}
                      onChange={(e) => setRnc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: 130-12345-6"
                      required={requiereNCF}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El RNC es obligatorio para emitir comprobante fiscal
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function SolicitudesIRCPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudIRC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'PENDIENTE' | 'PAGADA' | 'TODAS'>('PENDIENTE');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudIRC | null>(null);

  useEffect(() => {
    cargarSolicitudes();
  }, [page, search, filtroEstado]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20, search };

      if (filtroEstado !== 'TODAS') {
        params.estado = filtroEstado;
      }

      const response = await api.get('/cajas/solicitudes-pendientes', { params });

      setSolicitudes(response.data.solicitudes);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      console.error('Error cargando solicitudes:', error);
      alert('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    cargarSolicitudes();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes IRC</h1>
          <p className="text-gray-600 mt-1">Solicitudes de registro de empresas en Inspectoría</p>
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex gap-2">
        <button
          onClick={() => { setFiltroEstado('PENDIENTE'); setPage(1); }}
          className={`px-4 py-2 rounded-md font-medium ${
            filtroEstado === 'PENDIENTE'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => { setFiltroEstado('PAGADA'); setPage(1); }}
          className={`px-4 py-2 rounded-md font-medium ${
            filtroEstado === 'PAGADA'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pagadas
        </button>
        <button
          onClick={() => { setFiltroEstado('TODAS'); setPage(1); }}
          className={`px-4 py-2 rounded-md font-medium ${
            filtroEstado === 'TODAS'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, RNC o nombre de empresa..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay solicitudes pendientes de pago
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa / RNC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría IRC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{solicitud.codigo}</div>
                        <div className="text-xs text-gray-500">
                          Form: {solicitud.formulario?.codigo || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{solicitud.nombreEmpresa}</div>
                        <div className="text-xs text-gray-500">RNC: {solicitud.rnc}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{solicitud.categoriaIrc.codigo}</div>
                        <div className="text-xs text-gray-500">{solicitud.categoriaIrc.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          solicitud.tipoSolicitud === 'REGISTRO_NUEVO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Nuevo' : 'Renovación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          RD$ {Number(solicitud.categoriaIrc.precio).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {solicitud.factura ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-600">
                              Factura: {solicitud.factura.codigo}
                              {solicitud.factura.ncf && <div>NCF: {solicitud.factura.ncf}</div>}
                            </div>
                            <button
                              onClick={() => window.open(`http://localhost:3000/api/facturas/${solicitud.factura!.id}/imprimir`, '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Reimprimir Factura
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSolicitudSeleccionada(solicitud)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Cobrar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Cobro */}
      {solicitudSeleccionada && (
        <ModalCobrar
          solicitud={solicitudSeleccionada}
          onClose={() => setSolicitudSeleccionada(null)}
          onSuccess={cargarSolicitudes}
        />
      )}
    </div>
  );
}
