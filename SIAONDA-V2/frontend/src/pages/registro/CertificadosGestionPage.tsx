import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiUpload,
  FiSend,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye
} from 'react-icons/fi';
import {
  getRegistrosParaCertificados,
  getCertificadosListosAAU,
  generarCertificado,
  subirCertificadoFirmado,
  enviarAAAU,
  Registro
} from '../../services/registroService';
import DetalleFormularioModal from '../../components/registro/DetalleFormularioModal';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

type Tab = 'generar' | 'firmar';

const CertificadosGestionPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [tabActual, setTabActual] = useState<Tab>('generar');

  // Verificar permisos para cada tab
  const puedeGenerar = hasPermission('registro.certificados.generate');
  const puedeFirmar = hasPermission('registro.certificados.firmar');

  // Si no tiene ningún permiso, mostrar mensaje
  if (!puedeGenerar && !puedeFirmar) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/registro')}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft /> Volver
        </button>
        <NoAccess message="No tienes permiso para gestionar certificados. Esta funcionalidad es solo para Técnicos de Certificación y Encargado de Registro." />
      </div>
    );
  }
  const [registrosGenerar, setRegistrosGenerar] = useState<Registro[]>([]);
  const [certificadosListos, setCertificadosListos] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState<number | null>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [registroParaUpload, setRegistroParaUpload] = useState<number | null>(null);
  const [registroDetalle, setRegistroDetalle] = useState<number | null>(null);

  // Paginación para tabla de generar
  const [paginaGenerar, setPaginaGenerar] = useState(1);
  const itemsPorPaginaGenerar = 4;

  // Paginación para tabla de firma
  const [paginaFirmar, setPaginaFirmar] = useState(1);
  const itemsPorPaginaFirmar = 4;

  // Paginación para tabla de enviar
  const [paginaEnviar, setPaginaEnviar] = useState(1);
  const itemsPorPaginaEnviar = 4;

  useEffect(() => {
    cargarDatos();
  }, [tabActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      if (tabActual === 'generar') {
        const data = await getRegistrosParaCertificados();
        // Ordenar por fecha mas reciente primero
        const ordenados = data.sort((a: any, b: any) => {
          const fechaA = new Date(a.creadoEn || a.fechaAsentamiento).getTime();
          const fechaB = new Date(b.creadoEn || b.fechaAsentamiento).getTime();
          return fechaB - fechaA;
        });
        setRegistrosGenerar(ordenados);
      } else if (tabActual === 'firmar') {
        const data = await getCertificadosListosAAU();
        // Ordenar por fecha mas reciente primero
        const ordenados = data.sort((a: any, b: any) => {
          const fechaA = new Date(a.fechaGeneracionCert || a.creadoEn || a.fechaAsentamiento).getTime();
          const fechaB = new Date(b.fechaGeneracionCert || b.creadoEn || b.fechaAsentamiento).getTime();
          return fechaB - fechaA;
        });
        setCertificadosListos(ordenados);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCertificado = async (id: number) => {
    try {
      setGenerando(id);
      const resultado = await generarCertificado(id);
      alert('Certificado generado exitosamente');

      // Abrir el PDF en nueva ventana
      window.open(`http://localhost:3000${resultado.certificadoUrl}`, '_blank');

      cargarDatos();
    } catch (error) {
      console.error('Error al generar certificado:', error);
      alert('Error al generar el certificado');
    } finally {
      setGenerando(null);
    }
  };

  const handleSeleccionarArchivo = (registroId: number) => {
    setRegistroParaUpload(registroId);
    fileInputRef.current?.click();
  };

  const handleArchivoSeleccionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !registroParaUpload) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    try {
      setSubiendo(registroParaUpload);
      await subirCertificadoFirmado(registroParaUpload, file);
      alert('Certificado firmado subido exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al subir certificado:', error);
      alert('Error al subir el certificado firmado');
    } finally {
      setSubiendo(null);
      setRegistroParaUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleSeleccion = (registro: any) => {
    // Si es producción, agregar/quitar todos los IDs de la producción
    const idsAToggle = registro.esProduccion && registro.idsProduccion
      ? registro.idsProduccion
      : [registro.id];

    setSeleccionados(prev => {
      const algunoSeleccionado = idsAToggle.some((id: number) => prev.includes(id));

      if (algunoSeleccionado) {
        // Quitar todos los IDs
        return prev.filter(id => !idsAToggle.includes(id));
      } else {
        // Agregar todos los IDs
        return [...prev, ...idsAToggle];
      }
    });
  };

  const handleEnviarAAU = async () => {
    if (seleccionados.length === 0) {
      alert('Seleccione al menos un certificado para enviar');
      return;
    }

    if (!confirm(`¿Enviar ${seleccionados.length} certificado(s) a AAU para entrega?`)) {
      return;
    }

    try {
      setEnviando(true);
      const cantidad = await enviarAAAU(seleccionados);
      alert(`${cantidad} certificado(s) enviado(s) a AAU exitosamente`);
      setSeleccionados([]);
      cargarDatos();
    } catch (error) {
      console.error('Error al enviar certificados:', error);
      alert('Error al enviar certificados a AAU');
    } finally {
      setEnviando(false);
    }
  };

  // Paginación para tabla de generar
  const totalPaginasGenerar = Math.ceil(registrosGenerar.length / itemsPorPaginaGenerar);
  const inicioGenerar = (paginaGenerar - 1) * itemsPorPaginaGenerar;
  const registrosGenerarPaginados = registrosGenerar.slice(inicioGenerar, inicioGenerar + itemsPorPaginaGenerar);

  // Filtrar certificados según el tab
  const certificadosParaSubir = certificadosListos.filter(
    r => r.estado.nombre === 'CERTIFICADO_GENERADO'
  );

  const certificadosParaEnviar = certificadosListos.filter(
    r => r.estado.nombre === 'CERTIFICADO_FIRMADO'
  );

  // Paginación para tabla de firma
  const totalPaginasFirmar = Math.ceil(certificadosParaSubir.length / itemsPorPaginaFirmar);
  const inicioFirmar = (paginaFirmar - 1) * itemsPorPaginaFirmar;
  const certificadosParaSubirPaginados = certificadosParaSubir.slice(inicioFirmar, inicioFirmar + itemsPorPaginaFirmar);

  // Paginación para tabla de enviar
  const totalPaginasEnviar = Math.ceil(certificadosParaEnviar.length / itemsPorPaginaEnviar);
  const inicioEnviar = (paginaEnviar - 1) * itemsPorPaginaEnviar;
  const certificadosParaEnviarPaginados = certificadosParaEnviar.slice(inicioEnviar, inicioEnviar + itemsPorPaginaEnviar);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/registro')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Volver al Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Certificados</h1>
        <p className="text-gray-600">Generar, subir y enviar certificados</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTabActual('generar')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            tabActual === 'generar'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiFileText />
            Generar Certificados
          </div>
        </button>
        {/* Tab Firmar - Solo para ENCARGADO_REGISTRO */}
        {puedeFirmar && (
          <button
            onClick={() => setTabActual('firmar')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              tabActual === 'firmar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUpload />
              <FiSend className="-ml-1" />
              Firmar y Enviar
            </div>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleArchivoSeleccionado}
        className="hidden"
      />

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      ) : (
        <>
          {/* Tab: Generar */}
          {tabActual === 'generar' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Registros Listos para Generar Certificados
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {registrosGenerar.length} registro(s)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Titular
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registrosGenerarPaginados.map((registro: any) => (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-blue-600">
                            {registro.esProduccion ? (
                              <span className="flex items-center gap-2">
                                <span>{registro.numeroRegistro}</span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  +{registro.cantidadObras - 1} más
                                </span>
                              </span>
                            ) : (
                              registro.numeroRegistro
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {registro.tituloObra}
                            {registro.esProduccion && (
                              <span className="ml-2 text-xs text-purple-600 font-semibold">
                                (PRODUCCIÓN)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {registro.tipoObra}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {registro.formularioProducto.formulario.clientes[0]?.cliente.nombrecompleto}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRegistroDetalle(registro.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                              title="Ver detalles completos"
                            >
                              <FiEye />
                              Detalles
                            </button>
                            <button
                              onClick={() => handleGenerarCertificado(registro.id)}
                              disabled={generando === registro.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {generando === registro.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  Generando...
                                </>
                              ) : (
                                <>
                                  <FiFileText />
                                  {registro.esProduccion ? `Generar (${registro.cantidadObras} obras)` : 'Generar'}
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {registrosGenerar.length === 0 && (
                  <div className="text-center py-12">
                    <FiCheckCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No hay registros pendientes de generar certificado</p>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPaginasGenerar > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {inicioGenerar + 1}-{Math.min(inicioGenerar + itemsPorPaginaGenerar, registrosGenerar.length)} de {registrosGenerar.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginaGenerar(p => Math.max(1, p - 1))}
                      disabled={paginaGenerar === 1}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiChevronLeft />
                    </button>
                    <span className="px-3 py-1">
                      {paginaGenerar} / {totalPaginasGenerar}
                    </span>
                    <button
                      onClick={() => setPaginaGenerar(p => Math.min(totalPaginasGenerar, p + 1))}
                      disabled={paginaGenerar === totalPaginasGenerar}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Firmar y Enviar - Solo para ENCARGADO_REGISTRO */}
          {tabActual === 'firmar' && puedeFirmar && (
            <div className="space-y-6">
              {/* Sección 1: Certificados Pendientes de Firma */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">
                    Pendientes de Firma
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {certificadosParaSubir.length}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Certificado Generado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {certificadosParaSubirPaginados.map((registro: any) => (
                        <tr key={registro.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-medium text-blue-600">
                              {registro.esProduccion ? (
                                <span className="flex items-center gap-2">
                                  <span>{registro.numeroRegistro}</span>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    +{registro.cantidadObras - 1} más
                                  </span>
                                </span>
                              ) : (
                                registro.numeroRegistro
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {registro.tituloObra}
                              {registro.esProduccion && (
                                <span className="ml-2 text-xs text-purple-600 font-semibold">
                                  (PRODUCCIÓN)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {registro.certificadoGenerado && (
                              <a
                                href={`http://localhost:3000${registro.certificadoGenerado}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                              >
                                <FiDownload />
                                Descargar
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRegistroDetalle(registro.id)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                title="Ver detalles completos"
                              >
                                <FiEye />
                                Detalles
                              </button>
                              <button
                                onClick={() => handleSeleccionarArchivo(registro.id)}
                                disabled={subiendo === registro.id}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {subiendo === registro.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Subiendo...
                                  </>
                                ) : (
                                  <>
                                    <FiUpload />
                                    {registro.esProduccion ? `Subir (${registro.cantidadObras} obras)` : 'Subir Firmado'}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {certificadosParaSubir.length === 0 && (
                    <div className="text-center py-12">
                      <FiCheckCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500">No hay certificados pendientes de firma</p>
                    </div>
                  )}
                </div>

                {/* Paginación */}
                {totalPaginasFirmar > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {inicioFirmar + 1}-{Math.min(inicioFirmar + itemsPorPaginaFirmar, certificadosParaSubir.length)} de {certificadosParaSubir.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaginaFirmar(p => Math.max(1, p - 1))}
                        disabled={paginaFirmar === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FiChevronLeft />
                      </button>
                      <span className="px-3 py-1">
                        {paginaFirmar} / {totalPaginasFirmar}
                      </span>
                      <button
                        onClick={() => setPaginaFirmar(p => Math.min(totalPaginasFirmar, p + 1))}
                        disabled={paginaFirmar === totalPaginasFirmar}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 2: Certificados Listos para Enviar a AAU */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      Listos para AAU
                    </h2>
                    {seleccionados.length > 0 && (
                      <button
                        onClick={handleEnviarAAU}
                        disabled={enviando}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {enviando ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <FiSend />
                            Enviar ({seleccionados.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Seleccionados: {seleccionados.length} de {certificadosParaEnviar.length}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={certificadosParaEnviar.length > 0 && certificadosParaEnviar.every((r: any) =>
                              r.esProduccion && r.idsProduccion
                                ? r.idsProduccion.some((id: number) => seleccionados.includes(id))
                                : seleccionados.includes(r.id)
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Agregar todos los IDs, expandiendo producciones
                                const todosLosIds = certificadosParaEnviar.flatMap((r: any) =>
                                  r.esProduccion && r.idsProduccion ? r.idsProduccion : [r.id]
                                );
                                setSeleccionados(todosLosIds);
                              } else {
                                setSeleccionados([]);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Titular
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Certificado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {certificadosParaEnviarPaginados.map((registro: any) => (
                        <tr key={registro.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={registro.esProduccion && registro.idsProduccion
                                ? registro.idsProduccion.some((id: number) => seleccionados.includes(id))
                                : seleccionados.includes(registro.id)
                              }
                              onChange={() => toggleSeleccion(registro)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-medium text-blue-600">
                              {registro.esProduccion ? (
                                <span className="flex items-center gap-2">
                                  <span>{registro.numeroRegistro}</span>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    +{registro.cantidadObras - 1} más
                                  </span>
                                </span>
                              ) : (
                                registro.numeroRegistro
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {registro.tituloObra}
                              {registro.esProduccion && (
                                <span className="ml-2 text-xs text-purple-600 font-semibold">
                                  (PRODUCCIÓN)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {registro.formularioProducto.formulario.clientes[0]?.cliente.nombrecompleto}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {registro.certificadoFirmado && (
                              <a
                                href={`http://localhost:3000${registro.certificadoFirmado}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 flex items-center gap-2"
                              >
                                <FiDownload />
                                Ver Firmado
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setRegistroDetalle(registro.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                              title="Ver detalles completos"
                            >
                              <FiEye />
                              Detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {certificadosParaEnviar.length === 0 && (
                    <div className="text-center py-12">
                      <FiCheckCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500">No hay certificados firmados listos para enviar</p>
                    </div>
                  )}
                </div>

                {/* Paginación */}
                {totalPaginasEnviar > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {inicioEnviar + 1}-{Math.min(inicioEnviar + itemsPorPaginaEnviar, certificadosParaEnviar.length)} de {certificadosParaEnviar.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaginaEnviar(p => Math.max(1, p - 1))}
                        disabled={paginaEnviar === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FiChevronLeft />
                      </button>
                      <span className="px-3 py-1">
                        {paginaEnviar} / {totalPaginasEnviar}
                      </span>
                      <button
                        onClick={() => setPaginaEnviar(p => Math.min(totalPaginasEnviar, p + 1))}
                        disabled={paginaEnviar === totalPaginasEnviar}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles */}
      {registroDetalle && (
        <DetalleFormularioModal
          registroId={registroDetalle}
          onClose={() => setRegistroDetalle(null)}
          onDevuelto={cargarDatos}
          mostrarBotonDevolver={true}
        />
      )}
    </div>
  );
};

export default CertificadosGestionPage;
