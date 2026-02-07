import { usePermissions } from '../hooks/usePermissions';
import NoAccess from '../components/common/NoAccess';

const CertificadosPage = () => {
  const { isAdmin } = usePermissions();

  // Restricción: Solo ADMINISTRADOR puede acceder a esta página antigua
  if (!isAdmin()) {
    return (
      <div className="p-8">
        <NoAccess message="Esta página es de uso interno exclusivo del Administrador. Por favor, usa el módulo correspondiente (Registro o ATU) para gestionar certificados." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Certificados</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Módulo de certificados en construcción...</p>
      </div>
    </div>
  );
};

export default CertificadosPage;
