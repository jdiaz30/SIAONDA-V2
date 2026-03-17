import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Usuario, UsuarioTipo, CreateUsuarioData, UpdateUsuarioData, Sucursal } from '../../services/usuariosService';
import usuariosService from '../../services/usuariosService';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioData | UpdateUsuarioData) => Promise<void>;
  usuario?: Usuario | null;
  tipos: UsuarioTipo[];
  usuarios: Usuario[]; // Para lista de supervisores
}

export default function UsuarioFormModal({
  isOpen,
  onClose,
  onSubmit,
  usuario,
  tipos,
  usuarios
}: UsuarioFormModalProps) {
  const isEdit = !!usuario;

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    nombrecompleto: '',
    correo: '',
    contrasena: 'ONDA2026',
    tipoId: '',
    supervisorId: '',
    sucursalId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Cargar sucursales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarSucursales();
    }
  }, [isOpen]);

  const cargarSucursales = async () => {
    try {
      const data = await usuariosService.getSucursales();
      setSucursales(data);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  useEffect(() => {
    if (usuario && isEdit) {
      setFormData({
        codigo: usuario.codigo,
        nombre: usuario.nombre,
        nombrecompleto: usuario.nombrecompleto,
        correo: usuario.correo || '',
        contrasena: 'ONDA2026',
        tipoId: usuario.tipoId?.toString() || '',
        supervisorId: usuario.supervisorId?.toString() || '',
        sucursalId: usuario.sucursalId?.toString() || ''
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        nombrecompleto: '',
        correo: '',
        contrasena: 'ONDA2026',
        tipoId: '',
        supervisorId: '',
        sucursalId: ''
      });
    }
    setError('');
  }, [usuario, isEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        // Actualizar: no enviamos código, nombre ni contraseña
        const updateData: UpdateUsuarioData = {
          nombrecompleto: formData.nombrecompleto,
          correo: formData.correo || undefined,
          tipoId: parseInt(formData.tipoId),
          supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : undefined,
          sucursalId: formData.sucursalId ? parseInt(formData.sucursalId) : undefined
        };
        await onSubmit(updateData);
      } else {
        // Crear: enviamos todos los campos
        const createData: CreateUsuarioData = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          nombrecompleto: formData.nombrecompleto,
          correo: formData.correo || undefined,
          contrasena: formData.contrasena,
          tipoId: parseInt(formData.tipoId),
          supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : undefined,
          sucursalId: formData.sucursalId ? parseInt(formData.sucursalId) : undefined
        };
        await onSubmit(createData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Código de Empleado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Empleado *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  disabled={isEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="EMP-001"
                  required={!isEdit}
                />
              </div>

              {/* Nombre de Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toLowerCase() })}
                  disabled={isEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="jdiaz"
                  required={!isEdit}
                />
                {!isEdit && (
                  <p className="text-xs text-gray-500 mt-1">Sin espacios, en minúsculas</p>
                )}
              </div>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombrecompleto}
                onChange={(e) => setFormData({ ...formData, nombrecompleto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jelsy Manuel Díaz Jiménez"
                required
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jelsy.diaz@onda.gob.do"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario (Rol) *
                </label>
                <select
                  value={formData.tipoId}
                  onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione un rol</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor (Opcional)
                </label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Ninguno</option>
                  {usuarios
                    .filter((u) => u.id !== usuario?.id) // No puede ser supervisor de sí mismo
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombrecompleto}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal (Opcional)
              </label>
              <select
                value={formData.sucursalId}
                onChange={(e) => setFormData({ ...formData, sucursalId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin sucursal asignada</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre} ({sucursal.codigo})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Los formularios y pagos del usuario se asociarán automáticamente a esta sucursal
              </p>
            </div>

            {/* Info de contraseña (solo crear) */}
            {!isEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Contraseña por Defecto
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>La contraseña temporal será: <strong className="font-mono">ONDA2026</strong></p>
                      <p className="mt-1">El usuario DEBE cambiarla al primer login</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Usuario')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
