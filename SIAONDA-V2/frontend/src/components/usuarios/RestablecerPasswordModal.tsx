import { useState } from 'react';
import { FiX, FiCopy, FiAlertTriangle } from 'react-icons/fi';
import { Usuario } from '../../services/usuariosService';

interface RestablecerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ contrasenaTemporal: string }>;
  usuario: Usuario | null;
}

export default function RestablecerPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  usuario
}: RestablecerPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contrasenaTemporal, setContrasenaTemporal] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const result = await onConfirm();
      setContrasenaTemporal(result.contrasenaTemporal);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(contrasenaTemporal);
    alert('Contraseña copiada al portapapeles');
  };

  const handleClose = () => {
    setContrasenaTemporal('');
    setSuccess(false);
    setError('');
    onClose();
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Restablecer Contraseña
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {!success ? (
              <>
                {/* Advertencia */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Esta acción asignará una contraseña temporal al usuario
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Info del usuario */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Usuario:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {usuario.nombrecompleto}
                  </p>
                  <p className="text-sm text-gray-500">({usuario.nombre})</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="forzarCambio"
                      checked
                      disabled
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="forzarCambio" className="ml-2 text-sm text-gray-700">
                      Forzar cambio de contraseña al próximo inicio de sesión
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="enviarEmail"
                      disabled
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="enviarEmail" className="ml-2 text-sm text-gray-500">
                      Enviar email con instrucciones
                      <span className="block text-xs">(Próximamente)</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Restableciendo...' : 'Restablecer'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success */}
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Contraseña Restablecida
                  </h3>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña temporal:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={contrasenaTemporal}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg text-center"
                    />
                    <button
                      onClick={handleCopyPassword}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copiar"
                    >
                      <FiCopy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ El usuario deberá cambiar esta contraseña en su próximo inicio de sesión
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
