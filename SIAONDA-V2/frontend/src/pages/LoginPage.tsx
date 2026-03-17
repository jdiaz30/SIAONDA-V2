import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';

const LoginPage = () => {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ nombre, contrasena });
      console.log('🔐 LOGIN RESPONSE:', response);
      console.log('🔐 requiereCambioContrasena:', response.requiereCambioContrasena);

      // Establecer autenticación con el flag de cambio de contraseña
      setAuth(
        response.accessToken,
        response.refreshToken,
        response.usuario,
        response.permisos || [],
        response.requiereCambioContrasena
      );

      // Verificar si requiere cambio de contraseña
      if (response.requiereCambioContrasena) {
        console.log('🔐 Redirigiendo a /cambiar-contrasena');
        navigate('/cambiar-contrasena', { replace: true });
      } else {
        console.log('🔐 Redirigiendo a /dashboard');
        navigate('/dashboard', { replace: true });
      }
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
            Sistema Integral de Derecho de Autor
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">Oficina Nacional de Derecho de Autor</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-xl border-2 p-5 sm:p-6 md:p-8" style={{ borderColor: '#00008f' }}>
          <h3 className="text-lg sm:text-xl font-semibold text-center mb-5 sm:mb-6" style={{ color: '#00008f' }}>
            Iniciar Sesión
          </h3>

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
            <div>
              <label htmlFor="nombre" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#00008f' }}>
                Usuario / Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0093d4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base rounded-md border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all"
                  style={{ borderColor: '#0093d4' }}
                  placeholder="Ingresa tu usuario o correo"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-xs sm:text-sm font-medium mb-2" style={{ color: '#00008f' }}>
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#0093d4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base rounded-md border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all"
                  style={{ borderColor: '#0093d4' }}
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-md text-white font-semibold shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#00008f', borderColor: '#00008f' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t-2" style={{ borderColor: '#0093d4' }}>
            <p className="text-center text-xs sm:text-sm text-gray-600">
              ¿Problemas para acceder?{' '}
              <button className="font-medium transition-colors hover:underline" style={{ color: '#00008f' }}>
                Contactar soporte
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center px-2">
          <p className="text-xs sm:text-sm" style={{ color: '#00008f' }}>
            © {new Date().getFullYear()} ONDA - República Dominicana
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sistema Integral de Derecho de Autor v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
