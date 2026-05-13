import { useState } from 'react';
import { FiX, FiUpload, FiCheck, FiAlertCircle, FiFile } from 'react-icons/fi';

interface CertificadoUpload {
  registroId: number;
  numeroRegistro: string;
  tituloObra: string;
  file: File | null;
  valido: boolean | null;
  error: string | null;
}

interface Props {
  registros: any[];
  onClose: () => void;
  onSubir: (uploads: Array<{ registroId: number; file: File }>) => Promise<void>;
}

const SubirCertificadosModal = ({ registros, onClose, onSubir }: Props) => {
  const [certificados, setCertificados] = useState<CertificadoUpload[]>(
    registros.map(r => ({
      registroId: r.id,
      numeroRegistro: r.numeroRegistro,
      tituloObra: r.tituloObra,
      file: null,
      valido: null,
      error: null
    }))
  );
  const [subiendo, setSubiendo] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const validarPDF = async (file: File): Promise<{ valido: boolean; error: string | null }> => {
    // Validar tipo
    if (file.type !== 'application/pdf') {
      return { valido: false, error: 'Solo se permiten archivos PDF' };
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valido: false, error: 'El archivo es muy grande (máx. 10MB)' };
    }

    // Validar que sea un PDF válido leyendo los primeros bytes
    try {
      const arrayBuffer = await file.slice(0, 5).arrayBuffer();
      const header = new Uint8Array(arrayBuffer);
      const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;

      if (!isPDF) {
        return { valido: false, error: 'El archivo no es un PDF válido' };
      }
    } catch (error) {
      return { valido: false, error: 'No se pudo leer el archivo' };
    }

    return { valido: true, error: null };
  };

  const handleFileSelect = async (registroId: number, file: File) => {
    const validacion = await validarPDF(file);

    setCertificados(prev =>
      prev.map(cert =>
        cert.registroId === registroId
          ? {
              ...cert,
              file: validacion.valido ? file : null,
              valido: validacion.valido,
              error: validacion.error
            }
          : cert
      )
    );
  };

  const handleDrop = async (e: React.DragEvent, registroId: number) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(registroId, file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>, registroId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(registroId, file);
    }
  };

  const handleSubir = async () => {
    const certificadosValidos = certificados.filter(c => c.file && c.valido);

    if (certificadosValidos.length === 0) {
      alert('Debe seleccionar al menos un certificado válido');
      return;
    }

    if (!confirm(`¿Subir ${certificadosValidos.length} certificado(s) firmado(s)?`)) {
      return;
    }

    try {
      setSubiendo(true);
      await onSubir(
        certificadosValidos.map(c => ({
          registroId: c.registroId,
          file: c.file!
        }))
      );
      onClose();
    } catch (error) {
      console.error('Error al subir certificados:', error);
    } finally {
      setSubiendo(false);
    }
  };

  const certificadosCompletos = certificados.filter(c => c.file && c.valido).length;
  const certificadosConError = certificados.filter(c => c.error).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subir Certificados Firmados</h2>
            <p className="text-sm text-gray-600 mt-1">
              {certificadosCompletos} de {certificados.length} certificado(s) listo(s)
              {certificadosConError > 0 && (
                <span className="text-red-600 ml-2">• {certificadosConError} con error</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            disabled={subiendo}
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Body - Lista de certificados */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {certificados.map((cert) => (
            <div
              key={cert.registroId}
              className={`border-2 rounded-lg p-4 transition-all ${
                dragOver === cert.registroId
                  ? 'border-blue-500 bg-blue-50'
                  : cert.valido
                  ? 'border-green-300 bg-green-50'
                  : cert.error
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(cert.registroId);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, cert.registroId)}
            >
              <div className="flex items-start gap-4">
                {/* Info del registro */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-blue-600">
                      {cert.numeroRegistro}
                    </span>
                    {cert.valido && (
                      <FiCheck className="text-green-600 flex-shrink-0" />
                    )}
                    {cert.error && (
                      <FiAlertCircle className="text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 truncate mb-2">{cert.tituloObra}</p>

                  {/* Estado del archivo */}
                  {cert.file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FiFile className={cert.valido ? 'text-green-600' : 'text-red-600'} />
                      <span className={cert.valido ? 'text-green-700' : 'text-red-700'}>
                        {cert.file.name} ({(cert.file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin archivo seleccionado</p>
                  )}

                  {/* Mensaje de error */}
                  {cert.error && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <FiAlertCircle className="flex-shrink-0" />
                      {cert.error}
                    </p>
                  )}
                </div>

                {/* Botón de selección */}
                <div className="flex-shrink-0">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleInputChange(e, cert.registroId)}
                      className="hidden"
                      disabled={subiendo}
                    />
                    <div
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        subiendo
                          ? 'bg-gray-300 cursor-not-allowed'
                          : cert.file
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <FiUpload />
                      {cert.file ? 'Cambiar' : 'Seleccionar'}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Arrastra y suelta archivos PDF o haz click en "Seleccionar"</p>
            <p>Máximo 10MB por archivo</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={subiendo}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubir}
              disabled={subiendo || certificadosCompletos === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {subiendo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <FiUpload />
                  Subir {certificadosCompletos > 0 && `(${certificadosCompletos})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubirCertificadosModal;
