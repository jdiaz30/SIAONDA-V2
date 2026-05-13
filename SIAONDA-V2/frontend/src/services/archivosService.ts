import { api } from './api';

export interface ClienteArchivo {
  id: number;
  clienteId: number;
  nombre: string;
  ruta: string;
  tipo: string;
  tamano: number;
  creadoEn: string;
}

export const archivosService = {
  uploadArchivoCliente: async (
    clienteId: number,
    archivo: File
  ): Promise<ClienteArchivo> => {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await api.post(`/clientes/${clienteId}/archivos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteArchivoCliente: async (clienteId: number, archivoId: number): Promise<void> => {
    await api.delete(`/clientes/${clienteId}/archivos/${archivoId}`);
  },

  getArchivoUrl: (ruta: string): string => {
    // Nginx hace proxy de /uploads/ a backend:3000/uploads/
    // Construir URL absoluta sin /api/
    const rutaLimpia = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    const rutaFinal = rutaLimpia.startsWith('uploads/') ? rutaLimpia : `uploads/${rutaLimpia}`;

    return `${window.location.protocol}//${window.location.host}/${rutaFinal}`;
  },
};
