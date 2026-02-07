import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  crearEmpresa,
  actualizarEmpresa,
  obtenerEmpresaPorId,
  obtenerTodosCatalogos,
  EmpresaInspeccionada,
  ClienteEmpresa,
  Catalogos
} from '../../services/inspectoriaService';

export default function EmpresaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flujo: Registro Nuevo vs Renovación
  const [tipoSolicitud, setTipoSolicitud] = useState<'REGISTRO_NUEVO' | 'RENOVACION' | null>(isEditing ? 'REGISTRO_NUEVO' : null);
  const [busquedaRNC, setBusquedaRNC] = useState('');
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);

  // Campos adicionales para guardar en observaciones como JSON
  const [datosAdicionales, setDatosAdicionales] = useState({
    tipoNegocio: '',
    telefonoOficina: '',
    celular: '',
    fechaInicioOperaciones: '',
    // Para Persona Física
    nombreAdministrador: '',
    cedulaAdministrador: '',
    telefonoAdministrador: '',
    fechaInicioActividades: '',
    // Consejo detallado se guarda en consejoAdministracion[]
  });

  const [formData, setFormData] = useState<Partial<EmpresaInspeccionada>>({
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
    telefono: '', // Usaremos este para teléfono principal
    telefonoSecundario: '',
    correoElectronico: '',
    paginaWeb: '',
    cantidadEmpleados: 0,
    fechaConstitucion: '',
    registrado: false,
    statusId: 1,
    estadoJuridicoId: 1,
    conclusionId: 1,
    registradoId: 1,
    existenciaId: 1,
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

  const [nuevoCliente, setNuevoCliente] = useState<ClienteEmpresa>({
    nombreCliente: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarCatalogos();
    if (isEditing) {
      cargarEmpresa();
    }
  }, [id]);

  const cargarCatalogos = async () => {
    try {
      const data = await obtenerTodosCatalogos();
      setCatalogos(data);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar los catálogos');
    }
  };

  const cargarEmpresa = async () => {
    try {
      setLoading(true);
      const empresa = await obtenerEmpresaPorId(parseInt(id!));

      // Parsear observaciones extendidas si existen
      let observacionesTexto = empresa.observaciones || '';
      let datosAdicionalesCargados = {
        tipoNegocio: '',
        telefonoOficina: '',
        celular: '',
        fechaInicioOperaciones: '',
        nombreAdministrador: '',
        cedulaAdministrador: '',
        telefonoAdministrador: '',
        fechaInicioActividades: '',
      };

      try {
        const parsed = JSON.parse(empresa.observaciones || '{}');
        if (parsed.datosAdicionales) {
          datosAdicionalesCargados = { ...datosAdicionalesCargados, ...parsed.datosAdicionales };
          observacionesTexto = parsed.observaciones || '';
        }
      } catch {
        // Si no es JSON válido, usar como texto normal
      }

      setDatosAdicionales(datosAdicionalesCargados);
      setFormData({
        ...empresa,
        observaciones: observacionesTexto,
        fechaConstitucion: empresa.fechaConstitucion
          ? new Date(empresa.fechaConstitucion).toISOString().split('T')[0]
          : ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: value ? parseInt(value) : 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

  const validarRNC = (rnc: string): boolean => {
    // RNC: 9 dígitos sin guiones, o 11 con guiones (XXX-XXXXX-X)
    const rncSinGuiones = rnc.replace(/-/g, '');
    return rncSinGuiones.length === 9 && /^\d+$/.test(rncSinGuiones);
  };

  const validarCedula = (cedula: string): boolean => {
    // Cédula: 11 dígitos sin guiones, o 13 con guiones (XXX-XXXXXXX-X)
    const cedulaSinGuiones = cedula.replace(/-/g, '');
    return cedulaSinGuiones.length === 11 && /^\d+$/.test(cedulaSinGuiones);
  };

  const buscarEmpresaRenovacion = async () => {
    if (!busquedaRNC.trim()) {
      setError('Ingrese un RNC o Cédula para buscar');
      return;
    }

    try {
      setBuscandoEmpresa(true);
      setError(null);

      // Importar función de búsqueda
      const { buscarEmpresaPorRNC } = await import('../../services/inspectoriaService');
      const empresaEncontrada = await buscarEmpresaPorRNC(busquedaRNC.trim());

      if (empresaEncontrada) {
        // Cargar empresa para renovación
        setFormData({
          ...empresaEncontrada,
          fechaConstitucion: empresaEncontrada.fechaConstitucion
            ? new Date(empresaEncontrada.fechaConstitucion).toISOString().split('T')[0]
            : ''
        });

        // Parsear datosAdicionales si existen
        try {
          const parsed = JSON.parse(empresaEncontrada.observaciones || '{}');
          if (parsed.datosAdicionales) {
            setDatosAdicionales({ ...datosAdicionales, ...parsed.datosAdicionales });
          }
        } catch {
          // Ignorar si no es JSON
        }

        alert(`Empresa encontrada: ${empresaEncontrada.nombreEmpresa}\n\nPuede proceder con la renovación.`);
      } else {
        setError('No se encontró ninguna empresa con ese RNC/Cédula. Verifique el número o realice un Registro Nuevo.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar la empresa');
    } finally {
      setBuscandoEmpresa(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombreEmpresa || !formData.rnc || !formData.descripcionActividades || !formData.direccion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!validarRNC(formData.rnc)) {
      setError('El RNC debe tener el formato XXX-XXXXX-X');
      return;
    }

    if (formData.tipoPersona === 'MORAL') {
      if (!formData.consejoAdministracion || formData.consejoAdministracion.length === 0) {
        setError('Las Personas Morales deben tener al menos un miembro del Consejo de Administración');
        return;
      }
    } else {
      if (!formData.nombrePropietario || !formData.cedulaPropietario) {
        setError('Las Personas Físicas deben tener nombre y cédula del propietario');
        return;
      }
      if (!validarCedula(formData.cedulaPropietario)) {
        setError('La cédula debe tener el formato XXX-XXXXXXX-X');
        return;
      }
    }

    try {
      setLoading(true);

      // Combinar datosAdicionales con observaciones existentes
      const observacionesActuales = formData.observaciones || '';
      const observacionesExtendidas = JSON.stringify({
        observaciones: observacionesActuales,
        datosAdicionales
      });

      const dataToSend = {
        ...formData,
        observaciones: observacionesExtendidas,
        categoriaIrcId: parseInt(formData.categoriaIrcId as any),
        provinciaId: parseInt(formData.provinciaId as any),
        statusId: parseInt(formData.statusId as any),
        estadoJuridicoId: parseInt(formData.estadoJuridicoId as any),
        conclusionId: parseInt(formData.conclusionId as any),
        registradoId: parseInt(formData.registradoId as any),
        existenciaId: parseInt(formData.existenciaId as any)
      };

      if (isEditing) {
        await actualizarEmpresa(parseInt(id!), dataToSend);
        navigate('/inspectoria/empresas');
      } else {
        // Crear empresa
        const empresaCreada = await crearEmpresa(dataToSend as EmpresaInspeccionada);

        // Crear solicitud automáticamente con factura
        if (tipoSolicitud && empresaCreada.id) {
          try {
            const { crearSolicitud, generarFactura } = await import('../../services/inspectoriaService');

            // 1. Crear solicitud
            const solicitudCreada = await crearSolicitud({
              empresaId: empresaCreada.id,
              tipoSolicitud: tipoSolicitud,
              rnc: formData.rnc,
              nombreEmpresa: formData.nombreEmpresa,
              nombreComercial: formData.nombreComercial,
              categoriaIrcId: formData.categoriaIrcId,
              estadoId: 1 // PENDIENTE
            });

            // 2. Generar factura automáticamente
            if (solicitudCreada.id) {
              await generarFactura(solicitudCreada.id);
            }

            alert(`✅ Empresa registrada exitosamente\n\n` +
                  `Código de solicitud: ${solicitudCreada.codigo || 'N/A'}\n` +
                  `La factura ha sido generada.\n\n` +
                  `El cliente puede proceder a Caja para realizar el pago.`);
          } catch (solicitudError: any) {
            console.error('Error creando solicitud:', solicitudError);
            alert(`⚠️ Empresa creada pero hubo un error al generar la solicitud:\n${solicitudError.response?.data?.message || solicitudError.message}\n\nDebe crear la solicitud manualmente desde el módulo de Inspectoría.`);
          }
        }

        navigate('/inspectoria/empresas');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la empresa');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Modifique los datos de la empresa' : 'Registre una nueva empresa en Inspectoría'}
        </p>
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

      {/* PASO 1: Seleccionar tipo de solicitud */}
      {!isEditing && !tipoSolicitud && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Tipo de Solicitud IRC</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setTipoSolicitud('REGISTRO_NUEVO')}
              className="flex flex-col items-center p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <svg className="w-16 h-16 text-gray-400 group-hover:text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div className="font-bold text-lg text-gray-900 mb-2">Registro Nuevo</div>
              <div className="text-sm text-gray-500 text-center">Primera inscripción IRC de una empresa</div>
            </button>

            <button
              type="button"
              onClick={() => setTipoSolicitud('RENOVACION')}
              className="flex flex-col items-center p-8 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <svg className="w-16 h-16 text-gray-400 group-hover:text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="font-bold text-lg text-gray-900 mb-2">Renovación</div>
              <div className="text-sm text-gray-500 text-center">Renovar inscripción IRC existente</div>
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Búsqueda para renovación */}
      {!isEditing && tipoSolicitud === 'RENOVACION' && !formData.id && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Buscar Empresa por RNC o Cédula</h2>
            <button
              type="button"
              onClick={() => { setTipoSolicitud(null); setBusquedaRNC(''); }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Volver
            </button>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm text-gray-600 mb-4">
              Ingrese el RNC (9 dígitos) o Cédula (11 dígitos) de la empresa a renovar. Puede incluir o no los guiones.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={busquedaRNC}
                onChange={(e) => setBusquedaRNC(e.target.value)}
                placeholder="Ej: 123456789 o 123-4567890-1"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarEmpresaRenovacion(); } }}
              />
              <button
                type="button"
                onClick={buscarEmpresaRenovacion}
                disabled={buscandoEmpresa}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {buscandoEmpresa && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Buscar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Formato RNC:</strong> 9-11 caracteres • <strong>Formato Cédula:</strong> 11-13 caracteres
            </p>
          </div>
        </div>
      )}

      {/* PASO 3: Formulario completo (Registro Nuevo o Renovación encontrada) */}
      {(isEditing || tipoSolicitud === 'REGISTRO_NUEVO' || (tipoSolicitud === 'RENOVACION' && formData.id)) && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Persona */}
        {!isEditing && tipoSolicitud === 'REGISTRO_NUEVO' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Persona Jurídica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.tipoPersona === 'MORAL'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipoPersona"
                  value="MORAL"
                  checked={formData.tipoPersona === 'MORAL'}
                  onChange={handleChange}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="font-bold text-gray-900">Persona Moral</div>
                  </div>
                  <div className="text-sm text-gray-600">Empresa o sociedad constituida legalmente</div>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• Requiere Consejo de Administración</li>
                    <li>• RNC empresarial (9 dígitos)</li>
                  </ul>
                </div>
              </label>

              <label
                className={`relative flex items-start p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.tipoPersona === 'FISICA'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipoPersona"
                  value="FISICA"
                  checked={formData.tipoPersona === 'FISICA'}
                  onChange={handleChange}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="font-bold text-gray-900">Persona Física</div>
                  </div>
                  <div className="text-sm text-gray-600">Propietario individual</div>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• Datos del propietario y administrador</li>
                    <li>• Cédula de identidad (11 dígitos)</li>
                  </ul>
                </div>
              </label>
            </div>
          </div>
        )}

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
                Tipo de Negocio
              </label>
              <input
                type="text"
                name="tipoNegocio"
                value={datosAdicionales.tipoNegocio}
                onChange={(e) => setDatosAdicionales({ ...datosAdicionales, tipoNegocio: e.target.value })}
                placeholder="Ej: Importador, Distribuidor, Fabricante"
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
              <p className="text-xs text-gray-500 mt-1">Formato: XXX-XXXXX-X</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría IRC <span className="text-red-500">*</span>
              </label>
              <select
                name="categoriaIrcId"
                value={formData.categoriaIrcId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione una categoría</option>
                {catalogos.categoriasIRC.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.codigo} - {cat.nombre} (RD$ {cat.precio.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Constitución
              </label>
              <input
                type="date"
                name="fechaConstitucion"
                value={formData.fechaConstitucion?.toString()}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formData.tipoPersona === 'MORAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio de Operaciones
                </label>
                <input
                  type="date"
                  name="fechaInicioOperaciones"
                  value={datosAdicionales.fechaInicioOperaciones}
                  onChange={(e) => setDatosAdicionales({ ...datosAdicionales, fechaInicioOperaciones: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de Actividades <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcionActividades"
                value={formData.descripcionActividades}
                onChange={handleChange}
                rows={3}
                required
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
                  placeholder="XXX-XXXXXXX-X"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: XXX-XXXXXXX-X</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio de Actividades
                </label>
                <input
                  type="date"
                  name="fechaInicioActividades"
                  value={datosAdicionales.fechaInicioActividades}
                  onChange={(e) => setDatosAdicionales({ ...datosAdicionales, fechaInicioActividades: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <h3 className="text-md font-semibold text-gray-800 mb-3 mt-2">Datos del Administrador</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Administrador
                </label>
                <input
                  type="text"
                  name="nombreAdministrador"
                  value={datosAdicionales.nombreAdministrador}
                  onChange={(e) => setDatosAdicionales({ ...datosAdicionales, nombreAdministrador: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula del Administrador
                </label>
                <input
                  type="text"
                  name="cedulaAdministrador"
                  value={datosAdicionales.cedulaAdministrador}
                  onChange={(e) => setDatosAdicionales({ ...datosAdicionales, cedulaAdministrador: e.target.value })}
                  placeholder="XXX-XXXXXXX-X"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono del Administrador
                </label>
                <input
                  type="tel"
                  name="telefonoAdministrador"
                  value={datosAdicionales.telefonoAdministrador}
                  onChange={(e) => setDatosAdicionales({ ...datosAdicionales, telefonoAdministrador: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Consejo de Administración (solo Persona Moral) */}
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.consejoAdministracion.map((miembro: any, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{miembro.nombreCompleto}</td>
                        <td className="px-4 py-2 text-sm">{miembro.cargo}</td>
                        <td className="px-4 py-2 text-sm">{miembro.cedula || '-'}</td>
                        <td className="px-4 py-2 text-sm">{miembro.telefono || miembro.celular || '-'}</td>
                        <td className="px-4 py-2 text-sm">{miembro.email || '-'}</td>
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar Miembro del Consejo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nuevoMiembro.nombreCompleto}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, nombreCompleto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cargo</label>
                  <input
                    type="text"
                    placeholder="Ej: Presidente, Vicepresidente, Secretario"
                    value={nuevoMiembro.cargo}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, cargo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cédula</label>
                  <input
                    type="text"
                    placeholder="XXX-XXXXXXX-X"
                    value={nuevoMiembro.cedula}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, cedula: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Domicilio</label>
                  <input
                    type="text"
                    placeholder="Dirección completa"
                    value={nuevoMiembro.domicilio}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, domicilio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="809-555-1234"
                    value={nuevoMiembro.telefono}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, telefono: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Celular</label>
                  <input
                    type="tel"
                    placeholder="809-555-5678"
                    value={nuevoMiembro.celular}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, celular: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={nuevoMiembro.email}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarMiembroConsejo}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Agregar Miembro
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
                Provincia <span className="text-red-500">*</span>
              </label>
              <select
                name="provinciaId"
                value={formData.provinciaId}
                onChange={handleChange}
                required
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
                Sector
              </label>
              <input
                type="text"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono Oficina
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="809-555-1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="tel"
                name="celular"
                value={datosAdicionales.celular}
                onChange={(e) => setDatosAdicionales({ ...datosAdicionales, celular: e.target.value })}
                placeholder="809-555-5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono Adicional
              </label>
              <input
                type="tel"
                name="telefonoSecundario"
                value={formData.telefonoSecundario}
                onChange={handleChange}
                placeholder="809-555-9012"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correoElectronico"
                value={formData.correoElectronico}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Página Web
              </label>
              <input
                type="url"
                name="paginaWeb"
                value={formData.paginaWeb}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad de Empleados
              </label>
              <input
                type="number"
                name="cantidadEmpleados"
                value={formData.cantidadEmpleados}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Principales Clientes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Principales Clientes (Opcional)
          </h2>

          {formData.principalesClientes && formData.principalesClientes.length > 0 && (
            <div className="mb-4 border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.principalesClientes.map((cliente, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{cliente.nombreCliente}</td>
                      <td className="px-4 py-2 text-sm">{cliente.descripcion || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <button
                          type="button"
                          onClick={() => eliminarCliente(index)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={nuevoCliente.nombreCliente}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombreCliente: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={nuevoCliente.descripcion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={agregarCliente}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
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
            placeholder="Notas adicionales sobre la empresa..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/inspectoria/empresas')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isEditing ? 'Actualizar' : 'Guardar'} Empresa
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
