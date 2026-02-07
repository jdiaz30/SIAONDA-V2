import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiSave, FiArrowLeft } from 'react-icons/fi';
import { obtenerSolicitudPorId, SolicitudRegistro, obtenerTodosCatalogos, Catalogos } from '../../services/inspectoriaService';
import { api } from '../../services/api';

export default function CorregirSolicitudIRCPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudRegistro | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data completo de la empresa
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

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar catálogos y solicitud en paralelo
      const [catalogosData, solicitudData] = await Promise.all([
        obtenerTodosCatalogos(),
        obtenerSolicitudPorId(parseInt(id!))
      ]);

      setCatalogos(catalogosData);
      setSolicitud(solicitudData);

      // Precargar datos de la empresa
      if (solicitudData.empresa) {
        const empresa = solicitudData.empresa;

        // Parsear JSON del campo comentario que contiene datos adicionales
        let datosComentario: any = {};
        try {
          datosComentario = JSON.parse(empresa.comentario || '{}');
        } catch {
          // Si no es JSON válido, ignorar
        }

        // Cargar consejo de administración desde las relaciones
        const consejoAdministracion = (empresa as any).consejoAdministracion || [];

        // Cargar principales clientes desde las relaciones
        const principalesClientes = ((empresa as any).principalesClientes || []).map((c: any) => c.nombreCliente);

        setFormData({
          nombreEmpresa: empresa.nombreEmpresa || '',
          nombreComercial: empresa.nombreComercial || '',
          rnc: empresa.rnc || '',
          categoriaIrcId: empresa.categoriaIrcId || 0,
          tipoPersona: empresa.tipoPersona || 'MORAL',
          nombrePropietario: empresa.nombrePropietario || '',
          cedulaPropietario: empresa.cedulaPropietario || '',
          descripcionActividades: empresa.descripcionActividades || '',
          direccion: empresa.direccion || '',
          provinciaId: empresa.provinciaId || 0,
          sector: datosComentario.sector || '',
          telefono: empresa.telefono || '',
          telefonoSecundario: datosComentario.telefonoSecundario || '',
          telefonoAdicional: datosComentario.telefonoAdicional || '',
          celular: datosComentario.celular || '',
          correoElectronico: empresa.email || '',
          paginaWeb: empresa.paginaWeb || '',
          cantidadEmpleados: datosComentario.cantidadEmpleados || 0,
          fechaConstitucion: datosComentario.fechaConstitucion || '',
          fechaInicioOperaciones: datosComentario.fechaInicioOperaciones || '',
          tipoNegocio: datosComentario.tipoNegocio || '',
          personaContacto: empresa.personaContacto || '',
          fax: empresa.fax || '',
          observaciones: datosComentario.observaciones || '',
          consejoAdministracion,
          principalesClientes,
        });
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCorregirYReenviar = async () => {
    if (!solicitud) return;

    if (!window.confirm('¿Confirma que desea corregir y reenviar esta solicitud a Inspectoría?')) {
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      // Enviar TODOS los datos corregidos
      await api.post(`/aau/solicitudes-irc/${solicitud.id}/corregir-reenviar`, {
        datosCorregidos: formData,
        comentarioCorreccion: `Solicitud corregida desde AAU el ${new Date().toLocaleString('es-DO')}`,
      });

      alert('✅ Solicitud corregida y reenviada exitosamente a Inspectoría');
      navigate('/aau/formularios/devueltos');
    } catch (err: any) {
      console.error('Error al corregir solicitud:', err);
      setError(err.response?.data?.message || 'Error al corregir la solicitud');
    } finally {
      setGuardando(false);
    }
  };

  if (loading || !catalogos) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Solicitud no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Alerta */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg p-6">
        <div className="flex items-start">
          <FiAlertTriangle className="text-4xl text-red-600 mr-4 animate-pulse" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Corregir Solicitud IRC Devuelta
            </h1>
            <p className="text-red-700 font-semibold">
              {solicitud.codigo} - {solicitud.empresa?.nombreEmpresa || solicitud.nombreEmpresa}
            </p>
          </div>
        </div>
      </div>

      {/* Botón Volver */}
      <button
        onClick={() => navigate('/aau/formularios/devueltos')}
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        <FiArrowLeft /> Volver a Devueltos
      </button>

      {/* Motivo de Devolución */}
      {solicitud.mensajeDevolucion && (
        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
            <FiAlertTriangle className="text-2xl" />
            MOTIVO DE DEVOLUCIÓN
          </h3>
          <p className="text-red-800 text-base leading-relaxed whitespace-pre-wrap">
            {solicitud.mensajeDevolucion}
          </p>
          {solicitud.fechaDevolucion && (
            <p className="text-sm text-red-600 mt-3">
              Devuelto el: {new Date(solicitud.fechaDevolucion).toLocaleString('es-DO')}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Formulario Completo - TODOS LOS CAMPOS */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Corregir Datos de la Empresa</h3>

        {/* Datos Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa *</label>
            <input
              type="text"
              name="nombreEmpresa"
              value={formData.nombreEmpresa}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Comercial</label>
            <input
              type="text"
              name="nombreComercial"
              value={formData.nombreComercial}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RNC *</label>
            <input
              type="text"
              name="rnc"
              value={formData.rnc}
              onChange={handleChange}
              placeholder="XXX-XXXXX-X"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Formato: XXX-XXXXX-X</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría IRC * (No editable)</label>
            <select
              disabled
              value={formData.categoriaIrcId}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            >
              <option value={formData.categoriaIrcId}>{solicitud.categoriaIrc?.nombre}</option>
            </select>
          </div>
        </div>

        {/* Persona Física/Moral */}
        {formData.tipoPersona === 'FISICA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Propietario *</label>
              <input
                type="text"
                name="nombrePropietario"
                value={formData.nombrePropietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cédula del Propietario *</label>
              <input
                type="text"
                name="cedulaPropietario"
                value={formData.cedulaPropietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Dirección y Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Física *</label>
            <textarea
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
            <select
              name="provinciaId"
              value={formData.provinciaId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value={0}>Seleccionar...</option>
              {catalogos.provincias.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <input
              type="text"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Principal *</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Secundario</label>
            <input
              type="tel"
              name="telefonoSecundario"
              value={formData.telefonoSecundario}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico *</label>
            <input
              type="email"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Página Web</label>
            <input
              type="url"
              name="paginaWeb"
              value={formData.paginaWeb}
              onChange={handleChange}
              placeholder="https://"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Empleados</label>
            <input
              type="number"
              name="cantidadEmpleados"
              value={formData.cantidadEmpleados}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Constitución</label>
            <input
              type="date"
              name="fechaConstitucion"
              value={formData.fechaConstitucion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Descripción de Actividades */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción de Actividades *</label>
          <textarea
            name="descripcionActividades"
            value={formData.descripcionActividades}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describa las actividades comerciales de la empresa..."
            required
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones / Comentarios</label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            placeholder="Agregue cualquier comentario adicional sobre las correcciones realizadas..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => navigate('/aau/formularios/devueltos')}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleCorregirYReenviar}
          disabled={guardando}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          {guardando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <FiSave className="text-xl" />
              Corregir y Reenviar a Inspectoría
            </>
          )}
        </button>
      </div>

      {/* Información Importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Al guardar, la solicitud será reenviada automáticamente a Inspectoría</li>
          <li>El estado cambiará de DEVUELTA a EN_REVISION</li>
          <li>No se generará una nueva factura (ya fue pagada)</li>
          <li>Inspectoría revisará nuevamente los datos corregidos</li>
        </ul>
      </div>
    </div>
  );
}
