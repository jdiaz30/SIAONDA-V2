import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialItem {
  id: number;
  accion: string;
  mensaje: string | null;
  fecha: string;
  estadoAnterior: {
    nombre: string;
    descripcion: string | null;
  } | null;
  estadoNuevo: {
    nombre: string;
    descripcion: string | null;
  };
  usuario: {
    id: number;
    nombre: string;
    nombrecompleto: string;
    tipo: {
      nombre: string;
    };
  };
}

interface HistorialFormularioProps {
  formularioId: number;
}

export const HistorialFormulario = ({ formularioId }: HistorialFormularioProps) => {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, [formularioId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formularios/${formularioId}/historial`);
      setHistorial(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el historial');
      console.error('Error al cargar historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccionColor = (accion: string) => {
    const colores: Record<string, string> = {
      'CREADO': 'bg-blue-100 text-blue-800 border-blue-300',
      'DEVUELTO': 'bg-red-100 text-red-800 border-red-300',
      'APROBADO': 'bg-green-100 text-green-800 border-green-300',
      'ASENTADO': 'bg-purple-100 text-purple-800 border-purple-300',
      'CERTIFICADO': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'ENTREGADO': 'bg-teal-100 text-teal-800 border-teal-300'
    };
    return colores[accion] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getAccionIcon = (accion: string) => {
    const iconos: Record<string, string> = {
      'CREADO': '📝',
      'DEVUELTO': '↩️',
      'APROBADO': '✅',
      'ASENTADO': '📚',
      'CERTIFICADO': '📜',
      'ENTREGADO': '🎉'
    };
    return iconos[accion] || '📋';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
        <p className="text-gray-500 text-center py-8">
          No hay cambios registrados para este formulario.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Cambios ({historial.length})
      </h3>
      
      <div className="space-y-4">
        {historial.map((item, index) => (
          <div 
            key={item.id}
            className="relative pl-8 pb-6 border-l-2 border-gray-200 last:pb-0"
          >
            {/* Punto en la línea de tiempo */}
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
            
            {/* Contenido del historial */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getAccionColor(item.accion)}`}>
                    {getAccionIcon(item.accion)} {item.accion}
                  </span>
                  
                  {item.estadoAnterior && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{item.estadoAnterior.nombre}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium text-blue-600">{item.estadoNuevo.nombre}</span>
                    </div>
                  )}
                  
                  {!item.estadoAnterior && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-blue-600">{item.estadoNuevo.nombre}</span>
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-gray-500">
                  {format(new Date(item.fecha), 'PPp', { locale: es })}
                </span>
              </div>
              
              <div className="text-sm text-gray-700">
                <span className="font-medium">{item.usuario.nombrecompleto}</span>
                <span className="text-gray-500"> ({item.usuario.tipo.nombre})</span>
              </div>
              
              {item.mensaje && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700">
                  <p className="font-medium text-gray-600 text-xs mb-1">Comentario:</p>
                  {item.mensaje}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
