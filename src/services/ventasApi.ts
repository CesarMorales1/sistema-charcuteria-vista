const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface VentaDetalle {
  id_detalle?: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  producto?: {
    nombre: string;
    codigo_barra: string;
    unidad_medida: {
      abreviatura: string;
    };
  };
}

export interface Venta {
  id_venta: number;
  fecha_venta: string;
  subtotal: number;
  alicuota_iva: number;
  monto_iva: number | null;
  total: number;
  id_moneda: number | null;
  tasa_referencia: number | null;
  reportable_seniat: boolean;
  estado: 'abierta' | 'anulada';
  observacion: string | null;
  usuario?: {
    nombre: string;
  };
  moneda?: {
    codigo: string;
    simbolo: string;
  };
  detalles: VentaDetalle[];
}

export interface PaginatedVentas {
  data: Venta[];
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    totalVentasHoy: number;
    countAnuladas: number;
    totalGeneral: number;
  };
}

class VentasApi {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getVentas(params: {
    page?: number;
    limit?: number;
    estado?: string;
    reportable_seniat?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}): Promise<PaginatedVentas> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.estado) query.append('estado', params.estado);
    if (params.reportable_seniat !== undefined) query.append('reportable_seniat', params.reportable_seniat.toString());
    if (params.fecha_desde) query.append('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) query.append('fecha_hasta', params.fecha_hasta);

    const response = await fetch(`${API_URL}/ventas?${query}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener ventas');
    }

    const body = await response.json();
    return {
      data: body.data,
      total: body.total,
      page: body.page,
      totalPages: body.totalPages,
      stats: body.stats
    };
  }

  async getVenta(id: number): Promise<Venta> {
    const response = await fetch(`${API_URL}/ventas/${id}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener detalle de venta');
    }

    const body = await response.json();
    return body.data;
  }

  async crearVenta(data: {
    detalles: { id_producto: number; cantidad: number; precio_unitario: number }[];
    reportable_seniat: boolean;
    alicuota_iva?: number;
    id_moneda?: number;
    tasa_referencia?: number;
    observacion?: string;
  }): Promise<Venta> {
    const response = await fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear venta');
    }

    const body = await response.json();
    return body.data;
  }

  async anularVenta(id: number): Promise<Venta> {
    const response = await fetch(`${API_URL}/ventas/${id}/anular`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al anular venta');
    }

    const body = await response.json();
    return body.data;
  }
}

export const ventasApi = new VentasApi();
