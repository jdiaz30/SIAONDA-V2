import { useState, useEffect } from 'react';
import { FiCheckCircle, FiFileText, FiPackage, FiSearch, FiRefreshCw } from 'react-icons/fi';
import aauService from '../../services/aauService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface CertificadoEntrega {
  id: number;
  tipo: 'OBRA' | 'IRC';
  codigo: string;
  fecha: string;
  estado: string;
  clienteNombre: string;
  clienteTelefono: string;
  categoria: string;
  certificadoCodigo: string | null;
  certificadoFecha: string | null;
  certificadoPdfUrl?: string | null;
  formularioId: number | null;
  solicitudIrcId: number | null;
}

interface DatosEntrega {
  nombreReceptor: string;
  cedulaReceptor: string;
  esRepresentante: boolean;
  documentoLegal: File | null;
}

export default function CertificadosListosEntregaPage() {
  const { hasPermission } = usePermissions();

  // Verificar permiso para ver certificados - RECEPCIONISTA SÍ puede
  if (!hasPermission('atu.certificados.view')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para ver los certificados listos para entrega. Esta funcionalidad es para personal de ATU autorizado." />
      </div>
    );
  }

  const [certificados, setCertificados] = useState<CertificadoEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'OBRA' | 'IRC'>('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const certificadosPorPagina = 5;

  // Estado del modal
  const [showModal, setShowModal] = useState(false);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<CertificadoEntrega | null>(null);
  const [datosEntrega, setDatosEntrega] = useState<DatosEntrega>({
    nombreReceptor: '',
    cedulaReceptor: '',
    esRepresentante: false,
    documentoLegal: null
  });

  useEffect(() => {
    cargarCertificados();
  }, []);

  const cargarCertificados = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await aauService.getCertificadosPendientes();
      setCertificados(response.data || []);
    } catch (err: any) {
      console.error('Error cargando certificados:', err);
      setError(err.response?.data?.message || 'Error al cargar certificados');
      setCertificados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (certificado: CertificadoEntrega) => {
    setCertificadoSeleccionado(certificado);
    setShowModal(true);
    // Resetear datos
    setDatosEntrega({
      nombreReceptor: '',
      cedulaReceptor: '',
      esRepresentante: false,
      documentoLegal: null
    });
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setCertificadoSeleccionado(null);
  };

  const handleEntregar = async () => {
    if (!certificadoSeleccionado) return;

    // Validaciones
    if (!datosEntrega.nombreReceptor.trim()) {
      alert('Debe ingresar el nombre de quien recibe el certificado');
      return;
    }

    if (!datosEntrega.cedulaReceptor.trim()) {
      alert('Debe ingresar la cédula de quien recibe el certificado');
      return;
    }

    if (datosEntrega.esRepresentante && !datosEntrega.documentoLegal) {
      alert('Debe adjuntar el documento legal del representante');
      return;
    }

    try {
      setProcesando(certificadoSeleccionado.id);
      setError(null);

      // Crear FormData para enviar archivo si existe
      const formData = new FormData();
      formData.append('nombreReceptor', datosEntrega.nombreReceptor);
      formData.append('cedulaReceptor', datosEntrega.cedulaReceptor);
      formData.append('esRepresentante', datosEntrega.esRepresentante.toString());
      formData.append('tipo', certificadoSeleccionado.tipo);

      if (datosEntrega.documentoLegal) {
        formData.append('documentoLegal', datosEntrega.documentoLegal);
      }

      await aauService.entregarCertificado(
        certificadoSeleccionado.id,
        certificadoSeleccionado.tipo,
        formData
      );

      alert(`Certificado ${certificadoSeleccionado.codigo} entregado exitosamente a ${datosEntrega.nombreReceptor}`);

      // Cerrar modal y recargar
      handleCerrarModal();
      await cargarCertificados();
    } catch (err: any) {
      console.error('Error al entregar certificado:', err);
      setError(err.response?.data?.message || 'Error al entregar certificado');
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcesando(null);
    }
  };

  const certificadosFiltrados = certificados.filter(c => {
    // Filtro de tipo
    if (filtroTipo !== 'TODOS' && c.tipo !== filtroTipo) {
      return false;
    }

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return (
        c.codigo.toLowerCase().includes(busquedaLower) ||
        c.clienteNombre.toLowerCase().includes(busquedaLower) ||
        c.categoria.toLowerCase().includes(busquedaLower) ||
        (c.certificadoCodigo && c.certificadoCodigo.toLowerCase().includes(busquedaLower))
      );
    }

    return true;
  });

  // Paginación
  const totalPaginas = Math.ceil(certificadosFiltrados.length / certificadosPorPagina);
  const indexUltimo = paginaActual * certificadosPorPagina;
  const indexPrimero = indexUltimo - certificadosPorPagina;
  const certificadosPaginados = certificadosFiltrados.slice(indexPrimero, indexUltimo);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo]);

  // Estadísticas
  const totalObras = certificados.filter(c => c.tipo === 'OBRA').length;
  const totalIRC = certificados.filter(c => c.tipo === 'IRC').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando certificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Certificados para Entrega</h1>
            <p className="text-blue-100">
              Certificados de obras y empresas IRC listos para entregar a los clientes
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{certificadosFiltrados.length}</div>
            <div className="text-sm text-blue-100">certificados listos</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <FiCheckCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Certificados</p>
              <p className="text-3xl font-bold text-gray-900">{certificados.length}</p>
            </div>
            <FiCheckCircle className="text-4xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certificados de Obras</p>
              <p className="text-3xl font-bold text-gray-900">{totalObras}</p>
            </div>
            <FiFileText className="text-4xl text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certificados IRC</p>
              <p className="text-3xl font-bold text-gray-900">{totalIRC}</p>
            </div>
            <FiPackage className="text-4xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, cliente o categoría..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro de tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filtroTipo === 'TODOS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('OBRA')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filtroTipo === 'OBRA'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Obras
            </button>
            <button
              onClick={() => setFiltroTipo('IRC')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filtroTipo === 'IRC'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              IRC
            </button>
          </div>

          {/* Botón recargar */}
          <button
            onClick={cargarCertificados}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {certificadosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No hay certificados pendientes de entrega</p>
            <p className="text-sm text-gray-500 mt-1">
              {busqueda || filtroTipo !== 'TODOS'
                ? 'No se encontraron resultados con los filtros aplicados'
                : 'Los certificados aparecerán aquí cuando estén listos para entrega'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Solicitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificadosPaginados.map((certificado) => (
                <tr key={`${certificado.tipo}-${certificado.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        certificado.tipo === 'OBRA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {certificado.tipo === 'OBRA' ? (
                        <span className="flex items-center gap-1">
                          <FiFileText className="w-3 h-3" />
                          Obra
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FiPackage className="w-3 h-3" />
                          IRC
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{certificado.codigo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {certificado.clienteNombre}
                    </div>
                    <div className="text-xs text-gray-500">{certificado.clienteTelefono}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{certificado.categoria}</div>
                  </td>
                  <td className="px-6 py-4">
                    {certificado.certificadoCodigo ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {certificado.certificadoCodigo}
                        </div>
                        {certificado.certificadoFecha && (
                          <div className="text-xs text-gray-500">
                            {new Date(certificado.certificadoFecha).toLocaleDateString('es-DO')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Generado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(certificado.fecha).toLocaleDateString('es-DO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {/* Botón Descargar PDF */}
                      {certificado.certificadoPdfUrl && (
                        <a
                          href={`http://localhost:3000${certificado.certificadoPdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                          title="Descargar certificado firmado para imprimir"
                        >
                          <FiFileText className="w-4 h-4" />
                          Descargar
                        </a>
                      )}

                      {/* Botón Entregar */}
                      <button
                        onClick={() => handleAbrirModal(certificado)}
                        disabled={procesando === certificado.id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        Entregar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {indexPrimero + 1} a {Math.min(indexUltimo, certificadosFiltrados.length)} de{' '}
              <strong>{certificadosFiltrados.length}</strong> certificado
              {certificadosFiltrados.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    className={`px-3 py-2 rounded ${
                      num === paginaActual
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      {certificadosFiltrados.length > 0 && totalPaginas <= 1 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            <strong>{certificadosFiltrados.length}</strong> certificado
            {certificadosFiltrados.length !== 1 ? 's' : ''} listo
            {certificadosFiltrados.length !== 1 ? 's' : ''} para entrega
            {(busqueda || filtroTipo !== 'TODOS') &&
              certificadosFiltrados.length !== certificados.length && (
                <span className="ml-2 text-gray-500">
                  (filtrado de {certificados.length} total{certificados.length !== 1 ? 'es' : ''})
                </span>
              )}
          </div>
        </div>
      )}

      {/* Modal de Entrega */}
      {showModal && certificadoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Registro de Entrega de Certificado</h2>
              <p className="text-sm mt-1">Certificado: {certificadoSeleccionado.codigo} ({certificadoSeleccionado.tipo === 'OBRA' ? 'Obra' : 'IRC'})</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Información del Certificado</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente/Empresa:</span>
                    <p className="font-medium">{certificadoSeleccionado.clienteNombre}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <p className="font-medium">{certificadoSeleccionado.clienteTelefono}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <p className="font-medium">{certificadoSeleccionado.categoria}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">No. Certificado:</span>
                    <p className="font-medium">{certificadoSeleccionado.certificadoCodigo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Datos de quien recibe el certificado</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={datosEntrega.nombreReceptor}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, nombreReceptor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula de identidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={datosEntrega.cedulaReceptor}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, cedulaReceptor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 001-1234567-8"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="esRepresentante"
                    checked={datosEntrega.esRepresentante}
                    onChange={(e) => setDatosEntrega({
                      ...datosEntrega,
                      esRepresentante: e.target.checked,
                      documentoLegal: e.target.checked ? datosEntrega.documentoLegal : null
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="esRepresentante" className="text-sm font-medium text-gray-700">
                    La persona que recibe es un representante (no es el titular)
                  </label>
                </div>

                {datosEntrega.esRepresentante && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento legal o poder <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Adjunte el documento legal o poder que autoriza al representante a retirar el certificado
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setDatosEntrega({ ...datosEntrega, documentoLegal: file });
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {datosEntrega.documentoLegal && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ Archivo seleccionado: {datosEntrega.documentoLegal.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={handleCerrarModal}
                disabled={procesando !== null}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEntregar}
                disabled={procesando !== null}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {procesando !== null ? 'Procesando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
