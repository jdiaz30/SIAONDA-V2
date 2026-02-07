import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiAlertCircle } from 'react-icons/fi';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

interface Campo {
  id: number;
  campo: {
    id: number;
    nombre: string;
    tipo: {
      nombre: string;
    };
    requerido: boolean;
    placeholder?: string;
  };
  valor: string;
}

interface Formulario {
  id: number;
  codigo: string;
  mensajeDevolucion?: string;
  fechaDevolucion?: string;
  clientes: Array<{
    cliente: {
      nombrecompleto: string;
    };
  }>;
  productos: Array<{
    id: number;
    producto: {
      nombre: string;
    };
    campos: Campo[];
  }>;
}

const FormularioObraEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [camposEditados, setCamposEditados] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    cargarFormulario();
  }, [id]);

  const cargarFormulario = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formularios/${id}`);
      setFormulario(response.data);

      // Inicializar campos editados con valores actuales
      const valores: { [key: number]: string } = {};
      response.data.productos.forEach((producto: any) => {
        producto.campos.forEach((campo: Campo) => {
          valores[campo.id] = campo.valor || '';
        });
      });
      setCamposEditados(valores);
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      alert('Error al cargar formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleCampoChange = (campoId: number, valor: string) => {
    setCamposEditados(prev => ({
      ...prev,
      [campoId]: valor
    }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      // Convertir el objeto de campos editados a array para el backend
      const camposActualizados = Object.entries(camposEditados).map(([campoId, valor]) => ({
        id: parseInt(campoId),
        valor
      }));

      await api.put(`/formularios/${id}/corregir`, {
        campos: camposActualizados
      });

      alert('✅ Formulario corregido exitosamente. Será reenviado a Registro.');
      navigate('/aau/formularios/devueltos');
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const renderCampo = (campo: Campo, productoIdx: number) => {
    const tipoInput = campo.campo.tipo.nombre;
    const valor = camposEditados[campo.id] || '';

    const baseClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (tipoInput) {
      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={`${baseClasses} min-h-[100px]`}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );

      case 'select':
        // Aquí necesitarías las opciones del select
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={baseClasses}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleCampoChange(campo.id, e.target.value)}
            className={baseClasses}
            placeholder={campo.campo.placeholder}
            required={campo.campo.requerido}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Formulario no encontrado</p>
          <Link
            to="/aau/formularios/devueltos"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/aau/formularios/devueltos"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Volver a Formularios Devueltos</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Corregir Formulario de Obra
          </h1>
          <p className="text-gray-600">
            Formulario {formulario.codigo} - {formulario.clientes[0]?.cliente.nombrecompleto}
          </p>
        </div>
      </div>

      {/* Mensaje de Devolución */}
      {formulario.mensajeDevolucion && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-600 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Motivo de Devolución desde Registro
              </h3>
              <p className="text-red-800 whitespace-pre-wrap">
                {formulario.mensajeDevolucion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formularios de Edición */}
      <div className="space-y-6">
        {formulario.productos.map((producto, idx) => (
          <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Obra #{idx + 1}: {producto.producto.nombre}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {producto.campos.map((campo) => (
                <div key={campo.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {campo.campo.nombre}
                    {campo.campo.requerido && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderCampo(campo, idx)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Link
          to="/aau/formularios/devueltos"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Guardando...
            </>
          ) : (
            <>
              <FiSave />
              Guardar y Reenviar a Registro
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormularioObraEditPage;
