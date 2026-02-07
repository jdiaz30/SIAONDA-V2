import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';

interface Inspector {
  id: number;
  codigo: string;
  nombrecompleto: string;
}

export default function ActaOficioFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viajeId = searchParams.get('viajeId');

  const [loading, setLoading] = useState(false);
  const [viaje, setViaje] = useState<any>(null);
  const [inspectores, setInspectores] = useState<Inspector[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    numeroActa: '', // Opcional - se genera automáticamente si está vacío
    inspectorId: '',
    empresaRnc: '',
    empresaNombre: '',
    resultadoInspeccion: '',
    requiereSeguimiento: false
  });

  useEffect(() => {
    if (!viajeId) {
      alert('No se especificó el viaje');
      navigate('/inspectoria/viajes-oficio');
      return;
    }
    cargarDatos();
  }, [viajeId]);

  const cargarDatos = async () => {
    try {
      // Cargar datos del viaje
      const viajeResponse = await api.get(`/inspectoria/viajes-oficio/${viajeId}`);
      setViaje(viajeResponse.data.data);

      // Extraer inspectores del viaje
      const inspectoresViaje = viajeResponse.data.data.inspectores.map((i: any) => ({
        id: i.inspector.id,
        codigo: i.inspector.codigo,
        nombrecompleto: i.inspector.nombrecompleto
      }));
      setInspectores(inspectoresViaje);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del viaje');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile) {
      alert('Debe subir el PDF del acta escaneada');
      return;
    }

    if (!formData.inspectorId) {
      alert('Debe seleccionar un inspector');
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('viajeId', viajeId!);
      formDataToSend.append('numeroActa', formData.numeroActa);
      formDataToSend.append('inspectorId', formData.inspectorId);
      formDataToSend.append('empresaRnc', formData.empresaRnc);
      formDataToSend.append('empresaNombre', formData.empresaNombre);
      formDataToSend.append('resultadoInspeccion', formData.resultadoInspeccion);
      formDataToSend.append('requiereSeguimiento', formData.requiereSeguimiento.toString());
      formDataToSend.append('pdfActa', pdfFile);

      await api.post('/inspectoria/actas-oficio', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('✅ Acta registrada exitosamente');
      navigate(`/inspectoria/viajes-oficio/${viajeId}`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error al registrar acta');
    } finally {
      setLoading(false);
    }
  };

  if (!viaje) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar Acta de Inspección</h1>
        <p className="text-gray-600">Viaje: {viaje.codigo} - {viaje.provincia.nombre}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número de Acta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Acta (Opcional)
              </label>
              <input
                type="text"
                value={formData.numeroActa}
                onChange={(e) => setFormData({ ...formData, numeroActa: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Ej: 001-25 (se genera automáticamente si se deja vacío)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: XXX-XX (3 dígitos + 2 dígitos de año). Se genera automáticamente si está vacío.
              </p>
            </div>

            {/* Inspector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspector <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.inspectorId}
                onChange={(e) => setFormData({ ...formData, inspectorId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Seleccionar inspector</option>
                {inspectores.map(inspector => (
                  <option key={inspector.id} value={inspector.id}>
                    {inspector.nombrecompleto} ({inspector.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* RNC de la Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RNC de la Empresa
              </label>
              <input
                type="text"
                value={formData.empresaRnc}
                onChange={(e) => setFormData({ ...formData, empresaRnc: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="XXX-XXXXX-X"
              />
            </div>

            {/* Nombre de la Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.empresaNombre}
                onChange={(e) => setFormData({ ...formData, empresaNombre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Nombre de la empresa inspeccionada"
                required
              />
            </div>
          </div>

          {/* Resultado de la Inspección */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultado de la Inspección <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.resultadoInspeccion}
              onChange={(e) => setFormData({ ...formData, resultadoInspeccion: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Descripción del resultado de la inspección..."
              required
            />
          </div>

          {/* PDF del Acta */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF del Acta Escaneada <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            {pdfFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Archivo seleccionado: {pdfFile.name}
              </p>
            )}
          </div>

          {/* ¿Requiere Seguimiento? */}
          <div className="mt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.requiereSeguimiento}
                onChange={(e) => setFormData({ ...formData, requiereSeguimiento: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                ¿Requiere seguimiento? (Se generará un caso de inspección)
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Acta'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/inspectoria/viajes-oficio/${viajeId}`)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
