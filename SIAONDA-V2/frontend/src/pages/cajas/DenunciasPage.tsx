import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FiDollarSign, FiFileText, FiUser, FiAlertOctagon, FiX } from 'react-icons/fi';

interface Denuncia {
  id: number;
  codigo: string;
  denuncianteNombre: string;
  empresaDenunciada: string;
  descripcionHechos: string;
  estadoDenuncia: {
    id: number;
    nombre: string;
  };
  factura: {
    id: number;
    codigo: string;
    ncf: string | null;
    total: number;
  } | null;
  creadoEn: string;
}

interface ModalCobrarProps {
  denuncia: Denuncia | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCobrar = ({ denuncia, onClose, onSuccess }: ModalCobrarProps) => {
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [requiereNCF, setRequiereNCF] = useState(false);
  const [rnc, setRnc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!denuncia) return null;

  const total = 3000; // Precio fijo denuncias

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiereNCF && !rnc.trim()) {
      alert('⚠️ Debes proporcionar el RNC del cliente para emitir comprobante fiscal');
      return;
    }

    try {
      setLoading(true);

      // 1. Crear factura genérica
      const facturaResponse = await api.post('/facturas/generica', {
        monto: total,
        concepto: `Denuncia ${denuncia.codigo}`,
        metodoPago,
        referenciaPago: referencia || null,
        observaciones: observaciones || null,
        requiereNCF,
        rnc: requiereNCF ? rnc : null
      });

      const facturaId = facturaResponse.data.data.id;

      // 2. Asociar factura a denuncia
      await api.put(`/denuncias/${denuncia.id}/asociar-factura`, {
        facturaId
      });

      const mensaje = requiereNCF
        ? '✅ Pago registrado exitosamente\n\nSe abrirá la factura con Comprobante Fiscal (NCF) para imprimir.\n\nLa denuncia pasará a Inspectoría para su revisión.'
        : '✅ Pago registrado exitosamente\n\nSe abrirá la factura para imprimir.\n\nLa denuncia pasará a Inspectoría para su revisión.';

      alert(mensaje);

      // Abrir factura en nueva pestaña para imprimir
      window.open(`http://localhost:3000/api/facturas/${facturaId}/imprimir`, '_blank');

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
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
            <h2 className="text-2xl font-bold text-gray-900">Cobrar Denuncia</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Información de la denuncia */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Código:</span>
                <p className="text-gray-900">{denuncia.codigo}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Denunciante:</span>
                <p className="text-gray-900">{denuncia.denuncianteNombre}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Empresa Denunciada:</span>
                <p className="text-gray-900">{denuncia.empresaDenunciada}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Monto:</span>
                <p className="text-2xl font-bold text-green-600">RD${total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Método de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago <span className="text-red-500">*</span>
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
                  RNC del Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XXX-XXXXXXX-X"
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
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales..."
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
                    Cobrar RD${total.toLocaleString()}
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

export default function CajasDenunciasPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<Denuncia | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarDenuncias();
  }, []);

  const cargarDenuncias = async () => {
    try {
      setLoading(true);
      // Cargar solo denuncias pendientes de pago
      const response = await api.get('/denuncias', {
        params: { estadoId: 1 } // PENDIENTE_PAGO
      });
      setDenuncias(response.data.data.denuncias || []);
    } catch (error) {
      console.error('Error cargando denuncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = (denuncia: Denuncia) => {
    setDenunciaSeleccionada(denuncia);
    setMostrarModal(true);
  };

  const handleSuccess = () => {
    cargarDenuncias();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cobrar Denuncias</h1>
        <p className="text-gray-600 mt-1">Inspecciones de Parte pendientes de pago</p>
      </div>

      {/* Información */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertOctagon className="text-orange-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Servicio de Inspección de Parte</h3>
            <p className="text-sm text-orange-800">
              Costo fijo: <strong>RD$3,000</strong> por denuncia. Una vez pagada, la denuncia pasa a Inspectoría para su revisión y planificación.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Denuncias */}
      {denuncias.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay denuncias pendientes de pago</h3>
          <p className="text-gray-600">Las denuncias aparecerán aquí cuando AAU las registre</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denunciante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa Denunciada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {denuncias.map((denuncia) => (
                <tr key={denuncia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{denuncia.codigo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <div className="text-sm text-gray-900">{denuncia.denuncianteNombre}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{denuncia.empresaDenunciada}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(denuncia.creadoEn).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600">RD$3,000</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCobrar(denuncia)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                      <FiDollarSign />
                      Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <ModalCobrar
          denuncia={denunciaSeleccionada}
          onClose={() => setMostrarModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
