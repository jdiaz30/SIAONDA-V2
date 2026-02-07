import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiArrowLeft, FiFileText, FiUser, FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';

interface Denuncia {
  id: number;
  codigo: string;
  denuncianteNombre: string;
  denuncianteTelefono: string | null;
  denuncianteEmail: string | null;
  denuncianteDireccion: string | null;
  empresaDenunciada: string;
  direccionEmpresa: string | null;
  descripcionHechos: string;
  estadoDenuncia: {
    id: number;
    nombre: string;
  };
  factura: {
    id: number;
    codigo: string;
    total: number;
    ncf: string | null;
    estado: {
      nombre: string;
    };
  } | null;
  casoGenerado: {
    id: number;
    codigo: string;
  } | null;
  rutaCedulaDenunciante: string | null;
  rutaComunicacion: string | null;
  creadoEn: string;
  recibidoPor?: {
    nombrecompleto: string;
  };
}

export default function DenunciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarDenuncia();
    }
  }, [id]);

  const cargarDenuncia = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/denuncias/${id}`);
      setDenuncia(response.data.data);
    } catch (error) {
      console.error('Error cargando denuncia:', error);
      alert('Error al cargar los detalles de la denuncia');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colores: any = {
      'PENDIENTE_PAGO': 'bg-yellow-100 text-yellow-800',
      'PAGADA': 'bg-blue-100 text-blue-800',
      'Pagada': 'bg-blue-100 text-blue-800',
      'EN_PLANIFICACION': 'bg-purple-100 text-purple-800',
      'ASIGNADA': 'bg-green-100 text-green-800',
      'EN_INSPECCION': 'bg-indigo-100 text-indigo-800',
      'FINALIZADA': 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado: string) => {
    const textos: any = {
      'PENDIENTE_PAGO': 'Pendiente de Pago',
      'PAGADA': 'Pagada',
      'Pagada': 'Pagada',
      'EN_PLANIFICACION': 'En Planificación',
      'ASIGNADA': 'Asignada a Inspector',
      'EN_INSPECCION': 'En Inspección',
      'FINALIZADA': 'Finalizada'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles de la denuncia...</p>
        </div>
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Denuncia no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/aau/denuncias')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          Volver a Denuncias
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{denuncia.codigo}</h1>
            <p className="text-gray-600 mt-1">Detalle de Denuncia - Inspección de Parte</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getEstadoBadge(denuncia.estadoDenuncia.nombre)}`}>
            {getEstadoTexto(denuncia.estadoDenuncia.nombre)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Denunciante */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Información del Denunciante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre Completo</label>
                <p className="mt-1 text-gray-900">{denuncia.denuncianteNombre}</p>
              </div>
              {denuncia.denuncianteTelefono && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                  <p className="mt-1 text-gray-900">{denuncia.denuncianteTelefono}</p>
                </div>
              )}
              {denuncia.denuncianteEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{denuncia.denuncianteEmail}</p>
                </div>
              )}
              {denuncia.denuncianteDireccion && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Dirección</label>
                  <p className="mt-1 text-gray-900">{denuncia.denuncianteDireccion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Empresa Denunciada */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="text-red-600" />
              Empresa Denunciada
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre de la Empresa</label>
                <p className="mt-1 text-gray-900 font-medium">{denuncia.empresaDenunciada}</p>
              </div>
              {denuncia.direccionEmpresa && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Dirección</label>
                  <p className="mt-1 text-gray-900">{denuncia.direccionEmpresa}</p>
                </div>
              )}
            </div>
          </div>

          {/* Descripción de los Hechos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFileText className="text-purple-600" />
              Descripción de los Hechos
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{denuncia.descripcionHechos}</p>
          </div>

          {/* Documentos Adjuntos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos</h2>
            <div className="space-y-3">
              {denuncia.rutaCedulaDenunciante && (
                <a
                  href={`http://localhost:3000/${denuncia.rutaCedulaDenunciante}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiFileText className="text-blue-600 text-xl" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Cédula del Denunciante</p>
                    <p className="text-sm text-gray-500">Documento de identidad</p>
                  </div>
                  <span className="text-blue-600 text-sm">Ver →</span>
                </a>
              )}
              {denuncia.rutaComunicacion && (
                <a
                  href={`http://localhost:3000/${denuncia.rutaComunicacion}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiFileText className="text-purple-600 text-xl" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Comunicación / Denuncia</p>
                    <p className="text-sm text-gray-500">Documento principal</p>
                  </div>
                  <span className="text-purple-600 text-sm">Ver →</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Información de Factura */}
          {denuncia.factura && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-green-600" />
                Factura
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Código</label>
                  <p className="mt-1 text-gray-900 font-mono">{denuncia.factura.codigo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Monto</label>
                  <p className="mt-1 text-gray-900 font-bold text-lg">RD$ {denuncia.factura.total.toLocaleString()}</p>
                </div>
                {denuncia.factura.ncf && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">NCF</label>
                    <p className="mt-1 text-gray-900 font-mono text-sm">{denuncia.factura.ncf}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${getEstadoBadge(denuncia.factura.estado.nombre)}`}>
                    {denuncia.factura.estado.nombre}
                  </span>
                </div>
                <button
                  onClick={() => window.open(`http://localhost:3000/api/facturas/${denuncia.factura!.id}/imprimir`, '_blank')}
                  className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Ver Factura
                </button>
              </div>
            </div>
          )}

          {/* Caso Generado */}
          {denuncia.casoGenerado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Caso de Inspección</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-green-700">Código del Caso</label>
                  <p className="mt-1 text-green-900 font-mono font-bold">{denuncia.casoGenerado.codigo}</p>
                </div>
                <button
                  onClick={() => navigate(`/inspectoria/casos/${denuncia.casoGenerado!.id}`)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Ver Caso de Inspección
                </button>
              </div>
            </div>
          )}

          {/* Metadatos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiCalendar className="text-gray-600" />
              Información del Registro
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-500">Registrado por</label>
                <p className="mt-1 text-gray-900">
                  {denuncia.recibidoPor?.nombrecompleto || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-gray-500">Fecha de registro</label>
                <p className="mt-1 text-gray-900">{new Date(denuncia.creadoEn).toLocaleString('es-DO')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
