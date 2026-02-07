import { useState } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';

interface CambiarPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contrasenaActual: string, contrasenaNueva: string) => Promise<void>;
  obligatorio?: boolean; // Si es true, no se puede cerrar sin cambiar
}

export default function CambiarPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  obligatorio = false
}: CambiarPasswordModalProps) {
  const [formData, setFormData] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarContrasena: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validarContrasena = (password: string) => {
    const requisitos = {
      longitud: password.length >= 6,
      mayuscula: /[A-Z]/.test(password),
      numero: /[0-9]/.test(password)
    };
    return requisitos;
  };

  const requisitos = validarContrasena(formData.contrasenaNueva);
  const todasCumplidas = requisitos.longitud && requisitos.mayuscula && requisitos.numero;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!todasCumplidas) {
      setError('La contraseña no cumple con los requisitos mínimos');
      return;
    }

    if (formData.contrasenaNueva !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.contrasenaActual === formData.contrasenaNueva) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData.contrasenaActual, formData.contrasenaNueva);
      setFormData({
        contrasenaActual: '',
        contrasenaNueva: '',
        confirmarContrasena: ''
      });
      if (!obligatorio) {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!obligatorio) {
      setFormData({
        contrasenaActual: '',
        contrasenaNueva: '',
        confirmarContrasena: ''
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {obligatorio ? 'Cambio de Contraseña Requerido' : 'Cambiar Mi Contraseña'}
            </h2>
            {!obligatorio && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {obligatorio && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Debe cambiar su contraseña temporal antes de continuar usando el sistema.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Contraseña Actual */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.actual ? 'text' : 'password'}
                  value={formData.contrasenaActual}
                  onChange={(e) => setFormData({ ...formData, contrasenaActual: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, actual: !showPasswords.actual })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.actual ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.nueva ? 'text' : 'password'}
                  value={formData.contrasenaNueva}
                  onChange={(e) => setFormData({ ...formData, contrasenaNueva: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, nueva: !showPasswords.nueva })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.nueva ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmar ? 'text' : 'password'}
                  value={formData.confirmarContrasena}
                  onChange={(e) => setFormData({ ...formData, confirmarContrasena: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirmar: !showPasswords.confirmar })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmar ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Requisitos */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Requisitos de contraseña:</p>
              <ul className="space-y-1 text-sm">
                <li className={requisitos.longitud ? 'text-green-600' : 'text-gray-500'}>
                  {requisitos.longitud ? '✓' : '○'} Mínimo 6 caracteres
                </li>
                <li className={requisitos.mayuscula ? 'text-green-600' : 'text-gray-500'}>
                  {requisitos.mayuscula ? '✓' : '○'} Al menos una letra mayúscula
                </li>
                <li className={requisitos.numero ? 'text-green-600' : 'text-gray-500'}>
                  {requisitos.numero ? '✓' : '○'} Al menos un número
                </li>
                <li className="text-gray-400">
                  ○ Se recomienda usar caracteres especiales
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              {!obligatorio && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading || !todasCumplidas}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
