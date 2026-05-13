import { useState, useEffect } from 'react';
import { FiX, FiFile, FiDownload, FiAlertCircle, FiSend } from 'react-icons/fi';
import { getRegistroDetalle, devolverAAAU } from '../../services/registroService';
import { formulariosService } from '../../services/formulariosService';

interface DetalleFormularioModalProps {
  registroId: number;
  onClose: () => void;
  onDevuelto?: () => void;
  mostrarBotonDevolver?: boolean;
}

export default function DetalleFormularioModal({
  registroId,
  onClose,
  onDevuelto,
  mostrarBotonDevolver = false
}: DetalleFormularioModalProps) {
  const [loading, setLoading] = useState(true);
  const [registro, setRegistro] = useState<any>(null);
  const [datosFormulario, setDatosFormulario] = useState<any>(null);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [mostrarDevolucion, setMostrarDevolucion] = useState(false);
  const [mensajeDevolucion, setMensajeDevolucion] = useState('');
  const [enviandoDevolucion, setEnviandoDevolucion] = useState(false);
  const [obrasProduccion, setObrasProduccion] = useState<any[]>([]);
  const [formularioCompleto, setFormularioCompleto] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, [registroId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Obtener detalle del registro
      const registroData = await getRegistroDetalle(registroId);
      setRegistro(registroData);

      // Determinar qué formulario cargar: si es producción, cargar el padre
      const formularioActual = registroData.formularioProducto.formulario;
      const formularioIdACargar = formularioActual.produccionPadreId
        ? formularioActual.produccionPadreId  // Si es hijo, cargar el padre
        : formularioActual.id;                 // Si es padre o no es producción, cargar el mismo

      console.log('Formulario actual:', formularioActual.id, 'produccionPadreId:', formularioActual.produccionPadreId);
      console.log('Cargando formulario:', formularioIdACargar);

      // Obtener datos completos del formulario incluyendo archivos
      const formularioData = await formulariosService.getFormulario(formularioIdACargar);
      setFormularioCompleto(formularioData);

      console.log('========== DEBUG PRODUCCION ==========');
      console.log('Formulario completo:', formularioData);
      console.log('Productos del formulario:', formularioData.productos);
      console.log('Es producción (esProduccion)?:', formularioData.esProduccion);
      console.log('Tiene producción padre?:', formularioData.produccionPadreId);

      // Detectar si es producción
      const esProduccion = formularioData.esProduccion || formularioData.produccionPadreId !== null;
      console.log('¿Se detectó como producción?:', esProduccion);

      // Si es producción, el backend ya nos devolvió todos los productos (padre + hijos)
      if (esProduccion) {
        console.log('Total de productos recibidos:', formularioData.productos?.length || 0);

        // Ver categorías de todos los productos
        formularioData.productos?.forEach((prod: any, idx: number) => {
          console.log(`Producto ${idx + 1}:`, {
            id: prod.id,
            nombre: prod.producto.nombre,
            categoria: prod.producto.categoria,
            codigo: prod.producto.codigo,
            camposCount: prod.campos?.length || 0
          });
        });

        // Filtrar: excluir solo el producto del formulario padre (el primero, que tiene 0 campos)
        const obrasData = formularioData.productos?.filter((prod: any, idx: number) => {
          // El primer producto (idx 0) es del formulario padre y tiene camposCount 0
          const esObra = idx !== 0 && prod.campos && prod.campos.length > 0;
          console.log(`¿Producto ${idx + 1} "${prod.producto.nombre}" es obra?:`, esObra, `(tiene ${prod.campos?.length || 0} campos)`);
          return esObra;
        }).map((prod: any) => {
          const camposObra: any = {};
          if (prod.campos && Array.isArray(prod.campos)) {
            prod.campos.forEach((campo: any) => {
              camposObra[campo.campo.titulo || campo.campo.nombre] = campo.valor;
            });
          }
          return {
            id: prod.id,
            codigo: prod.producto.codigo,
            nombre: prod.producto.nombre,
            campos: camposObra,
            archivos: prod.archivos || []
          };
        }) || [];

        console.log('Obras filtradas (resultado final):', obrasData);
        console.log('Cantidad de obras a mostrar:', obrasData.length);
        setObrasProduccion(obrasData);
      }
      console.log('========== FIN DEBUG ==========');

      // Extraer datos del formulario según el producto actual
      const producto = registroData.formularioProducto;
      const datosProducto = formularioData.productos?.find(
        (p: any) => p.id === producto.id
      );

      console.log('Producto encontrado:', datosProducto);
      console.log('Archivos del producto:', datosProducto?.archivos);
      console.log('Campos del producto:', datosProducto?.campos);

      // Transformar campos en objeto para mostrar
      const camposFormateados: any = {};
      if (datosProducto?.campos && Array.isArray(datosProducto.campos)) {
        datosProducto.campos.forEach((campo: any) => {
          camposFormateados[campo.campo.titulo || campo.campo.nombre] = campo.valor;
        });
      }
      console.log('Campos formateados:', camposFormateados);

      // Recolectar TODOS los archivos del formulario (de todos los productos)
      const todosLosArchivos: any[] = [];

      // 1. Archivos de los productos (soporte material de obras)
      formularioData.productos?.forEach((prod: any) => {
        if (prod.archivos && Array.isArray(prod.archivos)) {
          todosLosArchivos.push(...prod.archivos.map((arch: any) => ({
            ...arch,
            tipoArchivo: 'Soporte Material de Obra'
          })));
        }
      });

      // 2. Archivos de los clientes (documentos de identificación)
      formularioData.clientes?.forEach((relacion: any) => {
        if (relacion.cliente?.archivos && Array.isArray(relacion.cliente.archivos)) {
          todosLosArchivos.push(...relacion.cliente.archivos.map((arch: any) => ({
            id: `cliente-${arch.id}`,
            nombreOriginal: arch.nombre,
            ruta: arch.ruta,
            mimeType: arch.tipo,
            tamano: arch.tamano,
            tipoArchivo: `Documento de ${relacion.cliente.nombrecompleto}`
          })));
        }
      });

      console.log('Todos los archivos del formulario:', todosLosArchivos);

      // DEBUG: Mostrar cada ruta de archivo
      todosLosArchivos.forEach((arch, index) => {
        console.log(`[DEBUG] Archivo ${index}: ruta="${arch.ruta}"`);
      });

      setDatosFormulario(camposFormateados);
      setArchivos(todosLosArchivos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los detalles del formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleDevolver = async () => {
    if (!mensajeDevolucion.trim()) {
      alert('Debe ingresar un mensaje explicando el motivo de la devolución');
      return;
    }

    try {
      setEnviandoDevolucion(true);
      console.log('Devolviendo registro:', registroId, 'con mensaje:', mensajeDevolucion);
      await devolverAAAU(registroId, mensajeDevolucion);
      alert('Formulario devuelto a AAU exitosamente');
      onDevuelto?.();
      onClose();
    } catch (error: any) {
      console.error('Error al devolver:', error);
      const mensaje = error?.response?.data?.error || error?.message || 'Error desconocido al devolver el formulario';
      alert(`Error al devolver el formulario: ${mensaje}`);
    } finally {
      setEnviandoDevolucion(false);
    }
  };

  const descargarArchivo = (ruta: string, nombreArchivo: string) => {
    // Construir URL absoluta para evitar problemas con rutas relativas
    // Nginx hace proxy de /uploads/ a backend:3000/uploads/
    console.log('[DEBUG descargarArchivo] Ruta recibida:', ruta);
    console.log('[DEBUG descargarArchivo] window.location:', window.location.href);

    const rutaLimpia = ruta.startsWith('/') ? ruta : `/${ruta}`;
    console.log('[DEBUG descargarArchivo] Ruta limpia:', rutaLimpia);

    const rutaSinApi = rutaLimpia.replace('/api/', '/');
    console.log('[DEBUG descargarArchivo] Ruta sin /api/:', rutaSinApi);

    const url = `${window.location.protocol}//${window.location.host}${rutaSinApi}`;
    console.log('[DEBUG descargarArchivo] URL final construida:', url);

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!registro) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Detalles del Formulario
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Registro: {registro.numeroRegistro}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información del Registro */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Información del Registro</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Número:</span>
                <p className="text-blue-900 font-mono">{registro.numeroRegistro}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Libro/Hoja:</span>
                <p className="text-blue-900">
                  {registro.libroNumero}/{registro.hojaNumero}
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Estado:</span>
                <p className="text-blue-900">{registro.estado.nombre}</p>
              </div>
            </div>
          </div>

          {/* Información de la Obra */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Datos de la Obra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-700 font-medium">Título:</span>
                <p className="text-gray-900">
                  {obrasProduccion.length > 0
                    ? (formularioCompleto.tituloProduccion || 'Producción')
                    : registro.tituloObra}
                </p>
              </div>
              <div>
                <span className="text-gray-700 font-medium">Tipo:</span>
                <p className="text-gray-900">
                  {obrasProduccion.length > 0 && obrasProduccion[0]
                    ? `Producción de ${obrasProduccion[0].nombre.replace(/\s*\(\d+-\d+\)\s*$/, '')}`
                    : registro.tipoObra}
                </p>
              </div>
              {registro.formularioProducto.subcategoria && (
                <div>
                  <span className="text-gray-700 font-medium">Subcategoría:</span>
                  <p className="text-gray-900 font-semibold text-blue-600">
                    {registro.formularioProducto.subcategoria}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-700 font-medium">Categoría:</span>
                <p className="text-gray-900">{registro.formularioProducto.producto.categoria}</p>
              </div>
              <div>
                <span className="text-gray-700 font-medium">Código Producto:</span>
                <p className="text-gray-900">{registro.formularioProducto.producto.codigo}</p>
              </div>
            </div>
          </div>

          {/* Titulares - Mover ANTES de las obras */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Titulares/Autores</h3>
            <div className="space-y-2">
              {registro.formularioProducto.formulario.clientes.map((rel: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">{rel.cliente.nombrecompleto}</p>
                    <p className="text-sm text-gray-600">
                      {rel.cliente.identificacion} - {rel.tipoRelacion}
                    </p>
                  </div>
                  {rel.cliente.telefono && (
                    <p className="text-sm text-gray-600">{rel.cliente.telefono}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Obras de la Producción */}
          {obrasProduccion.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">
                Obras de la Producción ({obrasProduccion.length})
              </h3>
              <div className="space-y-3">
                {obrasProduccion.map((obra: any, idx: number) => (
                  <div key={obra.id} className="bg-white border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-900">
                        Obra #{idx + 1} - {obra.nombre}
                      </h4>
                      <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                        {obra.codigo}
                      </span>
                    </div>
                    {Object.keys(obra.campos).length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        {Object.entries(obra.campos).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-purple-50 p-2 rounded">
                            <span className="text-purple-700 font-medium block text-xs">{key}:</span>
                            <p className="text-purple-900 text-sm">{String(value || 'N/A')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Archivos de esta obra específica */}
                    {obra.archivos && obra.archivos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <h5 className="text-xs font-semibold text-purple-800 mb-2">
                          Archivos Adjuntos ({obra.archivos.length})
                        </h5>
                        <div className="space-y-1">
                          {obra.archivos.map((archivo: any) => (
                            <div
                              key={archivo.id}
                              className="flex items-center justify-between bg-purple-50 p-2 rounded text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <FiFile className="text-purple-600" size={14} />
                                <span className="text-purple-900">{archivo.nombreOriginal}</span>
                              </div>
                              <button
                                onClick={() => descargarArchivo(archivo.ruta, archivo.nombreOriginal)}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <FiDownload size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Titulares - ELIMINAR esta sección duplicada */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{display: 'none'}}>
            <h3 className="font-semibold text-gray-900 mb-3">Titulares/Autores (DUPLICADO - OCULTO)</h3>
            <div className="space-y-2">
              {registro.formularioProducto.formulario.clientes.map((rel: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">{rel.cliente.nombrecompleto}</p>
                    <p className="text-sm text-gray-600">
                      {rel.cliente.identificacion} - {rel.tipoRelacion}
                    </p>
                  </div>
                  {rel.cliente.telefono && (
                    <p className="text-sm text-gray-600">{rel.cliente.telefono}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Datos Adicionales del Formulario - Solo mostrar si NO es producción */}
          {Object.keys(datosFormulario).length > 0 && obrasProduccion.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Campos del Formulario Llenados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(datosFormulario).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-gray-700 font-medium block mb-1">
                      {key}:
                    </span>
                    <p className="text-gray-900">{String(value || 'N/A')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archivos Adjuntos - Solo mostrar si NO es producción (porque ya se muestran en cada obra) */}
          {archivos.length > 0 && obrasProduccion.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Archivos Adjuntos ({archivos.length})
              </h3>
              <div className="space-y-2">
                {archivos.map((archivo: any) => (
                  <div
                    key={archivo.id}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FiFile className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">{archivo.nombreOriginal}</p>
                        <p className="text-xs text-gray-600">{archivo.tipoArchivo}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => descargarArchivo(archivo.ruta, archivo.nombreOriginal)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <FiDownload size={16} />
                      <span className="text-sm">Descargar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección de Devolución */}
          {mostrarBotonDevolver && mostrarDevolucion && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <FiAlertCircle />
                Devolver a AAU para Corrección
              </h3>
              <textarea
                value={mensajeDevolucion}
                onChange={(e) => setMensajeDevolucion(e.target.value)}
                placeholder="Explique el motivo de la devolución y las correcciones necesarias..."
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDevolver}
                  disabled={enviandoDevolucion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {enviandoDevolucion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Confirmar Devolución
                    </>
                  )}
                </button>
                <button
                  onClick={() => setMostrarDevolucion(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {registro.observaciones && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Observaciones:</span> {registro.observaciones}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {mostrarBotonDevolver && !mostrarDevolucion && (
              <button
                onClick={() => setMostrarDevolucion(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FiAlertCircle />
                Devolver a AAU
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
