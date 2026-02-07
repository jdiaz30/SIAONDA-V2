import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FiFileText,
  FiClock,
  FiAward,
  FiDollarSign,
  FiAlertTriangle,
  FiUser
} from 'react-icons/fi';

interface DashboardStats {
  formulariosHoy: number;
  formulariosPendientes: number;
  certificadosHoy: number;
  facturasHoy: number;
  montoHoy: string;
  cajaAbierta: boolean;
}

const DashboardPage = () => {
  const { usuario } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    formulariosHoy: 0,
    formulariosPendientes: 0,
    certificadosHoy: 0,
    facturasHoy: 0,
    montoHoy: 'RD$ 0.00',
    cajaAbierta: false,
  });
  const [loading, setLoading] = useState(true);

  // Permisos basados en tipo de usuario
  const permisos = {
    puedeVerFormularios: ['SUPERUSUARIO', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'REGISTRADOR', 'DIGITADOR', 'ATENCION_USUARIO'].includes(usuario?.tipo || ''),
    puedeVerCertificados: ['SUPERUSUARIO', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'CERTIFICADOR', 'ATENCION_USUARIO'].includes(usuario?.tipo || ''),
    puedeVerFacturas: ['SUPERUSUARIO', 'ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'FACTURADOR'].includes(usuario?.tipo || ''),
    puedeVerCajas: ['SUPERUSUARIO', 'ADMINISTRADOR', 'COORDINADOR', 'CAJERO'].includes(usuario?.tipo || ''),
  };

  // Cargar estadísticas desde el backend
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con colores dominicanos */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white border-b-4 border-red-500">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenido, {usuario?.nombrecompleto}
        </h1>
        <p className="text-blue-50">
          {usuario?.tipo} • Código: {usuario?.codigo}
        </p>
      </div>

      {/* Alerta de caja */}
      {permisos.puedeVerCajas && !stats.cajaAbierta && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-sm p-5">
          <div className="flex items-center">
            <FiAlertTriangle className="text-3xl text-red-600 mr-4 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-bold">
                No tienes una caja abierta
              </p>
              <p className="text-xs text-red-700 mt-1">
                Necesitas abrir una caja para procesar transacciones
              </p>
            </div>
            <Link
              to="/cajas"
              className="ml-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-md"
            >
              Abrir Caja
            </Link>
          </div>
        </div>
      )}

      {/* Estadísticas principales con colores dominicanos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Día</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {permisos.puedeVerFormularios && (
            <>
              <DashboardCard
                title="Formularios Hoy"
                value={stats.formulariosHoy.toString()}
                icon={<FiFileText className="text-4xl" />}
                color="blue"
              />
              <DashboardCard
                title="Pendientes"
                value={stats.formulariosPendientes.toString()}
                icon={<FiClock className="text-4xl" />}
                color="gray"
              />
            </>
          )}

          {permisos.puedeVerCertificados && (
            <DashboardCard
              title="Certificados Hoy"
              value={stats.certificadosHoy.toString()}
              icon={<FiAward className="text-4xl" />}
              color="blue"
            />
          )}

          {permisos.puedeVerFacturas && (
            <DashboardCard
              title="Monto Facturado Hoy"
              value={stats.montoHoy}
              icon={<FiDollarSign className="text-4xl" />}
              color="red"
            />
          )}
        </div>
      </div>

      {/* Información del usuario con diseño mejorado */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiUser className="text-2xl text-blue-600 mr-3" />
          Información del Usuario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoRow label="Nombre Completo" value={usuario?.nombrecompleto || ''} />
          <InfoRow label="Usuario" value={usuario?.nombre || ''} />
          <InfoRow label="Código" value={usuario?.codigo || ''} />
          <InfoRow label="Tipo" value={usuario?.tipo || ''} />
          <InfoRow label="Correo" value={usuario?.correo || 'No registrado'} />
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'gray';
}) => {
  const styles = {
    blue: {
      bg: 'bg-white',
      border: 'border-l-4 border-blue-500',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
    },
    gray: {
      bg: 'bg-white',
      border: 'border-l-4 border-gray-300',
      iconColor: 'text-gray-400',
      textColor: 'text-gray-700',
    },
  }[color];

  return (
    <div className={`${styles.bg} ${styles.border} rounded-xl shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className={styles.iconColor}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold mb-1 ${styles.textColor}`}>{value}</p>
      <p className="text-sm text-gray-600 font-medium">{title}</p>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500 font-medium mb-1">{label}</span>
      <span className="text-gray-900 font-semibold text-lg">{value}</span>
    </div>
  );
};

export default DashboardPage;
