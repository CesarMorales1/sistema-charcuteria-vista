const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
}

export const api = new ApiService();
