import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiX, FiUserPlus } from 'react-icons/fi';
import clientesService from '../../services/clientesService';

interface Cliente {
  id: number;
  codigo: string;
  identificacion: string;
  nombre: string;
  apellido: string;
  nombrecompleto: string;
  telefono?: string;
  correo?: string;
}

interface AutorSeleccionado {
  id: number;
  cliente: Cliente;
  rol: string;
  orden: number;
  esPrincipal: boolean;
}

interface Props {
  autoresIniciales: AutorSeleccionado[];
  onContinuar: (autores: AutorSeleccionado[]) => void;
}

const ROLES = [
  { value: 'AUTOR_PRINCIPAL', label: 'Autor Principal', color: 'bg-blue-100 text-blue-800' },
  { value: 'COAUTOR', label: 'Coautor', color: 'bg-green-100 text-green-800' },
  { value: 'COMPOSITOR', label: 'Compositor', color: 'bg-green-100 text-green-800' },
  { value: 'INTERPRETE', label: 'Intérprete', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EDITOR', label: 'Editor', color: 'bg-pink-100 text-pink-800' },
  { value: 'PRODUCTOR', label: 'Productor', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'ARREGLISTA', label: 'Arreglista', color: 'bg-orange-100 text-orange-800' },
  { value: 'DIRECTOR', label: 'Director', color: 'bg-teal-100 text-teal-800' },
  { value: 'OTRO', label: 'Otro', color: 'bg-gray-100 text-gray-800' },
];

const BusquedaAutoresStep = ({ autoresIniciales, onContinuar }: Props) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [autores, setAutores] = useState<AutorSeleccionado[]>(autoresIniciales);
  const [showResults, setShowResults] = useState(false);

  const buscarClientes = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResultados([]);
      return;
    }

    setSearching(true);
    try {
      const clientes = await clientesService.buscarClientes(searchQuery);
      setResultados(clientes);
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
        setResultados([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const agregarAutor = (cliente: Cliente) => {
    // Verificar que no esté ya agregado
    if (autores.some(a => a.cliente.id === cliente.id)) {
      alert('Este cliente ya ha sido agregado');
      return;
    }

    const nuevoAutor: AutorSeleccionado = {
      id: Date.now(),
      cliente,
      rol: autores.length === 0 ? 'AUTOR_PRINCIPAL' : 'COAUTOR',
      orden: autores.length + 1,
      esPrincipal: autores.length === 0, // El primero es principal por defecto
    };

    setAutores([...autores, nuevoAutor]);
    setQuery('');
    setResultados([]);
    setShowResults(false);
  };

  const cambiarRol = (autorId: number, nuevoRol: string) => {
    setAutores(autores.map(a =>
      a.id === autorId ? { ...a, rol: nuevoRol } : a
    ));
  };

  const marcarComoPrincipal = (autorId: number) => {
    // Solo uno puede ser principal - quitar principal a los demás
    setAutores(autores.map(a =>
      a.id === autorId ? { ...a, esPrincipal: true } : { ...a, esPrincipal: false }
    ));
  };

  const eliminarAutor = (autorId: number) => {
    const autorEliminado = autores.find(a => a.id === autorId);
    const autoresRestantes = autores.filter(a => a.id !== autorId);

    // Si se elimina el principal y quedan autores, marcar el primero como principal
    if (autorEliminado?.esPrincipal && autoresRestantes.length > 0) {
      autoresRestantes[0].esPrincipal = true;
    }

    setAutores(autoresRestantes);
  };

  const handleContinuar = () => {
    if (autores.length === 0) {
      alert('Debe agregar al menos un autor');
      return;
    }

    const tieneAutorPrincipal = autores.some(a => a.rol === 'AUTOR_PRINCIPAL');
    if (!tieneAutorPrincipal) {
      alert('Debe designar un Autor Principal');
      return;
    }

    onContinuar(autores);
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <FiUserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Paso 1: Buscar y Seleccionar Autores</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Busca clientes por su cédula o nombre completo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Puedes agregar múltiples autores/colaboradores</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Debe haber al menos 1 Autor Principal</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Los clientes deben estar previamente registrados en Recepción</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Buscar Cliente</h2>

        <div className="relative">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por cédula o nombre..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {showResults && resultados.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {resultados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => agregarAutor(cliente)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{cliente.nombrecompleto}</p>
                      <p className="text-sm text-gray-600">Cédula: {cliente.identificacion}</p>
                      {cliente.telefono && (
                        <p className="text-sm text-gray-500">Tel: {cliente.telefono}</p>
                      )}
                    </div>
                    <FiUserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && resultados.length === 0 && query.length >= 3 && !searching && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <p className="text-gray-600 text-center">No se encontraron clientes</p>
              <p className="text-sm text-gray-500 text-center mt-1">
                El cliente debe estar registrado en Recepción
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Autores seleccionados */}
      {autores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Autores Seleccionados ({autores.length})
          </h2>

          <div className="space-y-3">
            {autores.map((autor) => {
              const rolInfo = ROLES.find(r => r.value === autor.rol);
              return (
                <div
                  key={autor.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{autor.cliente.nombrecompleto}</p>
                    <p className="text-sm text-gray-600">Cédula: {autor.cliente.identificacion}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <input
                        type="radio"
                        checked={autor.esPrincipal}
                        onChange={() => marcarComoPrincipal(autor.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 mt-1">Principal</span>
                    </div>

                    <select
                      value={autor.rol}
                      onChange={(e) => cambiarRol(autor.id, e.target.value)}
                      className={`px-3 py-2 rounded-lg border-0 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${rolInfo?.color}`}
                    >
                      {ROLES.map((rol) => (
                        <option key={rol.value} value={rol.value}>
                          {rol.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => eliminarAutor(autor.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar autor"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botón Continuar */}
      <div className="flex justify-end">
        <button
          onClick={handleContinuar}
          disabled={autores.length === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
        >
          Continuar al Selector de Obra
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BusquedaAutoresStep;
