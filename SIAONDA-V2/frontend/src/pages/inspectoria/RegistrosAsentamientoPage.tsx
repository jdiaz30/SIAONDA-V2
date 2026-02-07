import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface FormularioCampo {
  id: number;
  valor: string;
  campo: {
    id: number;
    campo: string;
    etiqueta: string;
    tipo: string;
  };
}

interface SolicitudIRC {
  id: number;
  codigo: string;
  nombreEmpresa: string;
  nombreComercial: string | null;
  rnc: string;
  tipoSolicitud: string;
  fechaRecepcion: string;
  fechaPago: string;
  categoriaIrc: {
    id: number;
    codigo: string;
    nombre: string;
    precio: number;
  };
  estado: {
    id: number;
    nombre: string;
  };
  empresa?: {
    id: number;
    nombreEmpresa: string;
    nombreComercial: string | null;
    rnc: string;
    tipoPersona: string;
    nombrePropietario: string | null;
    cedulaPropietario: string | null;
    personaContacto: string | null;
    descripcionActividades: string;
    direccion: string;
    sector: string | null;
    telefono: string | null;
    telefonoSecundario: string | null;
    correoElectronico: string | null;
    paginaWeb: string | null;
    cantidadEmpleados: number | null;
    fechaConstitucion: string | null;
    provincia: {
      id: number;
      nombre: string;
    };
    consejoAdministracion?: any[];
    principalesClientes?: any[];
    documentos?: Array<{
      id: number;
      tipoDocumento: string;
      nombreArchivo: string;
      rutaArchivo: string;
      tamano: number;
      mimeType: string;
      cargadoEn: string;
    }>;
  } | null;
  formulario: {
    id: number;
    codigo: string;
    productos?: {
      campos?: FormularioCampo[];
    }[];
  } | null;
  factura: {
    id: number;
    codigo: string;
    ncf: string | null;
  } | null;
  numeroRegistro: string | null;
  numeroLibro: string | null;
  numeroHoja: string | null;
}

