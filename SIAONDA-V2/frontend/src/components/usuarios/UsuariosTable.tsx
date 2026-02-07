import { FiEdit, FiKey, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { Usuario } from '../../services/usuariosService';
import UsuarioEstadoBadge from './UsuarioEstadoBadge';

interface UsuariosTableProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onResetPassword: (usuario: Usuario) => void;
  onToggleEstado: (usuario: Usuario) => void;
}

export default function UsuariosTable({
  usuarios,
  onEdit,
  onResetPassword,
  onToggleEstado
}: UsuariosTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre Completo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supervisor
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                No se encontraron usuarios
              </td>
            </tr>
          ) : (
            usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {usuario.codigo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {usuario.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {usuario.nombrecompleto}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {usuario.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UsuarioEstadoBadge estado={usuario.estado} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {usuario.supervisor?.nombrecompleto || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(usuario)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onResetPassword(usuario)}
                      className="text-amber-600 hover:text-amber-900"
                      title="Restablecer Contraseña"
                    >
                      <FiKey className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onToggleEstado(usuario)}
                      className={
                        usuario.estado === 'Activo'
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }
                      title={usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    >
                      {usuario.estado === 'Activo' ? (
                        <FiTrash2 className="h-5 w-5" />
                      ) : (
                        <FiCheckCircle className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
