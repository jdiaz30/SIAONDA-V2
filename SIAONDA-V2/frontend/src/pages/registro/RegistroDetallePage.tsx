import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBook, FiCalendar, FiUser, FiFileText, FiCheckCircle, FiDownload, FiUpload, FiSend } from 'react-icons/fi';
import { getRegistroDetalle, Registro } from '../../services/registroService';
import { getEstadoTexto, getEstadoColor } from '../../utils/estadosRegistro';

const RegistroDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarRegistro();
    }
  }, [id]);

  const cargarRegistro = async () => {
    try {
      setLoading(true);
      const data = await getRegistroDetalle(parseInt(id!));
      setRegistro(data);
    } catch (error) {
      console.error('Error al cargar registro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registro...</p>
        </div>
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Registro no encontrado</p>
          <button
            onClick={() => navigate('/registro')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/registro/historial')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Volver al Historial</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Detalle de Registro</h1>
            <p className="font-mono text-lg text-gray-600">{registro.numeroRegistro}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-medium rounded-full border ${getEstadoColor(
              registro.estado.nombre
            )}`}
          >
            {getEstadoTexto(registro.estado.nombre)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Obra */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiBook className="text-blue-600 text-2xl" />
              <h2 className="text-xl font-bold text-gray-900">Información de la Obra</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Título</label>
                <p className="text-lg font-semibold text-gray-900">{registro.tituloObra}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Obra</label>
                  <p className="text-gray-900">{registro.tipoObra}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de Registro</label>
                  <p className="font-mono font-semibold text-gray-900">{registro.numeroRegistro}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Formulario</label>
                <p className="text-gray-900">{registro.formularioProducto.formulario.codigo}</p>
              </div>

              {/* Ubicación Física */}
              {(registro.libroNumero || registro.hojaNumero) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="text-sm font-bold text-blue-900 mb-2 block">Ubicación Física en Registro</label>
                  <div className="grid grid-cols-2 gap-4">
                    {registro.libroNumero && (
                      <div>
                        <label className="text-xs font-medium text-blue-700">Libro</label>
                        <p className="text-xl font-bold text-blue-900">#{registro.libroNumero}</p>
                      </div>
                    )}
                    {registro.hojaNumero && (
                      <div>
                        <label className="text-xs font-medium text-blue-700">Hoja</label>
                        <p className="text-xl font-bold text-blue-900">#{registro.hojaNumero}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="text-blue-600 text-2xl" />
              <h2 className="text-xl font-bold text-gray-900">Información del Titular</h2>
            </div>

            {registro.formularioProducto.formulario.clientes.length > 0 ? (
              <div className="space-y-3">
                {registro.formularioProducto.formulario.clientes.map((rel, index) => (
                  <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                    <p className="font-semibold text-gray-900">
                      {rel.cliente.nombrecompleto}
                    </p>
                    <p className="text-sm text-gray-600">Cédula: {rel.cliente.identificacion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay información del titular</p>
            )}
          </div>

          {/* Campos del Formulario */}
          {registro.formularioProducto.campos && registro.formularioProducto.campos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiFileText className="text-blue-600 text-2xl" />
                <h2 className="text-xl font-bold text-gray-900">Datos Adicionales</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registro.formularioProducto.campos.map((campo) => {
                  // Determinar si el valor es largo o es un array para ocupar 2 columnas
                  const valor = campo.valor || 'N/A';
                  const esValorLargo = typeof valor === 'string' && valor.length > 100;
                  const esArray = typeof valor === 'string' && valor.includes('\n');

                  return (
                    <div
                      key={campo.campo.id}
                      className={`${esValorLargo || esArray ? 'md:col-span-2' : ''}`}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {campo.campo.titulo || campo.campo.nombre}
                      </label>
                      {esArray ? (
                        <div className="space-y-1">
                          {valor.split('\n').map((linea: string, idx: number) => (
                            <p key={idx} className="text-gray-900">
                              {linea || '—'}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {valor}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {registro.observaciones && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Observaciones</h2>
              <p className="text-gray-700">{registro.observaciones}</p>
            </div>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiCalendar className="text-blue-600 text-2xl" />
              <h2 className="text-xl font-bold text-gray-900">Timeline</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FiCheckCircle className="text-green-600" />
                  <p className="text-sm font-medium text-gray-900">Asentado</p>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  {new Date(registro.fechaAsentamiento).toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {registro.fechaGeneracionCert && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="text-green-600" />
                    <p className="text-sm font-medium text-gray-900">Certificado Generado</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(registro.fechaGeneracionCert).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {registro.fechaEnvioFirma && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="text-green-600" />
                    <p className="text-sm font-medium text-gray-900">Enviado a Firma</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(registro.fechaEnvioFirma).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {registro.fechaFirmaCert && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="text-green-600" />
                    <p className="text-sm font-medium text-gray-900">Certificado Firmado</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(registro.fechaFirmaCert).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {registro.fechaEnviadoAAU && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="text-green-600" />
                    <p className="text-sm font-medium text-gray-900">Enviado a AAU</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(registro.fechaEnviadoAAU).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {registro.fechaEntregado && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle className="text-green-600" />
                    <p className="text-sm font-medium text-gray-900">Entregado</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    {new Date(registro.fechaEntregado).toLocaleDateString('es-DO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usuario */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Usuario</h2>
            <div>
              <label className="text-sm font-medium text-gray-500">Asentado por</label>
              <p className="text-gray-900">{registro.usuarioAsentamiento.nombrecompleto}</p>
              {registro.usuarioAsentamiento.correo && (
                <p className="text-sm text-gray-500">{registro.usuarioAsentamiento.correo}</p>
              )}
            </div>
          </div>

          {/* Certificados */}
          {(registro.certificadoGenerado || registro.certificadoFirmado) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Certificados</h2>
              <div className="space-y-3">
                {registro.certificadoGenerado && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${registro.certificadoGenerado}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FiDownload />
                    <span className="text-sm">Certificado (sin firma)</span>
                  </a>
                )}
                {registro.certificadoFirmado && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${registro.certificadoFirmado}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-800"
                  >
                    <FiDownload />
                    <span className="text-sm">Certificado Firmado</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistroDetallePage;
