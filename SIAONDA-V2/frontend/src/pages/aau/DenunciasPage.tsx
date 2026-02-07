import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiPlus, FiEye, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

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
    total: number;
  } | null;
  casoGenerado: {
    id: number;
    codigo: string;
  } | null;
  creadoEn: string;
}

export default function DenunciasPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Verificar permiso para ver denuncias - RECEPCIONISTA NO puede
  if (!hasPermission('atu.denuncias.view_all') && !hasPermission('atu.denuncias.create')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para ver las denuncias. Esta funcionalidad es solo para Técnicos ATU y Encargado de ATU." />
      </div>
    );
  }

  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDenuncias();
  }, [filtroEstado]);

  const cargarDenuncias = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filtroEstado) params.estadoId = filtroEstado;
      if (busqueda) params.search = busqueda;

      const response = await api.get('/denuncias', { params });
      setDenuncias(response.data.data.denuncias || []);
    } catch (error) {
      console.error('Error cargando denuncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDenuncias();
  };

  const getEstadoBadge = (estado: string) => {
    const colores: any = {
      'PENDIENTE_PAGO': 'bg-yellow-100 text-yellow-800',
      'PAGADA': 'bg-blue-100 text-blue-800',
      'EN_PLANIFICACION': 'bg-purple-100 text-purple-800',
      'ASIGNADA': 'bg-green-100 text-green-800',
      'EN_INSPECCION': 'bg-indigo-100 text-indigo-800',
      'FINALIZADA': 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: any = {
      'PENDIENTE_PAGO': 'Pendiente de Pago',
      'PAGADA': 'Pagada',
      'EN_PLANIFICACION': 'En Planificación',
      'ASIGNADA': 'Asignada a Inspector',
      'EN_INSPECCION': 'En Inspección',
      'FINALIZADA': 'Finalizada'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Denuncias</h1>
          <p className="text-gray-600 mt-1">Inspecciones de Parte - Denuncias Ciudadanas</p>
        </div>
        <button
          onClick={() => navigate('/aau/denuncias/nueva')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md"
        >
          <FiPlus className="text-xl" />
          Nueva Denuncia
        </button>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Proceso de Denuncia</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li><strong>1.</strong> Registrar denuncia en sistema</li>
              <li><strong>2.</strong> Cliente va a Caja y paga RD$3,000</li>
              <li><strong>3.</strong> Denuncia pasa a Inspectoría</li>
              <li><strong>4.</strong> Inspector revisa y genera inspección de parte</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleBuscar} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, denunciante o empresa..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="1">Pendiente de Pago</option>
            <option value="2">Pagada</option>
            <option value="3">En Planificación</option>
            <option value="4">Asignada</option>
            <option value="5">En Inspección</option>
            <option value="6">Finalizada</option>
          </select>
          <button
            type="submit"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla de Denuncias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {denuncias.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiAlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No hay denuncias registradas</p>
            <p className="text-sm mt-1">Las denuncias aparecerán aquí una vez registradas</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Denunciante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa Denunciada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {denuncias.map((denuncia) => (
                <tr key={denuncia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{denuncia.codigo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{denuncia.denuncianteNombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{denuncia.empresaDenunciada}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(denuncia.estadoDenuncia.nombre)}`}>
                      {getEstadoTexto(denuncia.estadoDenuncia.nombre)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {denuncia.factura ? (
                      <div className="text-sm">
                        <div className="font-medium text-green-600">{denuncia.factura.codigo}</div>
                        <div className="text-gray-500">RD${denuncia.factura.total.toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin factura</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {denuncia.casoGenerado ? (
                      <div className="text-sm font-medium text-blue-600">
                        {denuncia.casoGenerado.codigo}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin caso</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(denuncia.creadoEn).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/aau/denuncias/${denuncia.id}`)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FiEye />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resumen */}
      {denuncias.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            <strong>{denuncias.length}</strong> denuncia{denuncias.length !== 1 ? 's' : ''} encontrada{denuncias.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
