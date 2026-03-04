import { useState, useEffect } from 'react';
import { FiFileText, FiUpload, FiLoader } from 'react-icons/fi';
import { api } from '../../services/api';
import CampoDinamico from './CampoDinamico';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
}

interface Props {
  producto: Producto;
  datosIniciales: any;
  onContinuar: (datos: any) => void;
  onVolver: () => void;
}

const FormularioObraStepDinamico = ({ producto, datosIniciales, onContinuar, onVolver }: Props) => {
  const [camposDinamicos, setCamposDinamicos] = useState<any[]>([]);
  const [cargandoCampos, setCargandoCampos] = useState(true);
  const [valoresCampos, setValoresCampos] = useState<Record<string, any>>(datosIniciales?.camposEspecificos || {});
  const [archivos, setArchivos] = useState<File[]>([]);

  // Cargar campos dinámicos del producto
  useEffect(() => {
    const cargarCampos = async () => {
      try {
        setCargandoCampos(true);
        const response = await api.get(`/productos/${producto.id}/campos`);
        setCamposDinamicos(response.data || []);
      } catch (error) {
        console.error('Error cargando campos:', error);
        alert('Error al cargar los campos del formulario');
      } finally {
        setCargandoCampos(false);
      }
    };

    cargarCampos();
  }, [producto.id]);

  const handleCampoChange = (campo: string, valor: any) => {
    // Buscar el campo para obtener su ID
    const campoObj = camposDinamicos.find(c => c.campo === campo);
    const campoKey = campoObj ? `campo_${campoObj.id}` : campo;

    setValoresCampos((prev) => ({
      ...prev,
      [campoKey]: valor,
      [campo]: valor // Mantener también con el nombre original para la lógica condicional
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivos((prev) => [...prev, ...nuevosArchivos]);
    }
  };

  const eliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  // Determinar si un campo debe mostrarse según su grupo
  const esCampoVisible = (campo: any): boolean => {
    if (!campo.grupo) return true;

    // Lógica de campos condicionales
    if (campo.grupo === 'derivada') {
      // Buscar el valor en "indique_si_es" (nuevo) o "caracter_obra" (antiguo)
      const indiqueSiEs = valoresCampos['indique_si_es'];
      const caracterObra = valoresCampos['caracter_obra'];
      const valorCampo = indiqueSiEs || caracterObra;

      if (!valorCampo) return false;
      // Puede ser string simple "Derivada" o con múltiples valores "Originaria|Derivada"
      const valorStr = String(valorCampo);
      return valorStr.includes('Derivada');
    }

    if (campo.grupo === 'publicada') {
      // El campo "publicada" es checkbox, se activa cuando es true
      return valoresCampos['publicada'] === true;
    }

    if (campo.grupo === 'comercial') {
      // Se muestra si el checkbox "grabada_comercialmente" está marcado
      return valoresCampos['grabada_comercialmente'] === true;
    }

    if (campo.grupo === 'tipo_otro') {
      const tipoValue = valoresCampos['tipo_obra'] || valoresCampos['tipo_arte'];
      if (!tipoValue) return false;
      const tipoStr = String(tipoValue);
      return tipoStr === 'Otro' || tipoStr.includes('Otro');
    }

    if (campo.grupo === 'genero_otro') {
      const generoValue = valoresCampos['genero'] || valoresCampos['area_cientifica'];
      if (!generoValue) return false;
      const generoStr = String(generoValue);
      return generoStr === 'Otro' || generoStr === 'Otra' || generoStr.includes('Otro') || generoStr.includes('Otra');
    }

    if (campo.grupo === 'caracter_otro') {
      const caracterValue = valoresCampos['caracter_obra'];
      if (!caracterValue) return false;
      const caracterStr = String(caracterValue);
      return caracterStr.includes('Otra') || caracterStr.includes('Otro');
    }

    return true;
  };

  const handleContinuar = () => {
    // Validar campos requeridos (excluyendo archivos - se manejan aparte)
    const camposRequeridos = camposDinamicos.filter(
      (c) => c.requerido && esCampoVisible(c) && c.tipo.nombre !== 'archivo'
    );

    for (const campo of camposRequeridos) {
      const valor = valoresCampos[campo.campo];
      if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
        alert(`El campo "${campo.titulo}" es obligatorio`);
        return;
      }
    }

    // Nota: Los archivos son opcionales ahora - se suben en "Soporte Material de la Obra"
    // No se valida si hay archivos, el usuario puede continuar sin ellos

    // Crear un mapa de metadata de campos para la revision
    const camposMetadata: Record<string, { titulo: string; tipo: string }> = {};
    camposDinamicos.forEach(campo => {
      const key = campo.campo;
      camposMetadata[key] = {
        titulo: campo.titulo || campo.campo,
        tipo: campo.tipo?.nombre || 'texto'
      };
    });

    onContinuar({
      camposEspecificos: valoresCampos,
      camposMetadata,
      archivos,
    });
  };

  if (cargandoCampos) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <FiFileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Paso 3: Datos de la Obra</h3>
            <p className="text-sm text-blue-800 mb-2">
              Complete la información de la obra <strong>{producto.nombre}</strong>
            </p>
            <p className="text-sm text-blue-700">
              Todos los campos marcados con <span className="text-red-600">*</span> son obligatorios
            </p>
          </div>
        </div>
      </div>

      {/* Información del producto seleccionado */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Tipo de obra seleccionada:</p>
            <p className="font-semibold text-gray-900">
              {producto.codigo} - {producto.nombre}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Monto a pagar:</p>
            <p className="text-xl font-bold text-gray-900">
              RD$ {producto.precio.toLocaleString('es-DO')}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario Dinámico */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Información de la Obra</h2>

        {camposDinamicos.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Este tipo de obra aún no tiene campos específicos definidos.
              Por favor, contacte al administrador del sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Organizar campos por secciones */}
            {(() => {
              // Filtrar campos de tipo archivo y divisor - se manejan por separado
              const camposVisibles = camposDinamicos.filter((campo) =>
                esCampoVisible(campo) && campo.tipo.nombre !== 'archivo' && campo.tipo.nombre !== 'divisor'
              );
              const camposGenerales = camposVisibles.filter(c => c.orden <= 10);
              const camposAdicionales = camposVisibles.filter(c => c.orden > 10);

              return (
                <>
                  {/* Sección: Datos Generales */}
                  {camposGenerales.length > 0 && (
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Datos Generales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {camposGenerales.map((campo) => (
                          <div key={campo.id} className={campo.tipo.nombre === 'texto' && campo.titulo.toLowerCase().includes('descripción') ? 'md:col-span-2' : ''}>
                            <CampoDinamico
                              campo={campo}
                              valor={valoresCampos[campo.campo]}
                              onChange={handleCampoChange}
                              visible={true}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sección: Información Adicional / Obra Derivada */}
                  {camposAdicionales.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {/* Detectar si todos los campos adicionales son de derivada */}
                        {camposAdicionales.every(c => c.grupo === 'derivada')
                          ? 'Información de Obra Derivada'
                          : 'Información Adicional'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {camposAdicionales.map((campo) => (
                          <div key={campo.id} className={campo.tipo.nombre === 'texto' && campo.titulo.toLowerCase().includes('descripción') ? 'md:col-span-2' : ''}>
                            <CampoDinamico
                              campo={campo}
                              valor={valoresCampos[campo.campo]}
                              onChange={handleCampoChange}
                              visible={true}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Soporte Material de la Obra */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">
            Soporte Material de la Obra
          </h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Adjunte todos los archivos relacionados con la obra: partituras, audio, letras, documentos, etc.
        </p>

        <div className="space-y-4">
          {/* Zona de carga */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <label className="cursor-pointer block">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.mp4,.wav,.m4a,.zip,.rar"
              />
              <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Haga clic o arrastre archivos aquí
              </p>
              <p className="text-sm text-gray-500 mb-1">
                Formatos aceptados: PDF, DOC, DOCX, JPG, PNG, MP3, MP4, WAV, M4A, ZIP, RAR
              </p>
              <p className="text-sm text-gray-500">Tamaño máximo por archivo: 50MB</p>
            </label>
          </div>

          {/* Lista de archivos */}
          {archivos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Archivos adjuntos ({archivos.length}):
                </p>
                <button
                  onClick={() => setArchivos([])}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Eliminar todos
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {archivos.map((archivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FiFileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{archivo.name}</p>
                        <p className="text-sm text-gray-500">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarArchivo(index)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={onVolver}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Selector
        </button>

        <button
          onClick={handleContinuar}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg flex items-center gap-2"
        >
          Continuar a Revisión
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FormularioObraStepDinamico;
