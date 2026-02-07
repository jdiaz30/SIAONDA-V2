import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCasosJuridicos, CasoJuridico } from '../../services/juridicoService';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

export default function CasosJuridicosPage() {
  const navigate = useNavigate();
  const { canAccessModule } = usePermissions();

  // Verificar acceso al módulo JURIDICO
  if (!canAccessModule('JURIDICO')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes acceso al módulo Jurídico. Esta área es solo para personal del área legal." />
      </div>
    );
  }
  const [casos, setCasos] = useState<CasoJuridico[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    cargarCasos();
  }, [page]);

  const cargarCasos = async () => {
    try {
      setLoading(true);
      const data = await listarCasosJuridicos({ page, limit: 20 });
      setCasos(data.casos || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error al cargar casos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'RECIBIDO': return 'bg-yellow-100 text-yellow-800';
      case 'EN_ATENCION': return 'bg-blue-100 text-blue-800';
      case 'CERRADO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && casos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando casos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Casos Jurídicos</h1>
        <p className="text-gray-600 mt-1">
          Casos tramitados al departamento jurídico después de segunda inspección
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código Caso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RNC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Recepción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {casos.map((caso) => (
              <tr key={caso.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {caso.casoInspeccion.codigo}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {caso.casoInspeccion.empresa.nombreEmpresa}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {caso.casoInspeccion.empresa.rnc}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(caso.fechaRecepcion).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getEstadoBadgeColor(caso.estadoJuridico.nombre)}`}>
                    {caso.estadoJuridico.nombre.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {caso.casoInspeccion.actaInspeccion && caso.casoInspeccion.actaInfraccion ? '2 actas' : '1 acta'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => navigate(`/juridico/casos/${caso.id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {casos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay casos jurídicos
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
