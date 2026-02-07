import { useState, useEffect } from 'react';
import aauService from '../../services/aauService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface HistorialEntrega {
  id: number;
  tipo: 'OBRA' | 'IRC';
  certificadoCodigo: string;
  numeroRegistro: string | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  categoria: string;
  fechaEntrega: string;
  nombreReceptor: string | null;
  cedulaReceptor: string | null;
  esRepresentante: boolean | null;
  rutaDocumentoLegal: string | null;
  usuarioEntrega: {
    nombrecompleto: string;
  };
}

export default function HistorialEntregasPage() {
  const { hasPermission } = usePermissions();

  // Verificar permiso para ver historial - RECEPCIONISTA SÍ puede
  if (!hasPermission('atu.historial_entregas.view_all') && !hasPermission('atu.historial_entregas.view_own')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para ver el historial de entregas. Esta funcionalidad es para personal de ATU autorizado." />
      </div>
    );
  }

  const [entregas, setEntregas] = useState<HistorialEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'OBRA' | 'IRC'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, [filtroTipo]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filtroTipo !== 'TODOS') {
        params.tipo = filtroTipo;
      }
      const data = await aauService.getHistorialEntregas(params);
      setEntregas(data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      alert('Error al cargar el historial de entregas');
    } finally {
      setLoading(false);
    }
  };

  const entregasFiltradas = entregas.filter((entrega) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      entrega.certificadoCodigo.toLowerCase().includes(searchLower) ||
      entrega.clienteNombre.toLowerCase().includes(searchLower) ||
      entrega.nombreReceptor?.toLowerCase().includes(searchLower) ||
      entrega.cedulaReceptor?.toLowerCase().includes(searchLower) ||
      entrega.categoria.toLowerCase().includes(searchLower)
    );
  });

  const descargarDocumentoLegal = (ruta: string) => {
    window.open(`http://localhost:3000${ruta}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Historial de Entregas de Certificados
        </h1>
        <p className="text-gray-600">
          Consulta todas las entregas realizadas de certificados OBRA e IRC
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, cliente, receptor, cédula..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Certificado
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'TODOS' | 'OBRA' | 'IRC')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos</option>
              <option value="OBRA">Obras</option>
              <option value="IRC">IRC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de entregas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente/Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receptor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rep.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregado Por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entregasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron entregas
                    </td>
                  </tr>
                ) : (
                  entregasFiltradas.map((entrega) => (
                    <tr key={entrega.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entrega.tipo === 'OBRA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {entrega.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entrega.certificadoCodigo}
                        {entrega.numeroRegistro && (
                          <div className="text-xs text-gray-500">
                            Reg: {entrega.numeroRegistro}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entrega.clienteNombre}
                        {entrega.clienteTelefono && (
                          <div className="text-xs text-gray-500">
                            Tel: {entrega.clienteTelefono}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={entrega.categoria}>
                          {entrega.categoria}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entrega.nombreReceptor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entrega.cedulaReceptor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {entrega.esRepresentante ? (
                          <span className="text-green-600 font-semibold">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entrega.fechaEntrega).toLocaleDateString('es-DO', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entrega.usuarioEntrega.nombrecompleto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entrega.rutaDocumentoLegal ? (
                          <button
                            onClick={() => descargarDocumentoLegal(entrega.rutaDocumentoLegal!)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver Doc
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total de entregas: <span className="font-semibold">{entregasFiltradas.length}</span>
              {busqueda && (
                <span className="ml-2">
                  (filtradas de {entregas.length} total)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
