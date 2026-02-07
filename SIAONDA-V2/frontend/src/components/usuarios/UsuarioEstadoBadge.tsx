interface UsuarioEstadoBadgeProps {
  estado: string;
}

export default function UsuarioEstadoBadge({ estado }: UsuarioEstadoBadgeProps) {
  const esActivo = estado === 'Activo';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        esActivo
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      <span className={`mr-1.5 h-2 w-2 rounded-full ${
        esActivo ? 'bg-green-400' : 'bg-red-400'
      }`} />
      {estado}
    </span>
  );
}
