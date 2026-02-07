import { useState, useEffect } from 'react';
import { FiPackage, FiSearch, FiCheck } from 'react-icons/fi';
import productosService from '../../services/productosService';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
}

interface Props {
  onProductoSeleccionado: (producto: Producto, esProduccion: boolean) => void;
  onVolver: () => void;
}

const SelectorProductoStep = ({ onProductoSeleccionado, onVolver }: Props) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await productosService.getProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías únicas
  const categorias = Array.from(new Set(productos.map(p => p.categoria))).sort();

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;

    return coincideBusqueda && coincideCategoria;
  });

  // Agrupar por categoría
  const productosAgrupados = productosFiltrados.reduce((acc, producto) => {
    if (!acc[producto.categoria]) {
      acc[producto.categoria] = [];
    }
    acc[producto.categoria].push(producto);
    return acc;
  }, {} as Record<string, Producto[]>);

  const handleSeleccionar = (producto: Producto) => {
    setProductoSeleccionado(producto);
  };

  const handleContinuar = () => {
    if (!productoSeleccionado) {
      alert('Debe seleccionar un tipo de obra');
      return;
    }
    // Detectar si es una producción (código termina en -P)
    const esProduccion = productoSeleccionado.codigo.endsWith('-P');
    onProductoSeleccionado(productoSeleccionado, esProduccion);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <FiPackage className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Paso 2: Seleccionar Tipo de Obra</h3>
            <p className="text-sm text-blue-800">
              Seleccione el tipo de obra que desea registrar. Cada tipo tiene un precio específico establecido por ONDA.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de productos por categoría */}
      <div className="space-y-6">
        {Object.keys(productosAgrupados).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No se encontraron obras con los filtros aplicados</p>
          </div>
        ) : (
          Object.entries(productosAgrupados).map(([categoria, items]) => (
            <div key={categoria} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header de categoría */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3">
                <h3 className="text-lg font-semibold text-white">{categoria}</h3>
                <p className="text-sm text-blue-100">{items.length} opciones disponibles</p>
              </div>

              {/* Lista de productos */}
              <div className="divide-y divide-gray-200">
                {items.map((producto) => {
                  const isSelected = productoSeleccionado?.id === producto.id;
                  const esProduccion = producto.codigo.endsWith('-P');
                  return (
                    <button
                      key={producto.id}
                      onClick={() => handleSeleccionar(producto)}
                      className={`w-full px-6 py-4 text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono">
                              {producto.codigo}
                            </span>
                            <h4 className="font-semibold text-gray-900">{producto.nombre}</h4>
                            {esProduccion && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                PRODUCCIÓN (6-15 obras)
                              </span>
                            )}
                            {isSelected && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <FiCheck className="w-5 h-5" />
                                <span className="text-sm font-medium">Seleccionado</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            RD$ {producto.precio.toLocaleString('es-DO')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {esProduccion ? 'Precio por producción completa' : 'Precio oficial ONDA'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Producto seleccionado */}
      {productoSeleccionado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-1">Obra Seleccionada</h3>
              <p className="text-green-800">
                <strong>{productoSeleccionado.codigo}</strong> - {productoSeleccionado.nombre}
              </p>
              <p className="text-green-700 mt-2">
                Monto a pagar: <strong>RD$ {productoSeleccionado.precio.toLocaleString('es-DO')}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={onVolver}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Autores
        </button>

        <button
          onClick={handleContinuar}
          disabled={!productoSeleccionado}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
        >
          Continuar al Formulario
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SelectorProductoStep;
