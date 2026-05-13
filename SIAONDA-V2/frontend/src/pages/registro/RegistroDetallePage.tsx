import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBook, FiCalendar, FiUser, FiFileText, FiCheckCircle, FiDownload, FiClock } from 'react-icons/fi';
import { getRegistroDetalle, Registro } from '../../services/registroService';
import { getEstadoTexto, getEstadoColor } from '../../utils/estadosRegistro';
import { api } from '../../services/api';
import FormularioHistorialTimeline from '../../components/formularios/FormularioHistorialTimeline';

const RegistroDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [obrasProduccion, setObrasProduccion] = useState<Registro[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (id) {
      // Limpiar estado anterior
      setObrasProduccion([]);
      setRegistro(null);
      setHistorial([]);

      cargarRegistro();
      cargarHistorial();
    }
  }, [id]);

  const cargarRegistro = async () => {
    try {
      setLoading(true);
      const data = await getRegistroDetalle(parseInt(id!));
      setRegistro(data);

      // Obtener titulo y titulo_produccion
      const tituloObraCampo = data?.formularioProducto?.campos?.find(
        (c: any) => c.campo?.campo === 'titulo'
      );
      const tituloProduccionCampo = data?.formularioProducto?.campos?.find(
        (c: any) => c.campo?.campo === 'titulo_produccion'
      );

      const tituloObra = tituloObraCampo?.valor?.trim();
      const tituloProduccion = tituloProduccionCampo?.valor?.trim();

      console.log('Título obra:', tituloObra);
      console.log('Título producción:', tituloProduccion);

      // REGLA: Solo mostrar el listado de obras si estamos accediendo desde el historial
      // a la "vista agrupada" de la producción.
      // Esto se detecta cuando el parámetro de URL incluye "?produccion=true"
      const urlParams = new URLSearchParams(window.location.search);
      const esVistaProduccion = urlParams.get('produccion') === 'true';

      if (esVistaProduccion && tituloProduccion) {
        console.log('Vista de producción completa, cargando todas las obras');
        await cargarObrasProduccion(data);
      } else {
        console.log('Vista de obra individual, no cargar listado');
      }
    } catch (error) {
      console.error('Error al cargar registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarObrasProduccion = async (registroPrincipal: Registro) => {
    try {
      // Obtener el titulo_produccion de este registro
      const tituloProduccionCampo = registroPrincipal.formularioProducto.campos?.find(
        (c: any) => c.campo.campo === 'titulo_produccion'
      );

      if (!tituloProduccionCampo?.valor) {
        console.log('No se encontró el campo titulo_produccion');
        return;
      }

      const tituloProduccion = tituloProduccionCampo.valor;
      console.log('Buscando obras con titulo_produccion:', tituloProduccion);

      // Usar el nuevo endpoint específico para obtener obras de producción
      const response = await api.get('/registro/produccion/obras', {
        params: {
          tituloProduccion: tituloProduccion
        }
      });

      console.log('Obras encontradas:', response.data.data.obras.length);
      setObrasProduccion(response.data.data.obras || []);
    } catch (error) {
      console.error('Error al cargar obras de la producción:', error);
      setObrasProduccion([]);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      // Obtener el formularioId del registro
      const registroData = await getRegistroDetalle(parseInt(id!));
      if (registroData?.formularioProducto?.formulario?.id) {
        const response = await api.get(`/formularios/${registroData.formularioProducto.formulario.id}/historial`);
        setHistorial(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
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

      {/* Sección de Obras de la Producción */}
      {registro.tipoObra === 'PRODUCCIÓN' && obrasProduccion.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FiBook className="text-purple-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-900">
              Obras que componen la Producción ({obrasProduccion.length} obras)
            </h2>
          </div>

          <div className="space-y-3">
            {obrasProduccion.map((obra, index) => {
              // Obtener el título individual de la obra
              const tituloObraCampo = obra.formularioProducto?.campos?.find(
                (c: any) => c.campo?.campo === 'titulo'
              );
              const tituloObra = tituloObraCampo?.valor || obra.tituloObra;

              const handleObraClick = () => {
                console.log('Navegando a obra:', obra.id);
                navigate(`/registro/${obra.id}`);
              };

              return (
                <div
                  key={obra.id}
                  onClick={handleObraClick}
                  className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tituloObra}</p>
                      <p className="text-sm text-gray-600">
                        Registro: <span className="font-mono">{obra.numeroRegistro}</span>
                        {obra.libroNumero && obra.hojaNumero && (
                          <span className="ml-3">
                            Libro {obra.libroNumero}, Hoja {obra.hojaNumero}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getEstadoColor(
                      obra.estado.nombre
                    )}`}
                  >
                    {getEstadoTexto(obra.estado.nombre)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Obra - Solo si NO es producción */}
          {registro.tipoObra !== 'PRODUCCIÓN' && (
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
          )
          }

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

          {/* Información de Producción (si aplica) */}
          {((registro as any).esProduccion || (registro as any).obrasProduccion) && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiBook className="text-purple-600 text-2xl" />
                <h2 className="text-xl font-bold text-gray-900">Producción</h2>
              </div>

              <div className="space-y-3">
                {(registro as any).tituloProduccion && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Título de la Producción</label>
                    <p className="text-lg font-semibold text-gray-900">{(registro as any).tituloProduccion}</p>
                  </div>
                )}

                {(registro as any).obrasProduccion && (registro as any).obrasProduccion.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                      Obras que componen esta producción ({(registro as any).obrasProduccion.length})
                    </label>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {(registro as any).obrasProduccion.map((obra: any, index: number) => (
                        <div
                          key={obra.id}
                          onClick={() => navigate(`/registro/${obra.id}`)}
                          className="bg-white rounded-lg p-5 border-2 border-purple-200 hover:shadow-lg hover:border-purple-400 transition-all cursor-pointer"
                        >
                          {/* Encabezado de la Obra */}
                          <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                  Obra #{index + 1}
                                </span>
                                <span className="font-mono text-sm text-gray-600">{obra.numeroRegistro}</span>
                              </div>
                              <p className="text-lg font-bold text-gray-900">{obra.tituloObra}</p>
                              <p className="text-sm text-gray-600 mt-1">{obra.tipoObra}</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              obra.estado.nombre === 'ASENTADO' ? 'bg-green-100 text-green-800' :
                              obra.estado.nombre === 'PENDIENTE_ASENTAMIENTO' ? 'bg-yellow-100 text-yellow-800' :
                              obra.estado.nombre === 'CERTIFICADO_GENERADO' ? 'bg-blue-100 text-blue-800' :
                              obra.estado.nombre === 'LISTO_PARA_ENTREGA' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {obra.estado.nombre.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Información Básica */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {obra.formularioProducto.producto && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">Categoría</label>
                                <p className="text-sm font-semibold text-gray-900">
                                  {obra.formularioProducto.producto.categoria}
                                </p>
                              </div>
                            )}
                            {obra.libroNumero && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">Libro / Hoja</label>
                                <p className="text-sm font-semibold text-gray-900">
                                  #{obra.libroNumero} / #{obra.hojaNumero}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Campos Adicionales */}
                          {obra.formularioProducto.campos && obra.formularioProducto.campos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <label className="text-xs font-bold text-gray-700 mb-2 block">Detalles de la Obra</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {obra.formularioProducto.campos
                                  .filter((campo: any) => campo.valor && campo.valor.trim() !== '')
                                  .slice(0, 8)
                                  .map((campo: any) => {
                                    const valor = campo.valor || 'N/A';
                                    const esValorLargo = typeof valor === 'string' && valor.length > 60;

                                    return (
                                      <div
                                        key={campo.campo.id}
                                        className={`${esValorLargo ? 'md:col-span-2' : ''}`}
                                      >
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          {campo.campo.titulo || campo.campo.campo}
                                        </label>
                                        <p className={`text-sm text-gray-900 ${esValorLargo ? '' : 'truncate'}`} title={valor}>
                                          {valor}
                                        </p>
                                      </div>
                                    );
                                  })}
                              </div>
                              {obra.formularioProducto.campos.length > 8 && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  + {obra.formularioProducto.campos.length - 8} campos más...
                                </p>
                              )}
                            </div>
                          )}

                          {/* Fechas */}
                          {obra.fechaAsentamiento && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
                              <FiCalendar className="text-blue-600" />
                              <span>Asentado: {new Date(obra.fechaAsentamiento).toLocaleDateString('es-DO')}</span>
                            </div>
                          )}

                          {/* Indicador de Clickeable */}
                          <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-center text-xs text-purple-600 font-medium">
                            <span>Click para ver el detalle completo de esta obra →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campos del Formulario - Solo si NO es producción */}
          {!((registro as any).esProduccion || (registro as any).obrasProduccion || obrasProduccion.length > 0) && registro.formularioProducto.campos && registro.formularioProducto.campos.length > 0 && (
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

          {/* Archivos Adjuntos */}
          {registro.formularioProducto?.archivos && registro.formularioProducto.archivos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiDownload className="text-blue-600 text-2xl" />
                <h2 className="text-xl font-bold text-gray-900">
                  Archivos Adjuntos ({registro.formularioProducto.archivos.length})
                </h2>
              </div>

              <div className="space-y-3">
                {registro.formularioProducto.archivos.map((archivo: any) => (
                  <div
                    key={archivo.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FiFileText className="text-blue-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">{archivo.nombreOriginal}</p>
                        <p className="text-xs text-gray-500">
                          {(archivo.tamano / 1024).toFixed(2)} KB • {archivo.mimeType}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/archivos/${archivo.ruta}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload />
                      <span className="text-sm font-medium">Descargar</span>
                    </a>
                  </div>
                ))}
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
                    href={`/${registro.certificadoGenerado}`}
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
                    href={`/${registro.certificadoFirmado}`}
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

      {/* Historial del Formulario */}
      {registro?.formularioProducto?.formulario?.id && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FiClock className="text-2xl text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Historial de Cambios del Formulario</h2>
          </div>

          {loadingHistorial ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FormularioHistorialTimeline historial={historial} />
          )}
        </div>
      )}
    </div>
  );
};

export default RegistroDetallePage;