interface ModalAsentarProps {
  solicitud: SolicitudIRC | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModalDevolverProps {
  solicitud: SolicitudIRC | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModalFormularioProps {
  solicitud: SolicitudIRC | null;
  onClose: () => void;
}

const ModalAsentar = ({ solicitud, onClose, onSuccess }: ModalAsentarProps) => {
  const [numeroLibro, setNumeroLibro] = useState('');
  const [numeroHoja, setNumeroHoja] = useState('');
  const [loading, setLoading] = useState(false);

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroLibro.trim() || !numeroHoja.trim()) {
      alert('El número de libro y número de hoja son requeridos');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/inspectoria/solicitudes/${solicitud.id}/asentar`, {
        numeroLibro: numeroLibro.trim(),
        numeroHoja: numeroHoja.trim()
      });

      const numeroRegistro = solicitud.codigo;

      alert(`Registro asentado exitosamente\n\nCódigo de Solicitud: ${numeroRegistro}\nLibro: ${numeroLibro}\nHoja: ${numeroHoja}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error al registrar asiento: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Asentar Solicitud</h2>
              <p className="text-sm text-gray-600 mt-1">
                Ingrese el número de asiento del libro físico
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {/* Información de la Solicitud */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Solicitud</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Código:</span>
                <span className="ml-2 text-blue-900">{solicitud.codigo}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Tipo:</span>
                <span className="ml-2 text-blue-900">{solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Registro Nuevo' : 'Renovación'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700 font-medium">Empresa:</span>
                <span className="ml-2 text-blue-900">{solicitud.nombreEmpresa}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">RNC:</span>
                <span className="ml-2 text-blue-900">{solicitud.rnc}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Categoría:</span>
                <span className="ml-2 text-blue-900">{solicitud.categoriaIrc.codigo} - {solicitud.categoriaIrc.nombre}</span>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Código de Solicitud IRC:</strong> <code className="bg-white px-2 py-1 rounded">{solicitud.codigo}</code>
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Este código identifica la solicitud IRC y aparecerá en el certificado
            </p>
          </div>

          {/* Formulario de Asentamiento */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Libro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroLibro}
                onChange={(e) => setNumeroLibro(e.target.value)}
                placeholder="Ej: 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Número del libro físico donde se está registrando
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Hoja <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroHoja}
                onChange={(e) => setNumeroHoja(e.target.value)}
                placeholder="Ej: 145"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Número de la hoja del libro donde se asienta
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Asiento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ModalDevolver = ({ solicitud, onClose, onSuccess }: ModalDevolverProps) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivo.trim()) {
      alert('Debe especificar el motivo de la devolución');
      return;
    }

    if (!confirm('¿Está seguro de devolver esta solicitud a AuU? El usuario deberá corregir los errores indicados.')) {
      return;
    }

    try {
      setLoading(true);
      await api.put(`/inspectoria/solicitudes/${solicitud.id}/devolver`, {
        motivo: motivo.trim()
      });

      alert('✅ Solicitud devuelta a AuU exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('❌ Error al devolver solicitud: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-red-900">Devolver a AuU</h2>
              <p className="text-sm text-gray-600 mt-1">
                Devolver solicitud para correcciones
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {/* Información de la Solicitud */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">Información de la Solicitud</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-red-700 font-medium">Código:</span>
                <span className="ml-2 text-red-900">{solicitud.codigo}</span>
              </div>
              <div className="col-span-2">
                <span className="text-red-700 font-medium">Empresa:</span>
                <span className="ml-2 text-red-900">{solicitud.nombreEmpresa}</span>
              </div>
            </div>
          </div>

          {/* Formulario de Devolución */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Devolución <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describa detalladamente los errores encontrados o correcciones necesarias..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                rows={5}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sea específico para que AuU pueda corregir rápidamente
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> La solicitud será devuelta a AuU para correcciones.
                No será necesario un nuevo pago a menos que cambie la categoría IRC con diferente precio.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                disabled={loading}
              >
                {loading ? 'Devolviendo...' : 'Devolver a AuU'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ModalFormulario = ({ solicitud, onClose }: ModalFormularioProps) => {
  if (!solicitud) return null;
  if (!solicitud.empresa) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <p className="text-center text-gray-600">No hay datos de empresa disponibles</p>
          <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Formulario IRC Completo</h2>
              <p className="text-sm text-gray-600 mt-1">
                Código: {solicitud.codigo} - {solicitud.nombreEmpresa}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Información de la Solicitud */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Código Solicitud:</span>
                <span className="ml-2 text-blue-900">{solicitud.codigo}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Tipo:</span>
                <span className="ml-2 text-blue-900">{solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Registro Nuevo' : 'Renovación'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Categoría IRC:</span>
                <span className="ml-2 text-blue-900">{solicitud.categoriaIrc.codigo} - {solicitud.categoriaIrc.nombre}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Precio:</span>
                <span className="ml-2 text-blue-900">RD$ {solicitud.categoriaIrc.precio.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">RNC:</span>
                <span className="ml-2 text-blue-900">{solicitud.rnc}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Tipo:</span>
                <span className="ml-2 text-blue-900">{solicitud.tipoSolicitud}</span>
              </div>
            </div>
          </div>

          {/* Datos de la Empresa IRC */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b-2 border-gray-200 pb-2">
              Datos de la Empresa IRC
            </h3>

            <div className="space-y-6">
                {/* Información General de la Empresa */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                    Información General
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Nombre Empresa</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.nombreEmpresa}</div>
                    </div>
                    {solicitud.empresa.nombreComercial && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Nombre Comercial</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.nombreComercial}</div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">RNC</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.rnc}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tipo de Persona</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.tipoPersona === 'MORAL' ? 'Persona Moral' : 'Persona Física'}</div>
                    </div>
                    {solicitud.empresa.nombrePropietario && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Propietario</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.nombrePropietario}</div>
                      </div>
                    )}
                    {solicitud.empresa.cedulaPropietario && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cédula Propietario</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.cedulaPropietario}</div>
                      </div>
                    )}
                    {solicitud.empresa.personaContacto && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Persona de Contacto</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.personaContacto}</div>
                      </div>
                    )}
                    {solicitud.empresa.cantidadEmpleados && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cantidad de Empleados</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.cantidadEmpleados}</div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-gray-200 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Descripción de Actividades</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.descripcionActividades}</div>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                    Ubicación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Dirección</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.direccion}</div>
                    </div>
                    {solicitud.empresa.sector && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Sector</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.sector}</div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Provincia</label>
                      <div className="text-sm text-gray-900">{solicitud.empresa.provincia.nombre}</div>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                    Información de Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {solicitud.empresa.telefono && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Teléfono</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.telefono}</div>
                      </div>
                    )}
                    {solicitud.empresa.telefonoSecundario && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Teléfono Secundario</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.telefonoSecundario}</div>
                      </div>
                    )}
                    {solicitud.empresa.correoElectronico && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.correoElectronico}</div>
                      </div>
                    )}
                    {solicitud.empresa.paginaWeb && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Página Web</label>
                        <div className="text-sm text-gray-900">{solicitud.empresa.paginaWeb}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consejo de Administración */}
                {solicitud.empresa.consejoAdministracion && solicitud.empresa.consejoAdministracion.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                      Consejo de Administración
                    </h4>
                    <div className="space-y-3">
                      {solicitud.empresa.consejoAdministracion.map((miembro: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="font-semibold text-gray-900">{miembro.cargo}</div>
                          <div className="text-sm text-gray-700">{miembro.nombreCompleto}</div>
                          {miembro.cedula && <div className="text-xs text-gray-600">Cédula: {miembro.cedula}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Principales Clientes */}
                {solicitud.empresa.principalesClientes && solicitud.empresa.principalesClientes.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                      Principales Clientes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {solicitud.empresa.principalesClientes.map((cliente: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-sm text-gray-900">{cliente.nombreCliente}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documentos de Soporte */}
                {solicitud.empresa.documentos && solicitud.empresa.documentos.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                      Documentos de Soporte
                    </h4>
                    <div className="space-y-3">
                      {solicitud.empresa.documentos.map((documento: any) => (
                        <div key={documento.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-semibold text-gray-900">{documento.nombreArchivo}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Tipo:</span> {documento.tipoDocumento}
                                </div>
                                <div>
                                  <span className="font-medium">Tamaño:</span> {(documento.tamano / 1024).toFixed(2)} KB
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium">Cargado:</span> {new Date(documento.cargadoEn).toLocaleString('es-DO')}
                                </div>
                              </div>
                            </div>
                            <a
                              href={`http://localhost:3000${documento.rutaArchivo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Botón Cerrar */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RegistrosAsentamientoPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudIRC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudIRC | null>(null);
  const [modalAbierto, setModalAbierto] = useState<'asentar' | 'devolver' | 'formulario' | null>(null);

  useEffect(() => {
    cargarSolicitudes();
  }, [page, search]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
        search,
        estadoId: 3 // PAGADA
      };

      const response = await api.get('/inspectoria/solicitudes', { params });

      setSolicitudes(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error cargando solicitudes:', error);
      alert('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    cargarSolicitudes();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registros para Asentamiento</h1>
          <p className="text-gray-600 mt-1">
            Revise y registre los números de asiento del libro físico
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleBuscar} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, RNC o nombre de empresa..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay solicitudes pendientes de asentamiento
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa / RNC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría IRC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{solicitud.codigo}</div>
                        <div className="text-xs text-gray-500">
                          {solicitud.tipoSolicitud === 'REGISTRO_NUEVO' ? 'Registro Nuevo' : 'Renovación'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{solicitud.nombreEmpresa}</div>
                        <div className="text-xs text-gray-500">RNC: {solicitud.rnc}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{solicitud.categoriaIrc.codigo}</div>
                        <div className="text-xs text-gray-500">{solicitud.categoriaIrc.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{solicitud.factura?.codigo || 'N/A'}</div>
                        {solicitud.factura?.ncf && (
                          <div className="text-xs text-gray-500">NCF: {solicitud.factura.ncf}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(solicitud.fechaPago).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(solicitud);
                              setModalAbierto('formulario');
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            Ver Formulario
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSolicitudSeleccionada(solicitud);
                                setModalAbierto('asentar');
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Asentar
                            </button>
                            <button
                              onClick={() => {
                                setSolicitudSeleccionada(solicitud);
                                setModalAbierto('devolver');
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Devolver
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {modalAbierto === 'asentar' && solicitudSeleccionada && (
        <ModalAsentar
          solicitud={solicitudSeleccionada}
          onClose={() => {
            setSolicitudSeleccionada(null);
            setModalAbierto(null);
          }}
          onSuccess={cargarSolicitudes}
        />
      )}

      {modalAbierto === 'devolver' && solicitudSeleccionada && (
        <ModalDevolver
          solicitud={solicitudSeleccionada}
          onClose={() => {
            setSolicitudSeleccionada(null);
            setModalAbierto(null);
          }}
          onSuccess={cargarSolicitudes}
        />
      )}

      {modalAbierto === 'formulario' && solicitudSeleccionada && (
        <ModalFormulario
          solicitud={solicitudSeleccionada}
          onClose={() => {
            setSolicitudSeleccionada(null);
            setModalAbierto(null);
          }}
        />
      )}
    </div>
  );
}
