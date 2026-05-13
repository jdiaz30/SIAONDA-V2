import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiAlertCircle, FiFileText, FiUpload, FiUser, FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';
import clientesService from '../../services/clientesService';

interface Campo {
  id: number;
  campo: {
    id: number;
    nombre: string;
    tipo: {
      nombre: string;
    };
    requerido: boolean;
    placeholder?: string;
  };
  valor: string;
}

interface Archivo {
  id: number;
  nombreOriginal: string;
  nombreSistema: string;
  ruta: string;
  tamano: number;
  mimeType: string;
}

interface Cliente {
  id: number;
  codigo: string;
  identificacion: string;
  nombre: string;
  apellido: string | null;
  nombrecompleto: string;
  telefono?: string | null;
  correo?: string | null;
}

interface ClienteFormulario {
  id: number;
  clienteId: number;
  tipoRelacion: string;
  cliente: Cliente;
}

interface Formulario {
  id: number;
  codigo: string;
  mensajeDevolucion?: string;
  fechaDevolucion?: string;
  clientes: ClienteFormulario[];
  productos: Array<{
    id: number;
    producto: {
      nombre: string;
    };
    campos: Campo[];
    archivos?: Archivo[];
  }>;
}

const ROLES = [
  { value: 'AUTOR_PRINCIPAL', label: 'Autor Principal', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'AUTOR', label: 'Autor', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'COAUTOR', label: 'Coautor', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'AUTOR_ORIGINAL', label: 'Autor Original', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'COMPOSITOR', label: 'Compositor', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'EDITOR', label: 'Editor', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { value: 'IMPRESOR', label: 'Impresor', color: 'bg-stone-100 text-stone-800 border-stone-300' },
  { value: 'DIVULGADOR', label: 'Divulgador', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'PRODUCTOR', label: 'Productor', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'DIRECTOR', label: 'Director', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { value: 'GUIONISTA', label: 'Guionista', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { value: 'ARREGLISTA', label: 'Arreglista', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'INTERPRETE', label: 'Intérprete', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'TITULAR', label: 'Titular', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'REPRESENTANTE', label: 'Representante', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' },
  { value: 'VISITANTE', label: 'Visitante', color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

const FormularioObraEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [camposEditados, setCamposEditados] = useState<{ [key: number]: string }>({});
  const [nuevosArchivos, setNuevosArchivos] = useState<{ [productoId: number]: File[] }>({});

  // Estados para gestión de clientes/autores
  const [clientes, setClientes] = useState<ClienteFormulario[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Cliente[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    cargarFormulario();
  }, [id]);

  const cargarFormulario = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formularios/${id}`);
      setFormulario(response.data);

      // Inicializar campos editados con valores actuales
      const valores: { [key: number]: string } = {};
      response.data.productos.forEach((producto: any) => {
        producto.campos.forEach((campo: Campo) => {
          valores[campo.id] = campo.valor || '';
        });
      });
      setCamposEditados(valores);

      // Inicializar clientes
      setClientes(response.data.clientes || []);
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      alert('Error al cargar formulario');
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda de clientes
  const buscarClientes = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResultadosBusqueda([]);
      return;
    }

    setSearching(true);
    try {
      const resultados = await clientesService.buscarClientes(searchQuery);
      setResultadosBusqueda(resultados);
      setShowResults(true);
    } catch (error) {
      console.error('Error buscando clientes:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        buscarClientes(query);
      } else {
        setResultadosBusqueda([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Agregar cliente/autor
  const agregarCliente = (cliente: Cliente) => {
    if (clientes.some(c => c.clienteId === cliente.id)) {
      alert('Este autor ya ha sido agregado');
      return;
    }

    const nuevoCliente: ClienteFormulario = {
      id: Date.now(),
      clienteId: cliente.id,
      tipoRelacion: clientes.length === 0 ? 'AUTOR_PRINCIPAL' : 'COAUTOR',
      cliente
    };

    setClientes([...clientes, nuevoCliente]);
    setQuery('');
    setResultadosBusqueda([]);
    setShowResults(false);
  };

  // Cambiar rol de un autor
  const cambiarRol = (clienteId: number, nuevoRol: string) => {
    setClientes(clientes.map(c =>
      c.id === clienteId ? { ...c, tipoRelacion: nuevoRol } : c
    ));
  };

  // Eliminar autor
  const eliminarCliente = (clienteId: number) => {
    const clienteEliminado = clientes.find(c => c.id === clienteId);
    const clientesRestantes = clientes.filter(c => c.id !== clienteId);

    // Si se elimina el autor principal y quedan autores, marcar el primero como principal
    if (clienteEliminado?.tipoRelacion === 'AUTOR_PRINCIPAL' && clientesRestantes.length > 0) {
      clientesRestantes[0].tipoRelacion = 'AUTOR_PRINCIPAL';
    }

    setClientes(clientesRestantes);
  };

  const handleCampoChange = (campoId: number, valor: string) => {
    setCamposEditados(prev => ({
      ...prev,
      [campoId]: valor
    }));
  };

  const handleGuardar = async () => {
    try {
      // Validar que haya al menos un autor
      if (clientes.length === 0) {
        alert('Debe tener al menos un autor');
        return;
      }

      // Validar que haya un autor principal
      const tieneAutorPrincipal = clientes.some(c => c.tipoRelacion === 'AUTOR_PRINCIPAL');
      if (!tieneAutorPrincipal) {
        alert('Debe designar un Autor Principal');
        return;
      }

      setSaving(true);

      // Convertir el objeto de campos editados a array para el backend
      const camposActualizados = Object.entries(camposEditados).map(([campoId, valor]) => ({
        id: parseInt(campoId),
        valor
      }));

      // Preparar clientes para enviar al backend
      const clientesActualizados = clientes.map(c => ({
        clienteId: c.clienteId,
        tipoRelacion: c.tipoRelacion
      }));

      // Crear FormData si hay archivos nuevos
      console.log('📁 Estado nuevosArchivos:', nuevosArchivos);
      const hayArchivos = Object.values(nuevosArchivos).some(files => files.length > 0);
      console.log('📊 ¿Hay archivos?', hayArchivos);

      if (hayArchivos) {
        console.log('✅ Enviando con FormData');
        const formData = new FormData();
        formData.append('campos', JSON.stringify(camposActualizados));
        formData.append('clientes', JSON.stringify(clientesActualizados));

        // Agregar archivos por producto y calcular tamaño total
        let totalSize = 0;
        Object.entries(nuevosArchivos).forEach(([productoId, files]) => {
          files.forEach(file => {
            console.log(`📤 Agregando archivo ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) para producto ${productoId}`);
            formData.append(`archivos_${productoId}`, file);
            totalSize += file.size;
          });
        });
        console.log(`📊 Tamaño total de archivos: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

        await api.put(`/formularios/${id}/corregir`, formData);
      } else {
        console.log('⚠️ Enviando sin archivos (JSON)');
        await api.put(`/formularios/${id}/corregir`, {
          campos: camposActualizados,
          clientes: clientesActualizados
        });
      }

      console.log('✅ Guardado exitoso');
      alert('✅ Formulario corregido exitosamente. Será reenviado a Registro.');
      navigate('/aau/formularios/devueltos');
    } catch (error: any) {
      console.error('Error al guardar:', error);

      // Mensaje de error personalizado según el tipo
      let errorMsg = getErrorMessage(error);

      if (error.response?.status === 413) {
        errorMsg = '❌ Los archivos son demasiado grandes.\n\n' +
                   'Tamaño máximo permitido: 1GB total\n' +
                   `Tamaño enviado: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n\n` +
                   'Por favor, reduce el tamaño de los archivos o súbelos en grupos más pequeños.';
      } else if (error.response?.data?.message) {
        errorMsg = `❌ ${error.response.data.message}`;
      }

      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const renderCampo = (campo: Campo, productoIdx: number) => {
    const tipoInput = campo.campo.tipo.nombre;
    const valor = camposEditados[campo.id] || '';

    const baseClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (tipoInput) {
      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={`${baseClasses} min-h-[100px]`}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );

      case 'select':
        // Aquí necesitarías las opciones del select
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={baseClasses}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={baseClasses}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Formulario no encontrado</p>
          <Link
            to="/aau/formularios/devueltos"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/aau/formularios/devueltos"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Volver a Formularios Devueltos</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Corregir Formulario de Obra
          </h1>
          <p className="text-gray-600">
            Formulario {formulario.codigo} - {formulario.clientes[0]?.cliente.nombrecompleto}
          </p>
        </div>
      </div>

      {/* Mensaje de Devolución */}
      {formulario.mensajeDevolucion && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-600 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Motivo de Devolución desde Registro
              </h3>
              <p className="text-red-800 whitespace-pre-wrap">
                {formulario.mensajeDevolucion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gestión de Autores/Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiUser />
          Autores de la Obra
        </h2>

        {/* Búsqueda de clientes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar y agregar autores
          </label>
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiSearch className="absolute left-3 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula o RNC... (mínimo 3 caracteres)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Resultados de búsqueda */}
            {showResults && resultadosBusqueda.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {resultadosBusqueda.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => agregarCliente(cliente)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{cliente.nombrecompleto}</div>
                    <div className="text-sm text-gray-600">{cliente.identificacion}</div>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de autores seleccionados */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Autores seleccionados:</h3>
          {clientes.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <FiAlertCircle />
                No hay autores seleccionados. Debe agregar al menos un autor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente) => {
                const rolInfo = ROLES.find(r => r.value === cliente.tipoRelacion);
                return (
                  <div key={cliente.id} className={`flex items-center justify-between p-4 border-2 rounded-lg ${rolInfo?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <div className="flex-1">
                      <div className="font-medium">{cliente.cliente.nombrecompleto}</div>
                      <div className="text-sm opacity-75">{cliente.cliente.identificacion}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={cliente.tipoRelacion}
                        onChange={(e) => cambiarRol(cliente.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white"
                      >
                        {ROLES.map(rol => (
                          <option key={rol.value} value={rol.value}>{rol.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => eliminarCliente(cliente.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar autor"
                      >
                        <FiX className="text-xl" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Formularios de Edición */}
      <div className="space-y-6">
        {formulario.productos.map((producto, idx) => (
          <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Obra #{idx + 1}: {producto.producto.nombre}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {producto.campos.map((campo) => (
                <div key={campo.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {campo.campo.titulo || campo.campo.campo}
                    {campo.campo.requerido && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderCampo(campo, idx)}
                </div>
              ))}
            </div>

            {/* Sección de archivos */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiFileText />
                Soporte Material (Archivos Adjuntos)
              </h3>

              {/* Archivos existentes */}
              {producto.archivos && producto.archivos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Archivos actuales:</p>
                  <div className="flex flex-wrap gap-2">
                    {producto.archivos.map((archivo, idx) => (
                      <a
                        key={archivo.id}
                        href={`${window.location.protocol}//${window.location.host}/${archivo.ruta.startsWith('/') ? archivo.ruta.substring(1) : archivo.ruta}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm text-green-700 font-medium"
                      >
                        <FiFileText className="flex-shrink-0" />
                        {archivo.nombreOriginal || `Archivo ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Advertencia si no hay archivos */}
              {(!producto.archivos || producto.archivos.length === 0) && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <FiAlertCircle />
                    No se adjuntó soporte material al registrar esta obra. Puedes agregar archivos ahora.
                  </p>
                </div>
              )}

              {/* Input para nuevos archivos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar nuevos archivos (opcional):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600">
                      <FiUpload />
                      <span className="text-sm font-medium">
                        Seleccionar archivos PDF, JPG, PNG
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setNuevosArchivos(prev => ({
                            ...prev,
                            [producto.id]: [...(prev[producto.id] || []), ...Array.from(e.target.files!)]
                          }));
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Mostrar archivos seleccionados */}
                {nuevosArchivos[producto.id] && nuevosArchivos[producto.id].length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Archivos seleccionados para subir:</p>
                    <div className="flex flex-wrap gap-2">
                      {nuevosArchivos[producto.id].map((file, fileIdx) => (
                        <div
                          key={fileIdx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700"
                        >
                          <FiFileText />
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNuevosArchivos(prev => ({
                                ...prev,
                                [producto.id]: prev[producto.id].filter((_, i) => i !== fileIdx)
                              }));
                            }}
                            className="ml-1 text-blue-700 hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Link
          to="/aau/formularios/devueltos"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Guardando...
            </>
          ) : (
            <>
              <FiSave />
              Guardar y Reenviar a Registro
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormularioObraEditPage;
