import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi';
import usuariosService, { Usuario, UsuarioTipo, CreateUsuarioData, UpdateUsuarioData } from '../services/usuariosService';
import UsuariosTable from '../components/usuarios/UsuariosTable';
import UsuarioFormModal from '../components/usuarios/UsuarioFormModal';
import RestablecerPasswordModal from '../components/usuarios/RestablecerPasswordModal';
import CambiarPasswordModal from '../components/usuarios/CambiarPasswordModal';
import { usePermissions } from '../hooks/usePermissions';
import NoAccess from '../components/common/NoAccess';

const UsuariosPage = () => {
  const { hasRole } = usePermissions();

  // Solo ADMINISTRADOR puede gestionar usuarios
  if (!hasRole('administrador')) {
    return (
      <div className="p-8">
        <NoAccess message="Solo el Administrador puede gestionar usuarios del sistema." />
      </div>
    );
  }
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [tipos, setTipos] = useState<UsuarioTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [page]);

  useEffect(() => {
    aplicarFiltros();
  }, [busqueda, filtroTipo, filtroEstado, usuarios]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [usuariosData, tiposData] = await Promise.all([
        usuariosService.getUsuarios(page, 20),
        usuariosService.getTiposUsuario()
      ]);

      setUsuarios(usuariosData.usuarios);
      setUsuariosFiltrados(usuariosData.usuarios);
      setTipos(tiposData);
      setTotalPages(usuariosData.pagination?.totalPages || 1);
      setTotal(usuariosData.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...usuarios];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(
        (u) =>
          u.nombre.toLowerCase().includes(busquedaLower) ||
          u.nombrecompleto.toLowerCase().includes(busquedaLower) ||
          u.codigo.toLowerCase().includes(busquedaLower) ||
          u.correo?.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de tipo
    if (filtroTipo) {
      resultado = resultado.filter((u) => u.tipo === filtroTipo);
    }

    // Filtro de estado
    if (filtroEstado) {
      resultado = resultado.filter((u) => u.estado === filtroEstado);
    }

    setUsuariosFiltrados(resultado);
  };

  const handleCrearUsuario = () => {
    setUsuarioSeleccionado(null);
    setModoEdicion(false);
    setShowFormModal(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModoEdicion(true);
    setShowFormModal(true);
  };

  const handleRestablecerPassword = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowResetModal(true);
  };

  const handleToggleEstado = async (usuario: Usuario) => {
    const accion = usuario.estado === 'Activo' ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro que desea ${accion} al usuario ${usuario.nombrecompleto}?`)) {
      return;
    }

    try {
      if (usuario.estado === 'Activo') {
        await usuariosService.deleteUsuario(usuario.id);
      } else {
        // Activar (cambiar estadoId a activo)
        const estadoActivo = 1; // Asumiendo que 1 es Activo
        await usuariosService.updateUsuario(usuario.id, { estadoId: estadoActivo });
      }
      await cargarDatos();
      alert(`Usuario ${accion === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`);
    } catch (err: any) {
      alert(err.response?.data?.message || `Error al ${accion} usuario`);
    }
  };

  const handleSubmitForm = async (data: CreateUsuarioData | UpdateUsuarioData) => {
    try {
      if (modoEdicion && usuarioSeleccionado) {
        await usuariosService.updateUsuario(usuarioSeleccionado.id, data as UpdateUsuarioData);
        alert('Usuario actualizado exitosamente');
      } else {
        await usuariosService.createUsuario(data as CreateUsuarioData);
        alert('Usuario creado exitosamente');
      }
      await cargarDatos();
      setShowFormModal(false);
    } catch (err: any) {
      throw err; // El modal maneja el error
    }
  };

  const handleConfirmReset = async () => {
    if (!usuarioSeleccionado) return { contrasenaTemporal: '' };

    try {
      const result = await usuariosService.restablecerContrasena(usuarioSeleccionado.id);
      await cargarDatos();
      return result;
    } catch (err: any) {
      throw err;
    }
  };

  const handleCambiarPassword = async (actual: string, nueva: string) => {
    try {
      await usuariosService.cambiarContrasena({
        contrasenaActual: actual,
        contrasenaNueva: nueva
      });
      alert('Contraseña cambiada exitosamente');
      setShowChangePasswordModal(false);
    } catch (err: any) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administre los usuarios del sistema y sus permisos</p>
        </div>
        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cambiar Mi Contraseña
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario, código o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro Tipo */}
            <div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los roles</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {usuariosFiltrados.length} de {total} usuarios
            </p>
            <div className="flex gap-2">
              <button
                onClick={cargarDatos}
                className="px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={handleCrearUsuario}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus className="h-5 w-5" />
                Nuevo Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <UsuariosTable
          usuarios={usuariosFiltrados}
          onEdit={handleEditarUsuario}
          onResetPassword={handleRestablecerPassword}
          onToggleEstado={handleToggleEstado}
        />

        {/* Paginación (si hay más de 20 usuarios) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <UsuarioFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmitForm}
        usuario={modoEdicion ? usuarioSeleccionado : null}
        tipos={tipos}
        usuarios={usuarios}
      />

      <RestablecerPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
        usuario={usuarioSeleccionado}
      />

      <CambiarPasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleCambiarPassword}
        obligatorio={false}
      />
    </div>
  );
};

export default UsuariosPage;
