import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { api } from '../../services/api';

interface Formulario {
  id: number;
  codigo: string;
  fecha: string;
  mensajeDevolucion?: string;
  fechaDevolucion?: string;
  estado: {
    nombre: string;
  };
  usuario: {
    nombrecompleto: string;
  };
  clientes: Array<{
    cliente: {
      id: number;
      nombrecompleto: string;
      identificacion: string;
      telefono?: string;
      correo?: string;
    };
  }>;
  productos: Array<{
    id: number;
    producto: {
      codigo: string;
      nombre: string;
    };
    campos: Array<{
      id: number;
      campo: {
        nombre: string;
      };
      valor: string;
    }>;
  }>;
}

const FormularioObraDetallePage = () => {
  const { id } = useParams();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFormulario();
  }, [id]);

  const cargarFormulario = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formularios/${id}`);
      setFormulario(response.data);
    } catch (error) {
      console.error('Error al cargar formulario:', error);
    } finally {
      setLoading(false);
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
            Volver a Formularios Devueltos
          </Link>
        </div>
      </div>
    );
  }

  const cliente = formulario.clientes[0]?.cliente;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Formulario de Registro de Obra
            </h1>
            <p className="text-gray-600 font-mono text-lg">{formulario.codigo}</p>
          </div>
          <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold border border-red-200">
            <FiAlertCircle className="inline mr-1" />
            {formulario.estado.nombre}
          </span>
        </div>
      </div>

      {/* Mensaje de Devolución */}
      {formulario.mensajeDevolucion && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-600 text-2xl flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Motivo de Devolución desde Registro
              </h3>
              <p className="text-red-800 whitespace-pre-wrap">
                {formulario.mensajeDevolucion}
              </p>
              {formulario.fechaDevolucion && (
                <p className="text-sm text-red-700 mt-2">
                  Devuelto el: {new Date(formulario.fechaDevolucion).toLocaleString('es-DO')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiUser className="text-blue-600 text-2xl" />
              <h2 className="text-xl font-bold text-gray-900">Información del Cliente</h2>
            </div>

            {cliente ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="text-lg font-semibold text-gray-900">{cliente.nombrecompleto}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cédula/Identificación</label>
                    <p className="text-gray-900">{cliente.identificacion}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{cliente.telefono || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Correo Electrónico</label>
                  <p className="text-gray-900">{cliente.correo || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No hay información del cliente</p>
            )}
          </div>

          {/* Obras Registradas */}
          {formulario.productos.map((producto, idx) => (
            <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiFileText className="text-blue-600 text-2xl" />
                <h2 className="text-xl font-bold text-gray-900">
                  Obra #{idx + 1}: {producto.producto.nombre}
                </h2>
              </div>

              {producto.campos && producto.campos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {producto.campos.map((campo) => (
                    <div key={campo.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        {campo.campo.nombre}
                      </label>
                      <p className="text-gray-900 font-medium break-words">
                        {campo.valor || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay campos adicionales para esta obra</p>
              )}
            </div>
          ))}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Información General */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información General</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Código</label>
                <p className="font-mono text-gray-900">{formulario.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p className="text-gray-900">
                  {new Date(formulario.fecha).toLocaleDateString('es-DO')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Creado por</label>
                <p className="text-gray-900">{formulario.usuario.nombrecompleto}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <p className="text-gray-900">{formulario.estado.nombre}</p>
              </div>
            </div>
          </div>

          {/* Acción */}
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-3">Acción Requerida</h3>
            <p className="text-sm text-red-800 mb-4">
              Este formulario fue devuelto por el Departamento de Registro. Debes corregir los datos señalados en el motivo de devolución.
            </p>
            <Link
              to={`/aau/formularios/${formulario.id}/editar`}
              className="w-full block px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-center"
            >
              CORREGIR FORMULARIO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioObraDetallePage;
