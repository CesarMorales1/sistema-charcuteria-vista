const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface UnidadMedida {
  id_unidad_medida: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface ProductoInventario {
  id_producto: number;
  codigo_barra?: string | null;
  nombre: string;
  descripcion?: string | null;
  id_categoria: number;
  categoria?: Categoria | null;
  id_unidad_medida: number;
  unidad_medida?: UnidadMedida | null;
  peso_unitario?: number | null;
  activo: boolean;
  stock_general: number;
  stock_legal: number;
}

export interface Movimiento {
  id_movimiento: number;
  id_producto: number;
  tipo_inventario: 'general' | 'legal' | 'ambos';
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  observacion: string;
  fecha: string;
  usuario: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    stats?: {
      totalStockBajo: number;
      totalDiferencias: number;
    };
  };
}

export interface AjustePayload {
  tipo_inventario: 'general' | 'legal' | 'ambos';
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  observacion: string;
}

class InventarioApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getProductos(
    page = 1,
    limit = 20,
    search = '',
    id_categoria?: number,
    stock_bajo?: boolean,
    diferencias?: boolean
  ): Promise<PaginatedResponse<ProductoInventario>> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(id_categoria && { id_categoria: id_categoria.toString() }),
      ...(stock_bajo && { stock_bajo: 'true' }),
      ...(diferencias && { diferencias: 'true' }),
    });

    const response = await fetch(`${API_URL}/inventario/productos?${query}`, {
      headers: this.getHeaders(),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.message || 'Error al cargar productos');
    }

    // Map backend structure to frontend structure
    const data = (body.data || []).map((p: any) => ({
      ...p,
      stock_general: p.inventario_general?.cantidad_actual ?? 0,
      stock_legal: p.inventario_legal?.cantidad_actual ?? 0,
    }));

    return {
      data,
      meta: {
        total: body.total || data.length,
        page: body.page || 1,
        totalPages: body.totalPages || 1,
        stats: body.stats,
      },
    };
  }

  async getCategorias(): Promise<Categoria[]> {
    const response = await fetch(`${API_URL}/inventario/categorias`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al obtener categorías');
    return body.data || [];
  }

  async getUnidadesMedida(): Promise<UnidadMedida[]> {
    const response = await fetch(`${API_URL}/inventario/unidades-medida`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al obtener unidades de medida');
    return body.data || [];
  }

  async createProducto(data: Partial<ProductoInventario>): Promise<ProductoInventario> {
    const response = await fetch(`${API_URL}/inventario/productos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al crear producto');
    return body.data;
  }

  async updateProducto(id: number, data: Partial<ProductoInventario>): Promise<ProductoInventario> {
    const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al actualizar producto');
    return body.data;
  }

  async ajusteInventario(id: number, adjustment: AjustePayload): Promise<void> {
    const response = await fetch(`${API_URL}/inventario/productos/${id}/ajuste`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(adjustment),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al registrar ajuste');
  }

  async getMovimientos(id_producto: number): Promise<Movimiento[]> {
    const response = await fetch(`${API_URL}/inventario/productos/${id_producto}/movimientos`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al obtener movimientos');

    // Map backend fields to frontend names
    const data = (body.data || []).map((m: any) => ({
      ...m,
      stock_anterior: m.cantidad_anterior ?? 0,
      stock_posterior: m.cantidad_nueva ?? 0,
      usuario: m.usuario?.nombre || m.usuario || 'Sistema'
    }));

    return data;
  }

  async checkInicializacion(): Promise<boolean> {
    const response = await fetch(`${API_URL}/inventario/inicializacion/estado`, {
      headers: this.getHeaders(),
    });
    const body = await response.json();
    if (!response.ok) return true; // Fail open to avoid blocking everything if route fails
    return body.data?.inicializado || false;
  }

  async inicializarInventario(productos: { id_producto: number; cantidad: number; valor_unitario?: number | null }[]): Promise<void> {
    const response = await fetch(`${API_URL}/inventario/inicializacion`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ productos }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al inicializar inventario');
  }
}

export const inventarioApi = new InventarioApiService();
