import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  clientesService,
  CreateClienteDto,
  ClienteTipo,
  ClienteNacionalidad,
} from '../../services/clientesService';
import { visitasService, CreateVisitaDto } from '../../services/visitasService';
import { archivosService } from '../../services/archivosService';
import { getErrorMessage } from '../../utils/errorHandler';

const PROVINCIAS_RD = [
  'DISTRITO NACIONAL', 'SANTO DOMINGO', 'SANTIAGO', 'AZUA', 'BAHORUCO', 'BARAHONA',
  'DAJABON', 'DUARTE', 'EL SEIBO', 'ELIAS PIÑA', 'ESPAILLAT', 'HATO MAYOR',
  'HERMANAS MIRABAL', 'INDEPENDENCIA', 'LA ALTAGRACIA', 'LA ROMANA', 'LA VEGA',
  'MARIA TRINIDAD SANCHEZ', 'MONSEÑOR NOUEL', 'MONTE PLATA', 'MONTECRISTI',
  'PEDERNALES', 'PERAVIA', 'PUERTO PLATA', 'SAMANA', 'SAN CRISTOBAL',
  'SAN JOSE DE OCOA', 'SAN JUAN', 'SAN PEDRO DE MACORIS', 'SANCHEZ RAMIREZ',
  'SANTIAGO RODRIGUEZ', 'VALVERDE'
];

const TIPOS_VISITA = [
  'SOLICITUD DE REGISTRO DE OBRAS',
  'RETIRO DE CERTIFICADOS',
  'RETIRO Y REGISTRO',
  'ASESORIA LEGAL',
  'VISITANTE',
  'REUNION',
  'INFORMACION',
  'OTROS',
  'ENTREVISTA',
  'ENTREGA DE DOCUMENTO',
  'QUEJAS Y/O RECLAMOS'
];

const DEPARTAMENTOS = [
  'DIRECCION GENERAL',
  'ATENCION AL USUARIO',
  'RESOLUCION DE CONFLICTO',
  'INSPECTORIA',
  'RECURSOS HUMANOS',
  'PLANIFICACION Y DESARROLLO',
  'TECNOLOGIA',
  'SERVICIOS GENERALES',
  'SOCIEDADES DE GESTION',
  'RAI',
  'COMPRAS',
  'CENTRO DE CAPACITACION',
  'REGISTRO',
  'PERITAJE',
  'COMUNICACIONES',
  'JURIDICA',
  'FINANZAS',
  'ASUNTOS INTERINSTITUCIONALES',
  'ARCHIVO Y CORRESPONDENCIA'
];

const ClienteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [tipos, setTipos] = useState<ClienteTipo[]>([]);
  const [nacionalidades, setNacionalidades] = useState<ClienteNacionalidad[]>([]);
  const [error, setError] = useState('');
  const [searchingCedula, setSearchingCedula] = useState(false);

  const [formData, setFormData] = useState<CreateClienteDto>({
    identificacion: '',
    tipoIdentificacion: 'Cedula',
    nombre: '',
    apellido: '',
    seudonimo: '',
    genero: 'M',
    direccion: '',
    municipio: '',
    sector: '',
    provincia: 'DISTRITO NACIONAL',
    telefono: '',
    movil: '',
    correo: '',
    tipoId: 0,
    nacionalidadId: 0,
    fechaFallecimiento: ''
  });

  const [visitaData, setVisitaData] = useState<CreateVisitaDto>({
    clienteId: 0,
    tipoVisita: 'SOLICITUD DE REGISTRO DE OBRAS',
    departamento: 'REGISTRO',
    personaContacto: '',
    razonVisita: '',
    nota: ''
  });

  const [incluirVisita, setIncluirVisita] = useState(true);

  // Estados para archivos
  const [archivosParaSubir, setArchivosParaSubir] = useState<File[]>([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  useEffect(() => {
    loadCatalogos();
    if (isEdit && id) {
      loadCliente(parseInt(id));
    }
  }, [id]);

  const loadCatalogos = async () => {
    try {
      const [tiposData, nacionalidadesData] = await Promise.all([
        clientesService.getTipos(),
        clientesService.getNacionalidades(),
      ]);
      setTipos(tiposData);
      setNacionalidades(nacionalidadesData);

      if (tiposData.length > 0 && !formData.tipoId) {
        setFormData((prev) => ({ ...prev, tipoId: tiposData[0].id }));
      }
      if (nacionalidadesData.length > 0 && !formData.nacionalidadId) {
        const rd = nacionalidadesData.find((n) => n.codigo === 'DO');
        setFormData((prev) => ({
          ...prev,
          nacionalidadId: rd ? rd.id : nacionalidadesData[0].id,
        }));
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadCliente = async (clienteId: number) => {
    setLoadingData(true);
    try {
      const cliente = await clientesService.getCliente(clienteId);
      setFormData({
        identificacion: cliente.identificacion,
        tipoIdentificacion: cliente.tipoIdentificacion || 'Cedula',
        nombre: cliente.nombre,
        apellido: cliente.apellido || '',
        seudonimo: cliente.seudonimo || '',
        genero: cliente.genero || 'M',
        direccion: cliente.direccion || '',
        municipio: cliente.municipio || '',
        sector: cliente.sector || '',
        provincia: cliente.provincia || 'DISTRITO NACIONAL',
        telefono: cliente.telefono || '',
        movil: cliente.movil || '',
        correo: cliente.correo || '',
        tipoId: cliente.tipoId,
        nacionalidadId: cliente.nacionalidadId,
        fechaFallecimiento: cliente.fechaFallecimiento ? new Date(cliente.fechaFallecimiento).toISOString().split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error cargando cliente:', error);
      setError('Error al cargar el cliente');
    } finally {
      setLoadingData(false);
    }
  };

  const handleBuscarCedula = async () => {
    if (!formData.identificacion || formData.identificacion.length < 9) return;

    setSearchingCedula(true);
    try {
      const cliente = await clientesService.buscarPorIdentificacion(formData.identificacion);
      if (cliente) {
        if (window.confirm('Este cliente ya existe. ¿Desea editarlo?')) {
          navigate(`/clientes/${cliente.id}/editar`);
        }
      }
    } catch (error) {
      console.error('Error buscando cédula:', error);
    } finally {
      setSearchingCedula(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let cliente;
      if (isEdit && id) {
        cliente = await clientesService.updateCliente(parseInt(id), formData);
      } else {
        cliente = await clientesService.createCliente(formData);

        if (incluirVisita && cliente) {
          await visitasService.createVisita({
            ...visitaData,
            clienteId: cliente.id
          });
        }
      }

      // Subir archivos si hay alguno
      if (cliente && archivosParaSubir.length > 0) {
        setSubiendoArchivos(true);
        for (const archivo of archivosParaSubir) {
          await archivosService.uploadArchivoCliente(cliente.id, archivo);
        }
        setSubiendoArchivos(false);
      }

      navigate('/clientes');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tipoId' || name === 'nacionalidadId' ? parseInt(value) : value,
    }));
  };

  const handleVisitaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVisitaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAgregarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = e.target.files;
    if (archivos && archivos.length > 0) {
      const nuevosArchivos = Array.from(archivos);
      setArchivosParaSubir(prev => [...prev, ...nuevosArchivos]);
    }
    e.target.value = ''; // Reset input
  };

  const handleEliminarArchivo = (index: number) => {
    setArchivosParaSubir(prev => prev.filter((_, i) => i !== index));
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clientes')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Cliente' : 'Recepción de Cliente / Visitante'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Actualizar información del cliente' : 'Registrar un nuevo cliente o visitante'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de Identificación</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Identificación *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  onBlur={!isEdit ? handleBuscarCedula : undefined}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000-0000000-0"
                  required
                  maxLength={50}
                />
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleBuscarCedula}
                    disabled={searchingCedula}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {searchingCedula ? 'Buscando...' : 'Verificar'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Identificación *
              </label>
              <select
                name="tipoIdentificacion"
                value={formData.tipoIdentificacion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Cedula">Cédula</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="RNC">RNC</option>
                <option value="ActaNacimiento">Acta de Nacimiento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nacionalidad *
              </label>
              <select
                name="nacionalidadId"
                value={formData.nacionalidadId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccione una nacionalidad</option>
                {nacionalidades.map((nac) => (
                  <option key={nac.id} value={nac.id}>
                    {nac.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <select
              name="tipoId"
              value={formData.tipoId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un tipo</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos Personales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="NOMBRE(S)"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="APELLIDO(S)"
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seudónimo</label>
              <input
                type="text"
                name="seudonimo"
                value={formData.seudonimo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="SEUDÓNIMO (SI APLICA)"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fallecimiento</label>
              <input
                type="date"
                name="fechaFallecimiento"
                value={formData.fechaFallecimiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dejar en blanco si el cliente está vivo</p>
            </div>
          </div>

        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dirección</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="CALLE, AVENIDA, NÚMERO"
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
              <input
                type="text"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="SECTOR"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Municipio</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="MUNICIPIO"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROVINCIAS_RD.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="809-000-0000"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Móvil</label>
              <input
                type="tel"
                name="movil"
                value={formData.movil}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="829-000-0000"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
                maxLength={100}
              />
            </div>
          </div>
        </div>

        {/* Sección de Documentos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentos del Cliente</h2>
          <p className="text-sm text-gray-600 mb-4">
            Adjunta documentos de identificación del cliente (cédula, pasaporte, RNC, acta de nacimiento)
          </p>

          <div className="space-y-4">
            {/* Input para agregar archivos */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="archivo-upload"
                className="hidden"
                onChange={handleAgregarArchivo}
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="archivo-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Haz clic para seleccionar</span> o arrastra archivos aquí
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPG, PNG hasta 10MB
                </p>
              </label>
            </div>

            {/* Lista de archivos */}
            {archivosParaSubir.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Archivos a subir:</h3>
                {archivosParaSubir.map((archivo, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <svg className="h-8 w-8 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {archivo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(archivo.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarArchivo(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {subiendoArchivos && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Subiendo archivos...</span>
              </div>
            )}
          </div>
        </div>

        {!isEdit && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Datos de Visita</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={incluirVisita}
                  onChange={(e) => setIncluirVisita(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Registrar visita</span>
              </label>
            </div>

            {incluirVisita && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Visita *
                  </label>
                  <select
                    name="tipoVisita"
                    value={visitaData.tipoVisita}
                    onChange={handleVisitaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={incluirVisita}
                  >
                    {TIPOS_VISITA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento a Visitar
                  </label>
                  <select
                    name="departamento"
                    value={visitaData.departamento}
                    onChange={handleVisitaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTAMENTOS.map((depto) => (
                      <option key={depto} value={depto}>
                        {depto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="personaContacto"
                    value={visitaData.personaContacto}
                    onChange={handleVisitaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la persona a visitar"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón de Visita
                  </label>
                  <input
                    type="text"
                    name="razonVisita"
                    value={visitaData.razonVisita}
                    onChange={handleVisitaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Motivo de la visita"
                    maxLength={500}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota / Comentario
                  </label>
                  <textarea
                    name="nota"
                    value={visitaData.nota}
                    onChange={handleVisitaChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comentarios adicionales (opcional)"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t bg-white rounded-lg shadow-md p-6">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isEdit ? 'Actualizar Cliente' : 'Registrar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteFormPage;
