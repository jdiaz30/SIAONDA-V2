import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiEye,
  FiSearch
} from 'react-icons/fi';
import { getObrasPendientes, asentarObra, asentarProduccion, devolverAAAU, Registro, ObraPendiente, ProduccionAgrupada } from '../../services/registroService';
import { getErrorMessage } from '../../utils/errorHandler';
import ModalRevisionDetallada from '../../components/registro/ModalRevisionDetallada';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

const ObrasPendientesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Verificar permisos
  if (!hasPermission('registro.obras_pendientes.view') && !hasPermission('registro.obras_pendientes.tomar')) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/registro')}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft /> Volver
        </button>
        <NoAccess message="No tienes permiso para ver las obras pendientes de asentamiento. Esta funcionalidad es solo para Técnicos de Asentamiento y Encargado de Registro." />
      </div>
    );
  }
  const [obras, setObras] = useState<ObraPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);

  // Estado para búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 4;

  // Estado para obra expandida (ver detalles)
  const [obraExpandida, setObraExpandida] = useState<number | null>(null);

  // Estado para modal de asentamiento
  const [modalAsentar, setModalAsentar] = useState<Registro | null>(null);
  const [libroNumero, setLibroNumero] = useState('');
  const [hojaNumero, setHojaNumero] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estado para modal de devolución
  const [modalDevolver, setModalDevolver] = useState<Registro | null>(null);
  const [comentarioDevolucion, setComentarioDevolucion] = useState('');

  // Estado para modal de revisión detallada
  const [modalRevision, setModalRevision] = useState<Registro | null>(null);

  // Estado para modal de asentamiento de producción
  const [modalAsentarProduccion, setModalAsentarProduccion] = useState<ProduccionAgrupada | null>(null);
  const [obrasProduccionData, setObrasProduccionData] = useState<Array<{ registroId: number; libroNumero: string; hojaNumero: string }>>([]);

  // Estado para producciones expandidas/colapsadas
  const [produccionesExpandidas, setProduccionesExpandidas] = useState<Set<number>>(new Set());

  // Estado para obras expandidas en el modal de asentamiento
  const [obrasExpandidasModal, setObrasExpandidasModal] = useState<Set<number>>(new Set());

  // Helper para detectar si es una producción
  const esProduccion = (item: ObraPendiente): item is ProduccionAgrupada => {
    return 'esProduccion' in item && item.esProduccion === true;
  };

  // Toggle de expansión para producciones
  const toggleProduccionExpandida = (produccionId: number) => {
    setProduccionesExpandidas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(produccionId)) {
        newSet.delete(produccionId);
      } else {
        newSet.add(produccionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    try {
      setLoading(true);
      const data = await getObrasPendientes();
      // Ordenar por fecha de creacion: mas recientes primero
      const obrasOrdenadas = data.sort((a, b) => {
        // Para producciones, usar la fecha del primer registro
        const fechaA = 'obras' in a && a.esProduccion && a.obras.length > 0
          ? new Date(a.obras[0].creadoEn).getTime()
          : 'creadoEn' in a ? new Date(a.creadoEn).getTime() : 0;
        const fechaB = 'obras' in b && b.esProduccion && b.obras.length > 0
          ? new Date(b.obras[0].creadoEn).getTime()
          : 'creadoEn' in b ? new Date(b.creadoEn).getTime() : 0;
        return fechaB - fechaA; // Descendente (mas reciente primero)
      });
      setObras(obrasOrdenadas);
    } catch (error) {
      console.error('Error al cargar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsentar = async () => {
    if (!modalAsentar) return;

    const libro = parseInt(libroNumero);
    const hoja = parseInt(hojaNumero);

    if (!libro || !hoja || libro <= 0 || hoja <= 0) {
      alert('Por favor, ingrese números de libro y hoja válidos');
      return;
    }

    try {
      setProcesando(modalAsentar.id);
      await asentarObra(modalAsentar.id, libro, hoja, observaciones);
      setModalAsentar(null);
      setLibroNumero('');
      setHojaNumero('');
      setObservaciones('');
      await cargarObras();
    } catch (error: any) {
      console.error('Error al asentar obra:', error);
      alert(getErrorMessage(error));
    } finally {
      setProcesando(null);
    }
  };

  const handleDevolver = async () => {
    if (!modalDevolver) return;

    if (!comentarioDevolucion.trim()) {
      alert('Por favor, ingrese un comentario explicando el motivo de la devolución');
      return;
    }

    try {
      setProcesando(modalDevolver.id);
      await devolverAAAU(modalDevolver.id, comentarioDevolucion);
      setModalDevolver(null);
      setComentarioDevolucion('');
      await cargarObras();
    } catch (error: any) {
      console.error('Error al devolver obra:', error);
      alert(getErrorMessage(error));
    } finally {
      setProcesando(null);
    }
  };

  const handleAsentarProduccion = async () => {
    if (!modalAsentarProduccion) return;

    // Validar que todas las obras tengan libro y hoja
    const obrasInvalidas = obrasProduccionData.filter(o => !o.libroNumero || !o.hojaNumero);
    if (obrasInvalidas.length > 0) {
      alert('Por favor, complete el número de libro y hoja para todas las obras de la producción');
      return;
    }

    // Convertir a números
    const obrasParaAsentar = obrasProduccionData.map(o => ({
      registroId: o.registroId,
      libroNumero: parseInt(o.libroNumero),
      hojaNumero: parseInt(o.hojaNumero)
    }));

    // Validar números
    const numerosInvalidos = obrasParaAsentar.some(o => isNaN(o.libroNumero) || isNaN(o.hojaNumero) || o.libroNumero <= 0 || o.hojaNumero <= 0);
    if (numerosInvalidos) {
      alert('Por favor, ingrese números de libro y hoja válidos para todas las obras');
      return;
    }

    try {
      setProcesando(modalAsentarProduccion.id);
      await asentarProduccion(modalAsentarProduccion.id, obrasParaAsentar, observaciones);
      setModalAsentarProduccion(null);
      setObrasProduccionData([]);
      setObservaciones('');
      alert(`Producción "${modalAsentarProduccion.tituloProduccion}" asentada exitosamente con ${obrasParaAsentar.length} obras`);
      await cargarObras();
    } catch (error: any) {
      console.error('Error al asentar producción:', error);
      alert(getErrorMessage(error));
    } finally {
      setProcesando(null);
    }
  };

  // Filtrado y paginación
  const obrasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return obras;

    const terminoBusqueda = busqueda.toLowerCase();
    return obras.filter(item => {
      if (esProduccion(item)) {
        // Para producciones, buscar por título de producción, tipo y nombres de clientes
        const tituloMatch = item.tituloProduccion.toLowerCase().includes(terminoBusqueda);
        const tipoMatch = item.tipoProducto.toLowerCase().includes(terminoBusqueda);
        const clienteMatch = item.clientes.some(
          c => c.cliente.nombrecompleto.toLowerCase().includes(terminoBusqueda) ||
               c.cliente.identificacion.includes(terminoBusqueda)
        );
        // También buscar en los títulos de las obras hijas
        const obraMatch = item.obras.some(obra => obra.tituloObra.toLowerCase().includes(terminoBusqueda));

        return tituloMatch || tipoMatch || clienteMatch || obraMatch;
      } else {
        // Para obras individuales, búsqueda normal
        const tituloMatch = item.tituloObra.toLowerCase().includes(terminoBusqueda);
        const tipoMatch = item.tipoObra.toLowerCase().includes(terminoBusqueda);
        const numeroMatch = item.numeroRegistro.toLowerCase().includes(terminoBusqueda);
        const clienteMatch = item.formularioProducto.formulario.clientes.some(
          c => c.cliente.nombrecompleto.toLowerCase().includes(terminoBusqueda) ||
               c.cliente.identificacion.includes(terminoBusqueda)
        );

        return tituloMatch || tipoMatch || numeroMatch || clienteMatch;
      }
    });
  }, [obras, busqueda]);

  const totalPaginas = Math.ceil(obrasFiltradas.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const obrasPaginadas = obrasFiltradas.slice(indiceInicio, indiceFin);

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const obtenerCampoValor = (obra: Registro, nombreCampo: string): string => {
    const campo = obra.formularioProducto.campos?.find(c =>
      c.campo.nombre.toLowerCase().includes(nombreCampo.toLowerCase())
    );
    return campo?.valor || 'N/A';
  };

  const toggleExpanded = (obraId: number) => {
    setObraExpandida(obraExpandida === obraId ? null : obraId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando obras pendientes...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Obras Pendientes de Asentamiento</h1>
            <p className="text-gray-600">
              {obrasFiltradas.length} de {obras.length} obra(s)
              {busqueda && ` (filtradas)`}
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, tipo de obra, número de registro, nombre o cédula del cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {obrasPaginadas.map((item) => {
          // Si es una producción, renderizar card especial
          if (esProduccion(item)) {
            const cliente = item.clientes[0]?.cliente;
            const estaExpandida = produccionesExpandidas.has(item.id);

            return (
              <div
                key={`prod-${item.id}`}
                className="bg-white rounded-lg shadow-sm border-2 border-purple-200 hover:shadow-md transition-shadow"
              >
                {/* Encabezado de Producción - SIEMPRE VISIBLE */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FiBook className="text-purple-600 text-xl" />
                        <h3 className="text-xl font-bold text-gray-900">
                          PRODUCCIÓN: {item.tituloProduccion}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                          {item.tipoProducto} - {item.obras.length} obras
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Botón para expandir/contraer */}
                      <button
                        onClick={() => toggleProduccionExpandida(item.id)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                        title={estaExpandida ? "Ocultar obras" : "Ver obras"}
                      >
                        {estaExpandida ? <FiChevronUp /> : <FiChevronDown />}
                        {estaExpandida ? 'Ocultar' : 'Ver obras'}
                      </button>
                      <button
                        onClick={() => {
                          // Inicializar datos de obras
                          const initialData = item.obras.map(obra => ({
                            registroId: obra.id,
                            libroNumero: '',
                            hojaNumero: ''
                          }));
                          setObrasProduccionData(initialData);
                          setModalAsentarProduccion(item);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <FiCheckCircle />
                        Asentar Producción
                      </button>
                    </div>
                  </div>

                  {/* Info básica - SIEMPRE VISIBLE */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Cliente</p>
                      <p className="font-medium text-gray-900">
                        {cliente?.nombrecompleto || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Cédula</p>
                      <p className="font-medium text-gray-900">{cliente?.identificacion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Total Obras</p>
                      <p className="font-medium text-gray-900">{item.obras.length} obras</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Tipo</p>
                      <p className="font-medium text-gray-900">{item.tipoProducto}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de obras de la producción - SOLO SI ESTÁ EXPANDIDA */}
                {estaExpandida && (
                  <div className="p-6 bg-gray-50 border-t border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Obras que componen la producción:</h4>
                    <div className="space-y-2">
                      {item.obras.map((obra, index) => (
                        <div key={obra.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{obra.tituloObra}</p>
                              <p className="text-xs text-gray-500 font-mono">{obra.numeroRegistro}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Si es una obra individual normal, renderizar como antes
          const obra = item as Registro;
          const isExpanded = obraExpandida === obra.id;
          const cliente = obra.formularioProducto.formulario.clientes[0]?.cliente;

          return (
            <div
              key={obra.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Encabezado de la obra */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FiBook className="text-blue-600 text-xl" />
                      <h3 className="text-xl font-bold text-gray-900">{obra.tituloObra}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {obra.tipoObra}
                      </span>
                      <span className="font-mono text-sm text-gray-500">
                        {obra.numeroRegistro}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalRevision(obra)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      title="Ver todos los campos y devolver si es necesario"
                    >
                      <FiEye />
                      Revisar Detalle
                    </button>
                    <button
                      onClick={() => setModalDevolver(obra)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                    >
                      <FiAlertCircle />
                      Devolver a AAU
                    </button>
                    <button
                      onClick={() => setModalAsentar(obra)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FiCheckCircle />
                      Asentar
                    </button>
                  </div>
                </div>

                {/* Info básica */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 mb-1">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {cliente?.nombrecompleto || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Cédula</p>
                    <p className="font-medium text-gray-900">{cliente?.identificacion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Formulario</p>
                    <p className="font-medium text-gray-900">
                      {obra.formularioProducto.formulario.codigo}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Fecha Creación</p>
                    <p className="font-medium text-gray-900">
                      {new Date(obra.creadoEn).toLocaleDateString('es-DO')}
                    </p>
                  </div>
                </div>

                {/* Botón para expandir detalles */}
                <button
                  onClick={() => toggleExpanded(obra.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700 border-t border-gray-200 pt-4"
                >
                  {isExpanded ? (
                    <>
                      <FiChevronUp />
                      <span>Ocultar detalles</span>
                    </>
                  ) : (
                    <>
                      <FiChevronDown />
                      <span>Ver todos los detalles del formulario</span>
                    </>
                  )}
                </button>
              </div>

              {/* Detalles expandidos */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h4 className="font-bold text-gray-900 mb-4">Detalles completos del formulario</h4>

                  {obra.formularioProducto.campos && obra.formularioProducto.campos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {obra.formularioProducto.campos.map((campo, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-1">{campo.campo.titulo}</p>
                          <p className="font-medium text-gray-900">{campo.valor || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay campos adicionales</p>
                  )}

                  {/* Archivos adjuntos */}
                  <div className="mt-6">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FiFileText />
                      Archivos adjuntos
                    </h4>

                    {/* Archivos del cliente (cédula) */}
                    {cliente?.archivos && cliente.archivos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Documentos del Cliente</h5>
                        <div className="space-y-2">
                          {cliente.archivos.map((archivo) => (
                            <a
                              key={archivo.id}
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                              <FiFileText className="text-blue-600 text-lg flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {archivo.nombre}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(archivo.tamano / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <span className="text-xs text-blue-600 font-medium">Ver</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Archivos específicos del producto/obra */}
                    {obra.formularioProducto.archivos && obra.formularioProducto.archivos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Soporte Material de la Obra</h5>
                        <div className="space-y-2">
                          {obra.formularioProducto.archivos.map((archivo) => (
                            <a
                              key={archivo.id}
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                              <FiFileText className="text-blue-600 text-lg flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {archivo.nombreOriginal}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(archivo.tamano / 1024).toFixed(2)} KB • {archivo.mimeType}
                                </p>
                              </div>
                              <span className="text-xs text-blue-600 font-medium">Ver</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No hay archivos */}
                    {(!cliente?.archivos || cliente.archivos.length === 0) &&
                     (!obra.formularioProducto.archivos || obra.formularioProducto.archivos.length === 0) && (
                      <p className="text-sm text-gray-500 italic">
                        No hay archivos adjuntos para esta obra
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {obrasPaginadas.length === 0 && busqueda && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <FiSearch className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
            disabled={paginaActual === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
              <button
                key={numero}
                onClick={() => setPaginaActual(numero)}
                className={`px-4 py-2 rounded-lg ${
                  paginaActual === numero
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {numero}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaActual === totalPaginas}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}

      {obras.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <FiClock className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay obras pendientes</h3>
          <p className="text-gray-600 mb-6">Todas las obras han sido asentadas</p>
        </div>
      )}

      {/* Modal de Asentamiento */}
      {modalAsentar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Asentar Obra en Registro</h3>
              <button
                onClick={() => {
                  setModalAsentar(null);
                  setLibroNumero('');
                  setHojaNumero('');
                  setObservaciones('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Obra</p>
              <p className="font-bold text-gray-900 mb-3">{modalAsentar.tituloObra}</p>

              <p className="text-sm text-gray-600 mb-1">Número de Registro</p>
              <p className="font-mono font-bold text-gray-900 mb-3">{modalAsentar.numeroRegistro}</p>

              <p className="text-sm text-gray-600 mb-1">Tipo</p>
              <p className="font-medium text-gray-900">{modalAsentar.tipoObra}</p>
            </div>

            {/* Campos de libro y hoja */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Libro <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={libroNumero}
                  onChange={(e) => setLibroNumero(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Hoja <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={hojaNumero}
                  onChange={(e) => setHojaNumero(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 123"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar observaciones sobre el asentamiento..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalAsentar(null);
                  setLibroNumero('');
                  setHojaNumero('');
                  setObservaciones('');
                }}
                disabled={procesando !== null}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsentar}
                disabled={procesando !== null}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Asentando...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Confirmar Asentamiento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asentamiento de Producción */}
      {modalAsentarProduccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Asentar Producción</h3>
                <p className="text-purple-600 font-medium">{modalAsentarProduccion.tituloProduccion}</p>
              </div>
              <button
                onClick={() => {
                  setModalAsentarProduccion(null);
                  setObrasProduccionData([]);
                  setObservaciones('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Nota:</strong> Debes ingresar el número de libro y hoja para cada una de las {modalAsentarProduccion.obras.length} obras que componen esta producción.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                💡 <strong>Tip:</strong> Varias obras pueden compartir el mismo número de libro y hoja si están asentadas juntas en la misma página.
              </p>
              <p className="text-sm text-gray-700">
                Al final se generará <strong>UN SOLO certificado</strong> que incluirá todas las obras con sus respectivos números de registro, libro y hoja.
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-[600px] overflow-y-auto">
              {modalAsentarProduccion.obras.map((obra, index) => {
                const obraData = obrasProduccionData.find(o => o.registroId === obra.id);
                const estaExpandida = obrasExpandidasModal.has(obra.id);

                // Extraer campos relevantes para identificación
                const campoTitulo = obra.formularioProducto?.campos?.find(c =>
                  c.campo.campo.toLowerCase().includes('titulo') ||
                  c.campo.titulo.toLowerCase().includes('titulo')
                );
                const tituloReal = campoTitulo?.valor || obra.tituloObra;

                // Clientes/autores
                const clientes = obra.formularioProducto.formulario.clientes || [];
                const archivosCliente = clientes.flatMap(c => c.cliente.archivos || []);
                const archivosObra = obra.formularioProducto.archivos || [];

                return (
                  <div key={obra.id} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    {/* Header compacto siempre visible */}
                    <div className="bg-gray-50 p-4">
                      <div className="flex items-start gap-4">
                        <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-base">{tituloReal}</p>
                              <p className="text-xs text-gray-500 font-mono">{obra.numeroRegistro}</p>
                            </div>
                            <button
                              onClick={() => {
                                setObrasExpandidasModal(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(obra.id)) {
                                    newSet.delete(obra.id);
                                  } else {
                                    newSet.add(obra.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1 text-xs"
                            >
                              {estaExpandida ? <FiChevronUp /> : <FiChevronDown />}
                              {estaExpandida ? 'Ocultar' : 'Ver detalles'}
                            </button>
                          </div>

                          {/* Campos de libro y hoja */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Libro *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={obraData?.libroNumero || ''}
                                onChange={(e) => {
                                  setObrasProduccionData(prev =>
                                    prev.map(o =>
                                      o.registroId === obra.id
                                        ? { ...o, libroNumero: e.target.value }
                                        : o
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: 1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hoja *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={obraData?.hojaNumero || ''}
                                onChange={(e) => {
                                  setObrasProduccionData(prev =>
                                    prev.map(o =>
                                      o.registroId === obra.id
                                        ? { ...o, hojaNumero: e.target.value }
                                        : o
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: 1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandibles */}
                    {estaExpandida && (
                      <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                        {/* Autores/Titulares */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FiEye className="text-purple-600" />
                            Autores/Titulares ({clientes.length})
                          </h4>
                          <div className="space-y-2">
                            {clientes.map((rel, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-500 text-xs">Nombre:</span>{' '}
                                    <span className="font-medium">{rel.cliente.nombrecompleto}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-xs">Rol:</span>{' '}
                                    <span className="font-medium">{rel.tipoRelacion}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-xs">Cédula:</span>{' '}
                                    <span className="font-medium">{rel.cliente.identificacion}</span>
                                  </div>
                                  {rel.cliente.telefono && (
                                    <div>
                                      <span className="text-gray-500 text-xs">Teléfono:</span>{' '}
                                      <span className="font-medium">{rel.cliente.telefono}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Campos del formulario */}
                        {obra.formularioProducto.campos && obra.formularioProducto.campos.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FiFileText className="text-purple-600" />
                              Campos del Formulario
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {obra.formularioProducto.campos.map((campo, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                                  <span className="text-gray-500">{campo.campo.titulo}:</span>{' '}
                                  <span className="font-medium text-gray-900">{campo.valor || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Archivos */}
                        {(archivosCliente.length > 0 || archivosObra.length > 0) && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FiFileText className="text-purple-600" />
                              Archivos Adjuntos
                            </h4>

                            {/* Documentos del cliente */}
                            {archivosCliente.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 font-medium mb-2">Documentos del Cliente</p>
                                <div className="space-y-1">
                                  {archivosCliente.map((archivo, idx) => (
                                    <a
                                      key={idx}
                                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded hover:border-purple-300 hover:bg-purple-50 transition-colors text-xs"
                                    >
                                      <FiFileText className="text-purple-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                          {archivo.nombre || 'Documento'}
                                        </p>
                                        <p className="text-gray-500">{(archivo.tamano / 1024).toFixed(2)} KB</p>
                                      </div>
                                      <span className="text-purple-600 font-medium">Ver</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Soporte material de la obra */}
                            {archivosObra.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-600 font-medium mb-2">Soporte Material de la Obra</p>
                                <div className="space-y-1">
                                  {archivosObra.map((archivo, idx) => (
                                    <a
                                      key={idx}
                                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded hover:border-purple-300 hover:bg-purple-50 transition-colors text-xs"
                                    >
                                      <FiFileText className="text-purple-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                          {archivo.nombreOriginal}
                                        </p>
                                        <p className="text-gray-500">{(archivo.tamano / 1024).toFixed(2)} KB • {archivo.mimeType}</p>
                                      </div>
                                      <span className="text-purple-600 font-medium">Ver</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ingrese cualquier observación relevante sobre el asentamiento de esta producción..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalAsentarProduccion(null);
                  setObrasProduccionData([]);
                  setObservaciones('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsentarProduccion}
                disabled={procesando === modalAsentarProduccion.id}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando === modalAsentarProduccion.id ? (
                  <>
                    <FiClock className="animate-spin" />
                    Asentando Producción...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Asentar Producción Completa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Devolución */}
      {modalDevolver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Devolver a AAU para Corrección</h3>
              <button
                onClick={() => {
                  setModalDevolver(null);
                  setComentarioDevolucion('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Atención:</strong> Esta obra será devuelta a AAU para corrección.
              </p>
              <p className="text-sm text-yellow-700">
                El cliente NO tendrá que pagar nuevamente cuando se corrija.
              </p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Obra</p>
              <p className="font-bold text-gray-900 mb-3">{modalDevolver.tituloObra}</p>

              <p className="text-sm text-gray-600 mb-1">Número de Registro</p>
              <p className="font-mono font-bold text-gray-900">{modalDevolver.numeroRegistro}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la devolución <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comentarioDevolucion}
                onChange={(e) => setComentarioDevolucion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Explique detalladamente qué debe corregirse..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalDevolver(null);
                  setComentarioDevolucion('');
                }}
                disabled={procesando !== null}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolver}
                disabled={procesando !== null}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Devolviendo...
                  </>
                ) : (
                  <>
                    <FiAlertCircle />
                    Confirmar Devolución
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisión Detallada */}
      {modalRevision && (
        <ModalRevisionDetallada
          isOpen={true}
          onClose={() => setModalRevision(null)}
          registro={modalRevision}
          onDevolver={async (comentario) => {
            await devolverAAAU(modalRevision.id, comentario);
            setModalRevision(null);
            await cargarObras();
          }}
          puedeDevolver={true}
        />
      )}
    </div>
  );
};

export default ObrasPendientesPage;
