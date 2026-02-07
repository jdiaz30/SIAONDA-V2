import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerTodosCatalogos, Catalogos } from '../../services/inspectoriaService';
import { api } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

export default function FormularioIRCPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Verificar permiso para crear solicitudes IRC - RECEPCIONISTA NO puede
  if (!hasPermission('atu.formularios.create')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para crear solicitudes de IRC. Esta funcionalidad es solo para Técnicos ATU y Encargado de ATU." />
      </div>
    );
  }

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tipo de solicitud
  const [tipoSolicitud, setTipoSolicitud] = useState<'REGISTRO_NUEVO' | 'RENOVACION' | null>(null);
  const [busquedaRNC, setBusquedaRNC] = useState('');
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);
  const [empresaEncontrada, setEmpresaEncontrada] = useState<any>(null);

  // Datos adicionales
  const [datosAdicionales, setDatosAdicionales] = useState({
    tipoNegocio: '',
    celular: '',
    fechaInicioOperaciones: '',
    nombreAdministrador: '',
    cedulaAdministrador: '',
    telefonoAdministrador: '',
    fechaInicioActividades: '',
  });

  // Formulario principal
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
    nombreCliente: ''
  });

  const [documentos, setDocumentos] = useState<File[]>([]);

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

  const validarRNC = (rnc: string): boolean => {
    const rncSinGuiones = rnc.replace(/-/g, '');
    return rncSinGuiones.length === 9 && /^\d+$/.test(rncSinGuiones);
  };

  const validarCedula = (cedula: string): boolean => {
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

      const response = await api.get('/inspectoria/empresas', {
        params: { rnc: busquedaRNC.trim(), limit: 1 }
      });

      const empresas = response.data.data || [];
      if (empresas.length > 0) {
        const empresa = empresas[0];
        setEmpresaEncontrada(empresa);

        // Pre-llenar formulario con datos existentes
        setFormData({
          ...formData,
          nombreEmpresa: empresa.nombreEmpresa,
          nombreComercial: empresa.nombreComercial || '',
          rnc: empresa.rnc,
          categoriaIrcId: empresa.categoriaIrcId,
          tipoPersona: empresa.tipoPersona,
          nombrePropietario: empresa.nombrePropietario || '',
          cedulaPropietario: empresa.cedulaPropietario || '',
          descripcionActividades: empresa.descripcionActividades,
          direccion: empresa.direccion,
          provinciaId: empresa.provinciaId,
          sector: empresa.sector || '',
          telefono: empresa.telefono,
          correoElectronico: empresa.email || '',
          consejoAdministracion: empresa.consejoAdministracion || [],
          principalesClientes: empresa.principalesClientes || []
        });

        alert(`✅ Empresa encontrada: ${empresa.nombreEmpresa}\n\nPuede actualizar la información si es necesario y proceder con la renovación.`);
      } else {
        setError('No se encontró ninguna empresa con ese RNC/Cédula. Verifique el número o realice un Registro Nuevo.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar la empresa');
    } finally {
      setBuscandoEmpresa(false);
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
      consejoAdministracion: [...formData.consejoAdministracion, nuevoMiembro]
    });
    setNuevoMiembro({ nombreCompleto: '', cargo: '', cedula: '', domicilio: '', telefono: '', celular: '', email: '' });
  };

  const eliminarMiembroConsejo = (index: number) => {
    const nuevosMiembros = [...formData.consejoAdministracion];
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
      principalesClientes: [...formData.principalesClientes, nuevoCliente]
    });
    setNuevoCliente({ nombreCliente: '' });
  };

  const eliminarCliente = (index: number) => {
    const nuevosClientes = [...formData.principalesClientes];
    nuevosClientes.splice(index, 1);
    setFormData({ ...formData, principalesClientes: nuevosClientes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.nombreEmpresa || !formData.rnc || !formData.descripcionActividades || !formData.direccion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!validarRNC(formData.rnc)) {
      setError('El RNC debe tener 9 dígitos (con o sin guiones)');
      return;
    }

    if (formData.tipoPersona === 'MORAL' && formData.consejoAdministracion.length === 0) {
      setError('Las Personas Morales deben tener al menos un miembro del Consejo de Administración');
      return;
    }

    if (formData.tipoPersona === 'FISICA') {
      if (!formData.nombrePropietario || !formData.cedulaPropietario) {
        setError('Las Personas Físicas deben tener nombre y cédula del propietario');
        return;
      }
      if (!validarCedula(formData.cedulaPropietario)) {
        setError('La cédula debe tener 11 dígitos (con o sin guiones)');
        return;
      }
    }

    try {
      setLoading(true);

      // Guardar datosAdicionales en observaciones
      const observacionesExtendidas = JSON.stringify({
        observaciones: formData.observaciones || '',
        datosAdicionales
      });

      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append('tipoSolicitud', tipoSolicitud);

      if (empresaEncontrada) {
        formDataToSend.append('empresaId', empresaEncontrada.id.toString());
        formDataToSend.append('empresaDataActualizada', JSON.stringify({
          ...formData,
          observaciones: observacionesExtendidas,
          categoriaIrcId: parseInt(formData.categoriaIrcId),
          provinciaId: parseInt(formData.provinciaId)
        }));
      } else {
        formDataToSend.append('empresaData', JSON.stringify({
          ...formData,
          observaciones: observacionesExtendidas,
          categoriaIrcId: parseInt(formData.categoriaIrcId),
          provinciaId: parseInt(formData.provinciaId)
        }));
      }

      // Agregar documentos adjuntos
      documentos.forEach((doc) => {
        formDataToSend.append('documentos', doc);
      });

      // Crear formulario IRC (SIN generar factura)
      const response = await api.post('/aau/formularios-irc', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const formulario = response.data.data;

      alert(`✅ Formulario IRC creado exitosamente\n\n` +
            `Código: ${formulario.codigo}\n` +
            `Tipo: ${tipoSolicitud === 'REGISTRO_NUEVO' ? 'Registro Nuevo' : 'Renovación'}\n\n` +
            `El cliente debe dirigirse a CAJA para realizar el pago.`);

      navigate('/aau/formularios');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear formulario');
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
        <h1 className="text-2xl font-bold text-gray-900">Formulario de Inscripción IRC</h1>
        <p className="text-gray-600">Registro o renovación de empresas en Inspectoría</p>
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
      {!tipoSolicitud && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Servicios de Inspectoría</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button
              type="button"
              onClick={() => setTipoSolicitud('REGISTRO_NUEVO')}
              className="flex flex-col items-center p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <svg className="w-16 h-16 text-gray-400 group-hover:text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div className="font-bold text-lg text-gray-900 mb-2">Registro IRC</div>
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
              <div className="font-bold text-lg text-gray-900 mb-2">Renovación IRC</div>
              <div className="text-sm text-gray-500 text-center">Renovar inscripción IRC existente</div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/aau/denuncias/nueva')}
              className="flex flex-col items-center p-8 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <svg className="w-16 h-16 text-gray-400 group-hover:text-orange-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="font-bold text-lg text-gray-900 mb-2">Denuncia</div>
              <div className="text-sm text-gray-500 text-center">Inspección de Parte - RD$3,000</div>
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Búsqueda para renovación */}
      {tipoSolicitud === 'RENOVACION' && !empresaEncontrada && (
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
              <strong>RNC:</strong> 9 digitos (con o sin guiones) - <strong>Cedula:</strong> 11 digitos (con o sin guiones)
            </p>
          </div>
        </div>
      )}

      {/* PASO 3: Formulario completo (Registro Nuevo o Renovación encontrada) */}
      {(tipoSolicitud === 'REGISTRO_NUEVO' || (tipoSolicitud === 'RENOVACION' && empresaEncontrada)) && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Persona */}
        {tipoSolicitud === 'REGISTRO_NUEVO' && (
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
                    <li>- Requiere Consejo de Administracion</li>
                    <li>- RNC empresarial (9 digitos)</li>
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
                    <li>- Datos del propietario y administrador</li>
                    <li>- Cedula de identidad (11 digitos)</li>
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
                placeholder="Ej: 101234567 o 1-01-23456-7"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">9 digitos (con o sin guiones)</p>
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
                  placeholder="Ej: 40200588933 o 402-0058893-3"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">11 digitos (con o sin guiones)</p>
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
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.principalesClientes.map((cliente: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{cliente.nombreCliente}</td>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={nuevoCliente.nombreCliente}
                  onChange={(e) => setNuevoCliente({ nombreCliente: e.target.value })}
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

        {/* Documentos de Soporte */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documentos de Soporte <span className="text-red-500">*</span>
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">📄 Documentos Requeridos</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• RNC de la empresa</li>
              <li>• Cédula del propietario/representante legal</li>
              <li>• Registro Mercantil (si aplica)</li>
              <li>• Facturas de productos que comercializa</li>
              <li>• Otros documentos relevantes</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivos (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files) {
                  setDocumentos(Array.from(e.target.files));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {documentos.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
                {documentos.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">
                      {doc.name} ({(doc.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocumentos(docs => docs.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Nota: Los documentos deben entregarse físicamente en AaU. Este campo es opcional en el formulario digital.
            </p>
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
            onClick={() => navigate('/aau/formularios')}
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
            Enviar a Caja
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
