import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFileText, FiEye, FiFilter, FiDownload } from 'react-icons/fi';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface ActoContrato {
  id: number;
  codigo: string;
  fecha: string;
  productoNombre: string;
  productoCategoria: string;
  clienteNombre: string;
  estado: string;
  montoTotal: number;
}

export default function ActosContratosPage() {
  const navigate = useNavigate();
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo JURIDICO
  if (!canAccessModule('JURIDICO')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo Jurídico. Esta área es solo para personal de Jurídico." />
      </div>
    );
  }

  const [actosContratos, setActosContratos] = useState<ActoContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');

  const productosActosContratos = [
    { codigo: 'AC-01', nombre: 'Actos o Contratos (Sin valores) hasta RD$200,000' },
    { codigo: 'AC-02', nombre: 'Actos o Contratos (Con valores) mayor a RD$200,000' },
    { codigo: 'AC-03', nombre: 'Convenios de Sociedades de Gestión Colectiva' },
    { codigo: 'AC-04', nombre: 'Decisión judicial, administrativa o arbitraje' },
    { codigo: 'AC-05', nombre: 'Cancelaciones, Adiciones o Modificaciones' },
    { codigo: 'AC-06', nombre: 'Certificaciones Generales' },
    { codigo: 'AC-07', nombre: 'Copias simples por páginas' },
  ];

  useEffect(() => {
    cargarActosContratos();
  }, []);

  const cargarActosContratos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/juridico/actos-contratos');
      setActosContratos(response.data);
    } catch (error) {
      console.error('Error cargando actos y contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const actosFiltrados = actosContratos.filter(acto => {
    const matchSearch = acto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       acto.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       acto.productoNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = !filtroEstado || acto.estado === filtroEstado;
    const matchProducto = !filtroProducto || acto.productoNombre.includes(filtroProducto);

    return matchSearch && matchEstado && matchProducto;
  });

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Recibido': 'bg-blue-100 text-blue-800',
      'En Proceso': 'bg-purple-100 text-purple-800',
      'Asentado': 'bg-green-100 text-green-800',
      'Devuelto': 'bg-red-100 text-red-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actos y Contratos</h1>
          <p className="text-gray-600">Gestión de actos jurídicos y contratos registrados</p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registrados</p>
              <p className="text-2xl font-bold text-gray-900">{actosContratos.length}</p>
            </div>
            <FiFileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {actosContratos.filter(a => a.estado === 'Pendiente').length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-purple-600">
                {actosContratos.filter(a => a.estado === 'En Proceso').length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Asentados</p>
              <p className="text-2xl font-bold text-green-600">
                {actosContratos.filter(a => a.estado === 'Asentado').length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, cliente o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por producto */}
          <div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {productosActosContratos.map(p => (
                <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Recibido">Recibido</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Asentado">Asentado</option>
              <option value="Devuelto">Devuelto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Acto/Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No se encontraron actos o contratos</p>
                    <p className="text-sm">Los actos y contratos registrados aparecerán aquí</p>
                  </td>
                </tr>
              ) : (
                actosFiltrados.map((acto) => (
                  <tr key={acto.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{acto.codigo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(acto.fecha).toLocaleDateString('es-DO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{acto.productoNombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{acto.clienteNombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(acto.estado)}`}>
                        {acto.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        RD$ {acto.montoTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/juridico/actos-contratos/${acto.id}`)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <FiEye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con total */}
      {actosFiltrados.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Mostrando {actosFiltrados.length} de {actosContratos.length} actos/contratos</span>
            <span className="font-medium">
              Total: RD$ {actosFiltrados.reduce((sum, a) => sum + a.montoTotal, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
