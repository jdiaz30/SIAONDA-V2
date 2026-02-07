import { useState } from 'react';
import { FiX, FiAlertTriangle, FiCheckCircle, FiFileText, FiUser } from 'react-icons/fi';

interface Archivo {
  id: number;
  nombre?: string;
  nombreOriginal?: string;
  ruta: string;
  tipo?: string;
  mimeType?: string;
  tamano: number;
}

interface Cliente {
  cliente: {
    nombrecompleto: string;
    identificacion: string;
    telefono?: string;
    correo?: string;
    archivos?: Archivo[];
  };
  tipoRelacion: string;
}

interface CampoFormulario {
  campo: {
    id: number;
    campo: string;
    titulo: string;
  };
  valor: string;
}

interface FormularioProducto {
  producto: {
    nombre: string;
    categoria: string;
  };
  formulario: {
    codigo: string;
    clientes: Cliente[];
  };
  campos?: CampoFormulario[];
  archivos?: Archivo[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  registro: {
    id: number;
    numeroRegistro: string;
    tituloObra: string;
    tipoObra: string;
    formularioProducto: FormularioProducto;
    estado: {
      nombre: string;
    };
  };
  onDevolver: (comentario: string) => Promise<void>;
  puedeDevolver: boolean;
}

export default function ModalRevisionDetallada({
  isOpen,
  onClose,
  registro,
  onDevolver,
  puedeDevolver
}: Props) {
  const [mostrarDevolucion, setMostrarDevolucion] = useState(false);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleDevolver = async () => {
    if (!comentario.trim()) {
      alert('Debe ingresar un comentario para devolver');
      return;
    }

    setEnviando(true);
    try {
      await onDevolver(comentario);
      setComentario('');
      setMostrarDevolucion(false);
      onClose();
    } catch (error) {
      console.error('Error al devolver:', error);
      alert('Hubo un error al devolver el registro');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Revisión Detallada</h2>
            <p className="text-blue-100 text-sm mt-1">
              {registro.numeroRegistro} - {registro.tituloObra}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              Información Básica
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-500">Título de la Obra</label>
                <p className="text-base font-bold text-gray-900">{registro.tituloObra}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Formulario</label>
                <p className="text-sm font-semibold text-gray-900">{registro.formularioProducto.formulario.codigo}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Tipo de Obra</label>
                <p className="text-sm font-semibold text-gray-900">{registro.tipoObra}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Categoría</label>
                <p className="text-sm font-semibold text-gray-900">{registro.formularioProducto.producto.categoria}</p>
              </div>
            </div>
          </div>

          {/* Titulares/Autores */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Titulares y Autores ({registro.formularioProducto.formulario.clientes.length})
            </h3>
            <div className="space-y-3">
              {registro.formularioProducto.formulario.clientes.map((rel, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Nombre Completo</label>
                      <p className="text-sm font-semibold text-gray-900">{rel.cliente.nombrecompleto}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Rol</label>
                      <p className="text-sm text-gray-900">{rel.tipoRelacion}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Identificación</label>
                      <p className="text-sm text-gray-900">{rel.cliente.identificacion}</p>
                    </div>
                    {rel.cliente.telefono && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Teléfono</label>
                        <p className="text-sm text-gray-900">{rel.cliente.telefono}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campos del Formulario */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              Campos del Formulario ({registro.formularioProducto.campos.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {registro.formularioProducto.campos.map((campo) => (
                <div
                  key={campo.campo.id}
                  className={`
                    ${campo.valor && campo.valor.length > 100 ? 'col-span-2' : ''}
                    bg-gray-50 p-3 rounded-lg border border-gray-200
                  `}
                >
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    {campo.campo.titulo}
                  </label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {campo.valor || <span className="text-gray-400 italic">No especificado</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Archivos Adjuntos */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              Archivos Adjuntos
            </h3>

            {/* Documentos del Cliente */}
            {registro.formularioProducto.formulario.clientes.some(c => c.cliente.archivos && c.cliente.archivos.length > 0) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos del Cliente</h4>
                <div className="space-y-2">
                  {registro.formularioProducto.formulario.clientes.map((relacion, idx) =>
                    relacion.cliente.archivos?.map((archivo) => (
                      <a
                        key={`${idx}-${archivo.id}`}
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <FiFileText className="text-blue-600 text-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {archivo.nombre || archivo.nombreOriginal}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(archivo.tamano / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Ver</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Soporte Material de la Obra */}
            {registro.formularioProducto.archivos && registro.formularioProducto.archivos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Soporte Material de la Obra</h4>
                <div className="space-y-2">
                  {registro.formularioProducto.archivos.map((archivo) => (
                    <a
                      key={archivo.id}
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${archivo.ruta}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <FiFileText className="text-blue-600 text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {archivo.nombreOriginal || archivo.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(archivo.tamano / 1024).toFixed(2)} KB
                          {archivo.mimeType && ` • ${archivo.mimeType}`}
                        </p>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Ver</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje si no hay archivos */}
            {!registro.formularioProducto.archivos?.length &&
             !registro.formularioProducto.formulario.clientes.some(c => c.cliente.archivos?.length) && (
              <p className="text-gray-500 text-sm text-center py-4">No hay archivos adjuntos</p>
            )}
          </div>

          {/* Sección de Devolución */}
          {puedeDevolver && (
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
              <div className="flex items-start gap-3 mb-3">
                <FiAlertTriangle className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-1">Encontraste un error o defecto?</h3>
                  <p className="text-sm text-yellow-800">
                    Si encuentras información incorrecta o incompleta, puedes devolver este registro para que sea corregido.
                  </p>
                </div>
              </div>

              {!mostrarDevolucion ? (
                <button
                  onClick={() => setMostrarDevolucion(true)}
                  className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FiAlertTriangle />
                  Devolver para Corrección
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de Devolución <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Describe detalladamente el error o defecto encontrado..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este comentario será visible para el personal de AAU que deberá corregir el registro.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMostrarDevolucion(false)}
                      disabled={enviando}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDevolver}
                      disabled={!comentario.trim() || enviando}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                    >
                      {enviando ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Devolviendo...
                        </>
                      ) : (
                        <>
                          <FiAlertTriangle />
                          Confirmar Devolución
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCheckCircle className="text-green-600" />
            <span>Estado: <strong>{registro.estado.nombre}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
