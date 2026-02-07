import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { usePermissions } from '../hooks/usePermissions';

const MainLayout = () => {
  const { usuario, logout } = useAuthStore();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y Marca */}
            <div className="flex items-center gap-4">
              <div className="text-white text-2xl font-bold">SIAONDA</div>
              <div className="text-white/80 text-sm hidden md:block">
                Sistema Integral de la Oficina Nacional de Derecho de Autor
              </div>
            </div>

            {/* Usuario y Acciones */}
            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <div className="font-semibold">{usuario?.nombrecompleto}</div>
                <div className="text-sm text-white/80">
                  <span className="mr-2">Código: {usuario?.codigo}</span>
                  <span className="bg-white/20 px-2 py-1 rounded">{usuario?.tipo}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 border border-white/30"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 py-3">
            <NavLink to="/">Inicio</NavLink>

            {/* Gestión de Usuarios - Solo ADMINISTRADOR */}
            {isAdmin() && <NavLink to="/usuarios">Usuarios</NavLink>}

            {/* Módulo ATU */}
            <NavLink to="/aau">Atención al Usuario</NavLink>

            {/* Módulo REGISTRO */}
            <NavLink to="/registro">Registro</NavLink>

            {/* Módulo CAJAS */}
            <NavLink to="/cajas">Cajas</NavLink>

            {/* Módulo INSPECTORÍA */}
            <NavLink to="/inspectoria">Inspectoría</NavLink>

            {/* Módulo JURÍDICO */}
            <NavLink to="/juridico">Jurídico</NavLink>

            {/* REPORTES */}
            <NavLink to="/reportes">Reportes</NavLink>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2025 Oficina Nacional de Derecho de Autor (ONDA) - República Dominicana</p>
            <p className="text-xs mt-1">SIAONDA V2.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <Link
      to={to}
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-blue-600 pb-1"
    >
      {children}
    </Link>
  );
};

export default MainLayout;
