const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol?: 'cajero' | 'bodega';
}

export interface Permiso {
  id_permiso: number;
  nombre: string;
  modulo?: string;
  descripcion?: string;
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  terminos_pago?: string;
  activo: boolean;
}

export interface UnidadMedida {
  id_unidad_medida: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

export interface CategoriaProducto {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface Producto {
  id_producto: number;
  codigo_barra?: string | null;
  nombre: string;
  descripcion?: string | null;
  // Category is now a FK
  id_categoria?: number | null;
  categoria?: CategoriaProducto | null;
  // Unit is now a FK
  id_unidad_medida?: number | null;
  unidad_medida?: UnidadMedida | null;
  id_moneda_precio?: number | null;
  precio_base?: number;
  peso_unitario?: number | null;
  activo: boolean;
  inventario_general?: number | { cantidad_actual: number } | null;
  inventario_legal?: number | { cantidad_actual: number } | null;
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  permisos?: Permiso[];
}

export interface AuthResponse {
  token: string;
  usuario: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface DetalleCompra {
  id_detalle_compra?: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  aplicar_iva?: boolean;
  producto?: Producto;
}

export interface Compra {
  id_compra: number;
  id_proveedor: number;
  numero_factura?: string | null;
  base_imponible: number;
  alicuota_iva: number;
  monto_iva: number;
  total: number;
  reportable_seniat: boolean;
  estado: 'pendiente' | 'recibida' | 'cancelada';
  fecha_compra: string;
  proveedor?: Proveedor;
  detalles?: DetalleCompra[];
}

export interface CreateCompraPayload {
  id_proveedor: number;
  numero_factura?: string;
  base_imponible: number;
  alicuota_iva: number;
  monto_iva: number;
  total: number;
  reportable_seniat: boolean;
  detalles: Omit<DetalleCompra, 'id_detalle_compra' | 'subtotal' | 'producto'>[];
}

class ApiService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al iniciar sesión');
    }

    // Adapt structure: backend returns { status, data: { token, usuario } }
    const { token, usuario } = body.data;
    return {
      token,
      usuario: {
        ...usuario,
        id: usuario.id_usuario // Map backend id_usuario to frontend id
      }
    };
  }

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al registrar usuario');
    }

    // Backend returns { status: 'success', data: user }
    const userData = body.data;
    return {
      ...userData,
      id: userData.id_usuario
    };
  }

  async getMe(): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener perfil de usuario');
    }

    // Backend returns { status: 'success', data: user }
    const userData = body.data;
    return {
      ...userData,
      id: userData.id_usuario
    };
  }

  async getUsuarios(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search
    });

    const response = await fetch(`${API_URL}/usuarios?${query.toString()}`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener usuarios');
    }

    // Backend returns { status: 'success', data: users[], meta: {...} }
    return {
      data: body.data.map((u: any) => ({ ...u, id: u.id_usuario })),
      meta: body.meta
    };
  }

  async getPermisos(): Promise<Permiso[]> {
    const response = await fetch(`${API_URL}/permisos`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener permisos');
    }

    // Assume backend returns either an array directly or { status, data: [] }
    return Array.isArray(body) ? body : (body.data || []);
  }

  async getProveedores(page = 1, limit = 10, search = '', soloActivos = false): Promise<PaginatedResponse<Proveedor>> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      soloActivos: soloActivos.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_URL}/proveedores?${query}`, {
      headers: this.getHeaders(true), // requires authentication
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener proveedores');
    }

    // Handle generic backend pagination wrapper { status: 'success', data: [...], meta: { ... } }
    return {
      data: body.data,
      meta: {
        total: body.meta?.total || body.data.length,
        page: body.meta?.page || 1,
        totalPages: body.meta?.totalPages || 1
      }
    };
  }

  async assignPermissions(id_usuario: number, permisosIds: number[]): Promise<void> {
    const response = await fetch(`${API_URL}/usuarios/${id_usuario}/permisos`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ permisosIds }),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al asignar permisos');
    }
  }

  async createProveedor(data: Omit<Proveedor, 'id_proveedor' | 'activo'>): Promise<Proveedor> {
    const response = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al crear proveedor');
    }

    return body.data;
  }

  async updateProveedor(id: number, data: Partial<Proveedor>): Promise<Proveedor> {
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al actualizar proveedor');
    }

    return body.data;
  }

  async deleteProveedor(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al desactivar proveedor');
    }
  }

  async getProductos(page = 1, limit = 10, search = '', soloActivos = false): Promise<PaginatedResponse<Producto>> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      soloActivos: soloActivos.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_URL}/inventario/productos?${query}`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener productos');
    }

    return {
      data: body.data,
      meta: {
        total: body.meta?.total || body.data.length,
        page: body.meta?.page || 1,
        totalPages: body.meta?.totalPages || 1
      }
    };
  }

  async getProducto(id: number): Promise<Producto> {
    const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener producto');
    }

    return body.data;
  }

  async createProducto(data: Omit<Producto, 'id_producto' | 'activo'>): Promise<Producto> {

    const response = await fetch(`${API_URL}/inventario/productos`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al crear producto');
    }

    return body.data;
  }

  async updateProducto(id: number, data: Partial<Producto>): Promise<Producto> {
    const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al actualizar producto');
    }

    return body.data;
  }

  async deleteProducto(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al desactivar producto');
    }
  }

  async getCategorias(): Promise<CategoriaProducto[]> {
    const response = await fetch(`${API_URL}/inventario/categorias`, {
      headers: this.getHeaders(true),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al obtener categorías');
    return body.data || [];
  }

  async getUnidadesMedida(): Promise<UnidadMedida[]> {
    const response = await fetch(`${API_URL}/inventario/unidades-medida`, {
      headers: this.getHeaders(true),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Error al obtener unidades de medida');
    return body.data || [];
  }

  async getCompras(
    page = 1,
    limit = 20,
    numero_factura?: string,
    fecha_desde?: string,
    fecha_hasta?: string
  ): Promise<PaginatedResponse<Compra>> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (numero_factura) query.append('numero_factura', numero_factura);
    if (fecha_desde) query.append('fecha_desde', fecha_desde);
    if (fecha_hasta) query.append('fecha_hasta', fecha_hasta);

    const response = await fetch(`${API_URL}/compras?${query}`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener compras');
    }

    return {
      data: body.data,
      meta: {
        total: body.meta?.total || body.data.length,
        page: body.meta?.page || 1,
        totalPages: body.meta?.totalPages || 1
      }
    };
  }

  async getCompra(id: number): Promise<Compra> {
    const response = await fetch(`${API_URL}/compras/${id}`, {
      headers: this.getHeaders(true),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al obtener compra');
    }

    return body.data;
  }

  async createCompra(data: CreateCompraPayload): Promise<Compra> {
    const response = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || body.mensaje || 'Error al crear compra');
    }

    return body.data;
  }

  async getTasaVigente(monedaOrigenId: number): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/tasas/vigente/${monedaOrigenId}`, {
        headers: this.getHeaders(true),
      });
      const body = await response.json();
      if (!response.ok) return 0;
      return body.data?.tasa || 0;
    } catch (err) {
      console.error('Error fetching tasa:', err);
      return 0;
    }
  }
}

export const api = new ApiService();
