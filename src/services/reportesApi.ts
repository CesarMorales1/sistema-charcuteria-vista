const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ProductoRentabilidad {
  id_producto: number;
  nombre: string;
  codigo_barra: string | null;
  categoria: string;
  precio_base: number;
  costo_promedio: number;
  ingresos_totales: number;
  unidades_vendidas: number;
  ganancia: number;
  margen_porcentaje: number;
}

export interface CategoriaRentabilidad {
  id_categoria: number;
  categoria: string;
  ingresos: number;
  unidades: number;
  porcentaje_relativo: number;
}

export interface RentabilidadResponse {
  data: ProductoRentabilidad[];
  total: number;
  page: number;
  totalPages: number;
  kpis: {
    totalIngresos: number;
    totalGanancia: number;
    margenPromedio: number;
  };
}

class ReportesApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async getRentabilidad(
    page = 1,
    limit = 20,
    search = '',
    id_categoria?: number
  ): Promise<RentabilidadResponse> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(id_categoria && { id_categoria: id_categoria.toString() }),
    });

    const response = await fetch(`${API_URL}/reportes/rentabilidad?${query}`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al cargar reporte');
    return body;
  }

  async getCategorias(): Promise<CategoriaRentabilidad[]> {
    const response = await fetch(`${API_URL}/reportes/categorias`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al cargar categorías');
    return body.data || [];
  }
}

export const reportesApi = new ReportesApiService();
