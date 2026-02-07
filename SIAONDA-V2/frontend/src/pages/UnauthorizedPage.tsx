import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { usuario } = usePermissions();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>

        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Usuario:</span> {usuario?.nombrecompleto}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Rol:</span> {usuario?.tipo}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Volver Atrás
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Si crees que deberías tener acceso a esta página, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
