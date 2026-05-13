import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodosCatalogos,
  Catalogos
} from '../../services/inspectoriaService';
import { api } from '../../services/api';

export default function EmpresaVigenteFormPage() {
  const navigate = useNavigate();

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subcategorías IRC y años de vigencia
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string>('');
  const [anosVigencia, setAnosVigencia] = useState<number>(1);
  const [fechaInicioVigencia, setFechaInicioVigencia] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    nombreEmpresa: '',
    nombreComercial: '',
    rnc: '',
    categoriaIrcId: 0,
    tipoPersona: 'MORAL',
    nombrePropietario: '',
    cedulaPropietario: '',
    descripcionActividades: '',
    direccion: '',
    provinciaId: 0,
    sector: '',
    telefono: '',
    telefonoSecundario: '',
    correoElectronico: '',
    paginaWeb: '',
    cantidadEmpleados: 0,
    fechaConstitucion: '',
    observaciones: '',
    consejoAdministracion: [],
    principalesClientes: []
  });

  const [nuevoMiembro, setNuevoMiembro] = useState({
    nombreCompleto: '',
    cargo: '',
    cedula: '',
    domicilio: '',
    telefono: '',
    celular: '',
    email: ''
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    nombreCliente: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const data = await obtenerTodosCatalogos();
      setCatalogos(data);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar los catálogos');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData({ ...formData, [name]: value ? parseInt(value) : 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoriaId = parseInt(e.target.value);
    setFormData({ ...formData, categoriaIrcId: categoriaId });

    const categoria = catalogos?.categoriasIRC.find(c => c.id === categoriaId);
    setCategoriaSeleccionada(categoria);
    setSubcategoriaSeleccionada('');
  };

  const agregarMiembroConsejo = () => {
    if (!nuevoMiembro.nombreCompleto || !nuevoMiembro.cargo) {
      alert('Nombre completo y cargo son obligatorios');
      return;
    }

    setFormData({
      ...formData,
      consejoAdministracion: [
        ...(formData.consejoAdministracion || []),
        nuevoMiembro
      ]
    });

    setNuevoMiembro({ nombreCompleto: '', cargo: '', cedula: '', domicilio: '', telefono: '', celular: '', email: '' });
  };

  const eliminarMiembroConsejo = (index: number) => {
    const nuevosMiembros = [...(formData.consejoAdministracion || [])];
    nuevosMiembros.splice(index, 1);
    setFormData({ ...formData, consejoAdministracion: nuevosMiembros });
  };

  const agregarCliente = () => {
    if (!nuevoCliente.nombreCliente) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    setFormData({
      ...formData,
      principalesClientes: [
        ...(formData.principalesClientes || []),
        nuevoCliente
      ]
    });

    setNuevoCliente({ nombreCliente: '', descripcion: '' });
  };

  const eliminarCliente = (index: number) => {
    const nuevosClientes = [...(formData.principalesClientes || [])];
    nuevosClientes.splice(index, 1);
    setFormData({ ...formData, principalesClientes: nuevosClientes });
  };

  const calcularFechaVencimiento = (): string => {
    if (!fechaInicioVigencia || anosVigencia <= 0) return '';

    const fechaInicio = new Date(fechaInicioVigencia);
    const fechaVenc = new Date(fechaInicio);
    fechaVenc.setFullYear(fechaVenc.getFullYear() + anosVigencia);

    return fechaVenc.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.nombreEmpresa || !formData.rnc || !formData.direccion || !formData.categoriaIrcId) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!fechaInicioVigencia) {
      setError('Debe indicar la fecha de inicio de vigencia');
      return;
    }

    // Validar subcategoría si es necesaria
    if (categoriaSeleccionada?.subcategorias && categoriaSeleccionada.subcategorias.length > 0 && !subcategoriaSeleccionada) {
      setError('Debe seleccionar una subcategoría para esta categoría IRC');
      return;
    }

    if (formData.tipoPersona === 'MORAL' && (!formData.consejoAdministracion || formData.consejoAdministracion.length === 0)) {
      setError('Las Personas Morales deben tener al menos un miembro del Consejo de Administración');
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        ...formData,
        categoriaIrcId: parseInt(formData.categoriaIrcId),
        provinciaId: parseInt(formData.provinciaId),
        subcategoriaIrc: subcategoriaSeleccionada || null,
        anosVigencia,
        fechaInicioVigencia,
        fechaVencimiento: calcularFechaVencimiento()
      };

      await api.post('/inspectoria/empresas/vigente', dataToSend);

      alert(`✅ Empresa vigente registrada exitosamente\n\n` +
            `Empresa: ${formData.nombreEmpresa}\n` +
            `Vigencia: ${fechaInicioVigencia} hasta ${calcularFechaVencimiento()}\n\n` +
            `La empresa ha sido marcada como registrada y vigente.`);

      navigate('/inspectoria/empresas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la empresa vigente');
    } finally {
      setLoading(false);
    }
  };

  if (!catalogos) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Registro de Empresa Ya Vigente</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Este formulario es para registrar empresas que <strong>ya tienen IRC vigente</strong> antes de la implementación del sistema.</p>
              <p className="mt-1">No se generará factura ni solicitud de pago. La empresa se marcará como registrada automáticamente.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Empresa Vigente</h1>
        <p className="text-gray-600">Ingrese los datos de la empresa que ya cuenta con IRC vigente</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Persona */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Persona Jurídica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-start p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.tipoPersona === 'MORAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                name="tipoPersona"
                value="MORAL"
                checked={formData.tipoPersona === 'MORAL'}
                onChange={handleChange}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-bold text-gray-900">Persona Moral</div>
                <div className="text-sm text-gray-600">Empresa o sociedad</div>
              </div>
            </label>

            <label className={`relative flex items-start p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.tipoPersona === 'FISICA' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                name="tipoPersona"
                value="FISICA"
                checked={formData.tipoPersona === 'FISICA'}
                onChange={handleChange}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-bold text-gray-900">Persona Física</div>
                <div className="text-sm text-gray-600">Propietario individual</div>
              </div>
            </label>
          </div>
        </div>

        {/* Información General */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombreEmpresa"
                value={formData.nombreEmpresa}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                name="nombreComercial"
                value={formData.nombreComercial}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RNC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rnc"
                value={formData.rnc}
                onChange={handleChange}
                placeholder="XXX-XXXXX-X"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría IRC <span className="text-red-500">*</span>
              </label>
              <select
                name="categoriaIrcId"
                value={formData.categoriaIrcId}
                onChange={handleCategoriaChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione una categoría</option>
                {catalogos.categoriasIRC.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.codigo} - {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Subcategoría */}
            {categoriaSeleccionada?.subcategorias && categoriaSeleccionada.subcategorias.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoría / Tamaño <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategoriaSeleccionada}
                  onChange={(e) => setSubcategoriaSeleccionada(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una opción</option>
                  {categoriaSeleccionada.subcategorias.map((subcat: any) => (
                    <option key={subcat.codigo} value={subcat.codigo}>
                      {subcat.nombre} (RD$ {subcat.precio.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio de Vigencia <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fechaInicioVigencia}
                onChange={(e) => setFechaInicioVigencia(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Fecha en que la empresa obtuvo el IRC</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Años de Vigencia <span className="text-red-500">*</span>
              </label>
              <select
                value={anosVigencia}
                onChange={(e) => setAnosVigencia(parseInt(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 año</option>
                <option value="2">2 años</option>
                <option value="3">3 años</option>
                <option value="4">4 años</option>
                <option value="5">5 años</option>
              </select>
              {fechaInicioVigencia && anosVigencia > 0 && (
                <p className="text-sm font-semibold text-green-600 mt-2">
                  📅 Vence: {calcularFechaVencimiento()}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de Actividades
              </label>
              <textarea
                name="descripcionActividades"
                value={formData.descripcionActividades}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Propietario (solo Persona Física) */}
        {formData.tipoPersona === 'FISICA' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Propietario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombrePropietario"
                  value={formData.nombrePropietario}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cedulaPropietario"
                  value={formData.cedulaPropietario}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Consejo de Administración (solo Persona Moral) - Simplificado */}
        {formData.tipoPersona === 'MORAL' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Consejo de Administración <span className="text-red-500">*</span>
            </h2>

            {formData.consejoAdministracion && formData.consejoAdministracion.length > 0 && (
              <div className="mb-4 border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.consejoAdministracion.map((miembro: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{miembro.nombreCompleto}</td>
                        <td className="px-4 py-2 text-sm">{miembro.cargo}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          <button
                            type="button"
                            onClick={() => eliminarMiembroConsejo(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar Miembro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nuevoMiembro.nombreCompleto}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, nombreCompleto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Cargo"
                    value={nuevoMiembro.cargo}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, cargo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={agregarMiembroConsejo}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ubicación y Contacto */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicación y Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección <span className="text-red-500">*</span>
              </label>
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                rows={2}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <select
                name="provinciaId"
                value={formData.provinciaId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione una provincia</option>
                {catalogos.provincias.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h2>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas sobre la vigencia previa de esta empresa..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/inspectoria/empresas')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Registrar Empresa Vigente
          </button>
        </div>
      </form>
    </div>
  );
}
