import { FiClock, FiUser, FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';

interface HistorialItem {
  id: number;
  accion: string;
  fecha: string;
  mensaje?: string;
  estadoAnterior?: {
    nombre: string;
    descripcion?: string;
  } | null;
  estadoNuevo: {
    nombre: string;
    descripcion?: string;
  };
  usuario: {
    id: number;
    nombre: string;
    nombrecompleto: string;
    tipo?: {
      nombre: string;
    };
  };
}

interface Props {
  historial: HistorialItem[];
}

const FormularioHistorialTimeline = ({ historial }: Props) => {
  const getIconoAccion = (accion: string) => {
    switch (accion.toUpperCase()) {
      case 'CREADO':
        return <FiFileText className="text-blue-600" />;
      case 'DEVUELTO':
        return <FiAlertCircle className="text-red-600" />;
      case 'CORREGIDO':
        return <FiCheckCircle className="text-green-600" />;
      case 'APROBADO':
        return <FiCheckCircle className="text-green-600" />;
      case 'PAGADO':
        return <FiCheckCircle className="text-emerald-600" />;
      case 'ASENTADO':
        return <FiCheckCircle className="text-purple-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const getColorAccion = (accion: string) => {
    switch (accion.toUpperCase()) {
      case 'CREADO':
        return 'bg-blue-100 border-blue-300';
      case 'DEVUELTO':
        return 'bg-red-100 border-red-300';
      case 'CORREGIDO':
        return 'bg-green-100 border-green-300';
      case 'APROBADO':
        return 'bg-green-100 border-green-300';
      case 'PAGADO':
        return 'bg-emerald-100 border-emerald-300';
      case 'ASENTADO':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiClock className="inline-block text-4xl mb-2" />
        <p>No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {historial.map((item, index) => (
        <div key={item.id} className="relative pl-8">
          {/* Línea vertical conectora */}
          {index < historial.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-300" />
          )}

          {/* Punto del timeline */}
          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${getColorAccion(item.accion)}`}>
            {getIconoAccion(item.accion)}
          </div>

          {/* Contenido del evento */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg">{item.accion}</h4>
                <p className="text-sm text-gray-600">
                  {item.estadoAnterior && (
                    <span>
                      <span className="font-medium">{item.estadoAnterior.nombre}</span>
                      <span className="mx-2">→</span>
                    </span>
                  )}
                  <span className="font-medium text-gray-900">{item.estadoNuevo.nombre}</span>
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {formatearFecha(item.fecha)}
              </span>
            </div>

            {/* Usuario que realizó la acción */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <FiUser className="text-gray-400" />
              <span className="font-medium">{item.usuario.nombrecompleto}</span>
              {item.usuario.tipo && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                  {item.usuario.tipo.nombre}
                </span>
              )}
            </div>

            {/* Mensaje/Comentario */}
            {item.mensaje && (
              <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                item.accion.toUpperCase() === 'DEVUELTO'
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{item.mensaje}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormularioHistorialTimeline;
