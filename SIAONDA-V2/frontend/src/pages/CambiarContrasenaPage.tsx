import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/errorHandler';

const CambiarContrasenaPage = () => {
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const navigate = useNavigate();
  const { requiereCambioContrasena, setRequiereCambioContrasena } = useAuthStore();

  // Verificar si es cambio obligatorio (primera vez)
  const esCambioObligatorio = requiereCambioContrasena;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (contrasenaNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (contrasenaNueva !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await authService.cambiarContrasena({
        contrasenaActual: contrasenaActual || undefined,
        contrasenaNueva,
        confirmarContrasena
      });

      // Marcar que ya no requiere cambio de contraseña
      setRequiereCambioContrasena(false);

      alert('Contraseña cambiada exitosamente');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-12"
      style={{
        backgroundImage: 'url(/LOGIN.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/LOGO_LOGIN_NEW.png"
            alt="SIAONDA"
            className="h-20 sm:h-28 md:h-32 mx-auto mb-4 sm:mb-6"
          />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 px-2" style={{ color: '#00008f' }}>
            {esCambioObligatorio ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
          </h2>
          {esCambioObligatorio && (
            <p className="text-sm text-gray-600 px-4">
              Por seguridad, debe cambiar su contraseña predeterminada antes de continuar.
            </p>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-xl border-2 p-5 sm:p-6 md:p-8" style={{ borderColor: '#00008f' }}>
          {error && (
            <div className="mb-4 p-3 sm:p-4 rounded-md border-2" style={{ backgroundColor: '#fee', borderColor: '#d10114' }}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#d10114' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#d10114' }}>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!esCambioObligatorio && (
              <div>
                <label htmlFor="contrasenaActual" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#00008f' }}>
                  Contraseña Actual
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0093d4' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="contrasenaActual"
                    type={mostrarActual ? 'text' : 'password'}
                    value={contrasenaActual}
                    onChange={(e) => setContrasenaActual(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 text-sm sm:text-base rounded-md border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all"
                    style={{ borderColor: '#0093d4' }}
                    placeholder="Contraseña actual"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarActual(!mostrarActual)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mostrarActual ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="contrasenaNueva" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#00008f' }}>
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0093d4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="contrasenaNueva"
                  type={mostrarNueva ? 'text' : 'password'}
                  value={contrasenaNueva}
                  onChange={(e) => setContrasenaNueva(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 text-sm sm:text-base rounded-md border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all"
                  style={{ borderColor: '#0093d4' }}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoFocus={esCambioObligatorio}
                />
                <button
                  type="button"
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mostrarNueva ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="confirmarContrasena" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#00008f' }}>
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0093d4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  id="confirmarContrasena"
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 text-sm sm:text-base rounded-md border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all"
                  style={{ borderColor: '#0093d4' }}
                  placeholder="Confirmar contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mostrarConfirmar ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-md text-white font-semibold shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#00008f', borderColor: '#00008f' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cambiando...
                  </span>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
              {!esCambioObligatorio && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-md border-2 font-semibold hover:bg-gray-50 transition-all"
                  style={{ borderColor: '#0093d4', color: '#00008f' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center px-2">
          <p className="text-xs sm:text-sm" style={{ color: '#00008f' }}>
            © {new Date().getFullYear()} ONDA - República Dominicana
          </p>
        </div>
      </div>
    </div>
  );
};

export default CambiarContrasenaPage;
