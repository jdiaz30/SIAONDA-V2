import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiAlertTriangle, FiUpload, FiArrowLeft } from 'react-icons/fi';

export default function DenunciaFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cedulaFile, setCedulaFile] = useState<File | null>(null);
  const [comunicacionFile, setComunicacionFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    denuncianteNombre: '',
    denuncianteTelefono: '',
    denuncianteEmail: '',
    denuncianteDireccion: '',
    empresaDenunciada: '',
    direccionEmpresa: '',
    descripcionHechos: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5 MB');
        return;
      }
      setCedulaFile(file);
    }
  };

  const handleComunicacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no debe superar los 10 MB');
        return;
      }
      setComunicacionFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cedulaFile || !comunicacionFile) {
      alert('Debe adjuntar la cédula del denunciante y el documento de sustento');
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('denuncianteNombre', formData.denuncianteNombre);
      formDataToSend.append('denuncianteTelefono', formData.denuncianteTelefono);
      formDataToSend.append('denuncianteEmail', formData.denuncianteEmail);
      formDataToSend.append('denuncianteDireccion', formData.denuncianteDireccion);
      formDataToSend.append('empresaDenunciada', formData.empresaDenunciada);
      formDataToSend.append('direccionEmpresa', formData.direccionEmpresa);
      formDataToSend.append('descripcionHechos', formData.descripcionHechos);
      formDataToSend.append('cedulaDenunciante', cedulaFile);
      formDataToSend.append('comunicacion', comunicacionFile);

      const response = await api.post('/denuncias', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const denuncia = response.data.data;

      alert(`✅ Denuncia registrada exitosamente\n\nCódigo: ${denuncia.codigo}\n\nEl cliente debe proceder a Caja para pagar RD$3,000`);

      navigate('/aau/denuncias');
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.response?.data?.message || 'Error al registrar denuncia'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/aau/denuncias')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <FiArrowLeft />
          Volver a Denuncias
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Denuncia</h1>
        <p className="text-gray-600 mt-2">Inspección de Parte - Denuncia Ciudadana</p>
      </div>

      {/* Alerta informativa */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="text-yellow-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Información Importante</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• El costo del servicio de Inspección de Parte es de <strong>RD$3,000</strong></li>
              <li>• El cliente debe proceder a Caja después de registrar la denuncia</li>
              <li>• Una vez pagada, la denuncia pasa a Inspectoría para su revisión</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit}>
          {/* Sección: Datos del Denunciante */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Datos del Denunciante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="denuncianteNombre"
                  value={formData.denuncianteNombre}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo del denunciante"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="denuncianteTelefono"
                  value={formData.denuncianteTelefono}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(809) 555-5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="denuncianteEmail"
                  value={formData.denuncianteEmail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="denuncianteDireccion"
                  value={formData.denuncianteDireccion}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección del denunciante"
                />
              </div>
            </div>
          </div>

          {/* Sección: Empresa Denunciada */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Empresa Denunciada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="empresaDenunciada"
                  value={formData.empresaDenunciada}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la empresa denunciada"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de la Empresa
                </label>
                <input
                  type="text"
                  name="direccionEmpresa"
                  value={formData.direccionEmpresa}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección donde se encuentra la empresa"
                />
              </div>
            </div>
          </div>

          {/* Sección: Descripción de los Hechos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Descripción de los Hechos
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcionHechos"
                value={formData.descripcionHechos}
                onChange={handleChange}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describa detalladamente los hechos que motivan la denuncia..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Incluya toda la información relevante sobre la denuncia
              </p>
            </div>
          </div>

          {/* Sección: Documentos Adjuntos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Documentos Requeridos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cédula del Denunciante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula del Denunciante <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="cedula"
                    accept="image/*,application/pdf"
                    onChange={handleCedulaChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="cedula"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiUpload className="text-4xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {cedulaFile ? cedulaFile.name : 'Click para subir cédula'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Imagen o PDF (máx. 5MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* Documento de Sustento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento de Sustento <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="comunicacion"
                    accept="image/*,application/pdf"
                    onChange={handleComunicacionChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="comunicacion"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiUpload className="text-4xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {comunicacionFile ? comunicacionFile.name : 'Click para subir documento'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Imagen o PDF (máx. 10MB)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/aau/denuncias')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registrando...
                </>
              ) : (
                'Registrar Denuncia'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
