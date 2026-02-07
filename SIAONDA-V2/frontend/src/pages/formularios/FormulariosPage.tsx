import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formulariosService, Formulario } from '../../services/formulariosService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

export default function FormulariosPage() {
  const { isAdmin } = usePermissions();

  // Restricción: Solo ADMINISTRADOR puede acceder a esta página antigua
  if (!isAdmin()) {
    return (
      <div className="p-8">
        <NoAccess message="Esta página es de uso interno exclusivo del Administrador. Por favor, usa el módulo de Atención al Usuario (/aau) para gestionar formularios." />
      </div>
    );
  }

  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    loadFormularios();
  }, [filtroEstado]);

  const loadFormularios = async () => {
    try {
      setLoading(true);
      const response = await formulariosService.getFormularios({
        estado: filtroEstado || undefined
      });
      setFormularios(response);
    } catch (error) {
      console.error('Error cargando formularios:', error);
      setFormularios([]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Recibido': 'bg-blue-100 text-blue-800',
      'En Proceso': 'bg-green-100 text-green-800',
      'Asentado': 'bg-green-100 text-green-800',
      'Certificado': 'bg-emerald-100 text-emerald-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const formulariosFiltrados = formularios.filter(f => {
    const coincideBusqueda = !busqueda ||
      f.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.clientes.some(c => c.cliente.nombrecompleto.toLowerCase().includes(busqueda.toLowerCase())) ||
      f.clientes.some(c => c.cliente.identificacion.includes(busqueda)) ||
      f.usuario.nombrecompleto.toLowerCase().includes(busqueda.toLowerCase());

    return coincideBusqueda;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Formularios de Registro</h1>
          <p className="text-gray-600">Gestión de solicitudes de registro de obras</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/formularios/irc/nuevo"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Solicitud IRC
          </Link>
          <Link
            to="/formularios/nuevo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registro de Obra
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código, nombre de cliente, cédula..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
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
              <option value="Certificado">Certificado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {formulariosFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay formularios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando un nuevo formulario de registro
            </p>
            <div className="mt-6">
              <Link
                to="/formularios/nuevo"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Formulario
              </Link>
            </div>
          </div>
        ) : (
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
                    Cliente(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obra(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado por
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formulariosFiltrados.map((formulario) => (
                  <tr key={formulario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/formularios/${formulario.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {formulario.codigo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(formulario.fecha).toLocaleDateString('es-DO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formulario.clientes.slice(0, 2).map((c, i) => (
                          <div key={i}>{c.cliente.nombrecompleto}</div>
                        ))}
                        {formulario.clientes.length > 2 && (
                          <div className="text-gray-500">+{formulario.clientes.length - 2} más</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formulario.productos.slice(0, 2).map((p, i) => (
                          <div key={i}>{p.producto.nombre}</div>
                        ))}
                        {formulario.productos.length > 2 && (
                          <div className="text-gray-500">+{formulario.productos.length - 2} más</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(formulario.estado.nombre)}`}>
                        {formulario.estado.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formulario.usuario.nombrecompleto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/formularios/${formulario.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ver
                      </Link>
                      <Link
                        to={
                          formulario.productos.some(p => p.producto.codigo === 'IRC-01')
                            ? `/formularios/irc/${formulario.id}/editar`
                            : `/formularios/${formulario.id}/editar`
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
