import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiUser, FiCalendar, FiDollarSign, FiDownload } from 'react-icons/fi';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface ActoContratoDetalle {
  id: number;
  codigo: string;
  fecha: string;
  productoNombre: string;
  productoCategoria: string;
  estado: string;
  montoTotal: number;
  observaciones: string;
  cliente: {
    nombrecompleto: string;
    identificacion: string;
    telefono: string;
    correo: string;
  };
  campos: Array<{
    titulo: string;
    valor: string;
  }>;
  archivos: Array<{
    id: number;
    nombreOriginal: string;
    ruta: string;
  }>;
}

export default function ActoContratoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo JURIDICO
  if (!canAccessModule('JURIDICO')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo Jurídico. Esta área es solo para personal de Jurídico." />
      </div>
    );
  }

  const [acto, setActo] = useState<ActoContratoDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/juridico/actos-contratos/${id}`);
      setActo(response.data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Recibido': 'bg-blue-100 text-blue-800 border-blue-200',
      'En Proceso': 'bg-purple-100 text-purple-800 border-purple-200',
      'Asentado': 'bg-green-100 text-green-800 border-green-200',
      'Devuelto': 'bg-red-100 text-red-800 border-red-200',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!acto) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontró el acto o contrato</p>
        <button
          onClick={() => navigate('/juridico/actos-contratos')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/juridico/actos-contratos')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{acto.codigo}</h1>
            <p className="text-gray-600">{acto.productoNombre}</p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-lg border ${getEstadoColor(acto.estado)}`}>
          <span className="font-semibold">{acto.estado}</span>
        </div>
      </div>

      {/* Grid de información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiCalendar className="inline w-4 h-4 mr-1" />
                  Fecha de Registro
                </label>
                <p className="text-gray-900">
                  {new Date(acto.fecha).toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiDollarSign className="inline w-4 h-4 mr-1" />
                  Monto Total
                </label>
                <p className="text-gray-900 font-semibold">
                  RD$ {acto.montoTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiFileText className="inline w-4 h-4 mr-1" />
                  Tipo de Acto/Contrato
                </label>
                <p className="text-gray-900">{acto.productoNombre}</p>
              </div>
            </div>

            {acto.observaciones && (
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{acto.observaciones}</p>
              </div>
            )}
          </div>

          {/* Campos específicos del formulario */}
          {acto.campos && acto.campos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Acto/Contrato</h2>
              <div className="space-y-4">
                {acto.campos.map((campo, index) => (
                  <div key={index} className="border-b pb-3 last:border-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {campo.titulo}
                    </label>
                    <p className="text-gray-900">{campo.valor || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archivos adjuntos */}
          {acto.archivos && acto.archivos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos</h2>
              <div className="space-y-2">
                {acto.archivos.map((archivo) => (
                  <div
                    key={archivo.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FiFileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-900">{archivo.nombreOriginal}</span>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_API_URL}${archivo.ruta}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiDownload className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna lateral - 1/3 */}
        <div className="space-y-6">
          {/* Información del cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              Información del Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nombre Completo
                </label>
                <p className="text-sm text-gray-900 font-medium">
                  {acto.cliente.nombrecompleto}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Identificación
                </label>
                <p className="text-sm text-gray-900">{acto.cliente.identificacion}</p>
              </div>

              {acto.cliente.telefono && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Teléfono
                  </label>
                  <p className="text-sm text-gray-900">{acto.cliente.telefono}</p>
                </div>
              )}

              {acto.cliente.correo && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-sm text-gray-900">{acto.cliente.correo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Descargar Certificado
              </button>

              <button
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Imprimir Detalle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
