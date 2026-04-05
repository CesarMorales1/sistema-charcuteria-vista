export interface Product {
  id_producto: number;
  codigo_barra?: string | null;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  id_unidad_medida: number;
  unidad_medida: string | { nombre: string; abreviatura: string };
  id_categoria: number;
  categoria: string | { nombre: string };
  inventario_general: {
    cantidad_actual: number;
  };
}

export interface CartItem {
  product: Product;
  cantidad: number;
  precio_unitario: number;
}

export const UNIDAD_KILOGRAMOS = 'Kilogramos';
export const IVA_ALICUOTA = 16;
export const MONEDA_USD = 1; // ID for USD in the database
export const MONEDA_BS = 2;  // ID for Bolivares in the database
export const MONEDA_COP = 3; // ID for Pesos Colombianos in the database
