import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aauService from '../../services/aauService';
import { FiAlertTriangle } from 'react-icons/fi';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface FormularioDevuelto {
  id: number;
  tipo: 'OBRA' | 'IRC';
  codigo: string;
  fecha: string;
  estado: string;
  clienteNombre: string;
  categoria: string;
  mensajeDevolucion?: string;
  fechaDevolucion?: string;
  formularioId: number | null;
  solicitudIrcId: number | null;
}

const FormulariosDevueltosPage = () => {
  const { hasPermission } = usePermissions();

  // Verificar permiso para corregir formularios devueltos
  if (!hasPermission('atu.formularios.corregir_devueltos_propios') && !hasPermission('atu.formularios.corregir_devueltos_otros')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para corregir formularios devueltos. Esta funcionalidad es solo para Técnicos ATU y Encargado de ATU." />
      </div>
    );
  }

  // Determinar si solo puede corregir los suyos o todos
  const puedeCorregirTodos = hasPermission('atu.formularios.corregir_devueltos_otros');
  const soloPropios = !puedeCorregirTodos;

  const [formularios, setFormularios] = useState<FormularioDevuelto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormulariosDevueltos();
  }, []);

  const fetchFormulariosDevueltos = async () => {
    try {
      setLoading(true);
      const response = await aauService.getFormulariosDevueltos();
      setFormularios(response.data || response);
    } catch (error) {
      console.error('Error al cargar formularios devueltos:', error);
      alert('Error al cargar formularios devueltos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso de restricción para TECNICO_ATU */}
      {soloPropios && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Nota:</strong> Solo puedes corregir los formularios que tú creaste originalmente. Los formularios de otros técnicos no están disponibles para ti.
          </p>
        </div>
      )}

      {/* Header con alerta */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg p-6">
        <div className="flex items-start">
          <FiAlertTriangle className="text-4xl text-red-600 mr-4 animate-pulse" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Solicitudes Devueltas - Requieren Corrección
            </h1>
            <p className="text-red-700">
              Estas solicitudes (obras e IRC) fueron devueltas por el Departamento de Registro y necesitan ser corregidas URGENTEMENTE.
              Una vez corregidas, serán reenviadas automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Botón volver */}
      <div>
        <Link
          to="/aau"
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 inline-block"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Lista de formularios devueltos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando solicitudes devueltas...</p>
            </div>
          </div>
        ) : formularios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡No hay solicitudes devueltas!
            </h3>
            <p className="text-gray-600 mb-4">Todas las solicitudes están en orden</p>
            <Link
              to="/aau"
              className="text-blue-600 hover:text-blue-800"
            >
              Volver al Dashboard →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {formularios.map((formulario) => (
              <div
                key={`${formulario.tipo}-${formulario.id}`}
                className="p-6 hover:bg-red-50 transition-colors border-l-4 border-red-500"
              >
                <div className="flex items-start justify-between">
                  {/* Info principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {formulario.codigo}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        formulario.tipo === 'IRC'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {formulario.tipo === 'IRC' ? '📋 IRC' : '🏗️ OBRA'}
                      </span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                        <FiAlertTriangle className="inline mr-1" />
                        DEVUELTO
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente/Empresa</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formulario.clienteNombre}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Categoría</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formulario.categoria}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Devuelto el</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formulario.fechaDevolucion
                            ? new Date(formulario.fechaDevolucion).toLocaleDateString('es-DO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Motivo de devolución */}
                    {formulario.mensajeDevolucion && (
                      <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-red-900 mb-1">
                          MOTIVO DE DEVOLUCIÓN:
                        </p>
                        <p className="text-sm text-red-800">
                          {formulario.mensajeDevolucion}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="ml-6 flex flex-col gap-2">
                    {formulario.tipo === 'IRC' ? (
                      <>
                        <Link
                          to={`/aau/solicitudes-irc/${formulario.solicitudIrcId}/corregir`}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-center shadow-lg transform hover:scale-105 transition-all"
                        >
                          CORREGIR AHORA
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/aau/formularios/obra/${formulario.formularioId}`}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-center shadow-lg transform hover:scale-105 transition-all"
                      >
                        VER DETALLE Y CORREGIR
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen */}
      {!loading && formularios.length > 0 && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-800">
            <span className="font-bold">{formularios.length}</span> solicitud(es) requieren corrección urgente.
            Prioridad: Alta <FiAlertTriangle className="inline ml-1" />
          </p>
        </div>
      )}
    </div>
  );
};

export default FormulariosDevueltosPage;
