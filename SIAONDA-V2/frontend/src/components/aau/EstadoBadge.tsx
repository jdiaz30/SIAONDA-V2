interface EstadoBadgeProps {
  estado: string;
  className?: string;
}

const EstadoBadge = ({ estado, className = '' }: EstadoBadgeProps) => {
  const getEstadoStyle = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return 'bg-gray-100 text-gray-800';
      case 'PAGADO':
      case 'PAGADA':
        return 'bg-yellow-100 text-yellow-800';
      case 'EN_REVISION_REGISTRO':
      case 'EN_REVISION':
      case 'EN REVISION':
        return 'bg-blue-100 text-blue-800';
      case 'DEVUELTO':
      case 'DEVUELTA':
        return 'bg-red-100 text-red-800 font-bold';
      case 'ASENTADO':
      case 'ASENTADA':
        return 'bg-green-100 text-green-800';
      case 'CERTIFICADO':
      case 'CERTIFICADO_GENERADO':
      case 'FIRMADA':
        return 'bg-blue-100 text-blue-800';
      case 'CERTIFICADO_CARGADO':
      case 'LISTA_ENTREGA':
        return 'bg-green-100 text-green-800';
      case 'ENTREGADO':
      case 'ENTREGADA':
        return 'bg-green-200 text-green-900';
      case 'CANCELADO':
        return 'bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const formatEstado = (estado: string) => {
    return estado
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(
        estado
      )} ${className}`}
    >
      <span>{formatEstado(estado)}</span>
    </span>
  );
};

export default EstadoBadge;
