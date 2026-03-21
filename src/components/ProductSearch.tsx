import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
}

export default function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.getProductos(1, 10, search, true);
      const mappedProducts: Product[] = response.data.map(p => ({
        ...p,
        precio_base: p.precio_base || 0,
        unidad_medida: p.unidad_medida?.nombre || 'Unidades',
        categoria: p.categoria?.nombre || 'General',
        inventario_general: {
          cantidad_actual: typeof p.inventario_general === 'object' && p.inventario_general ? Number(p.inventario_general.cantidad_actual) : Number(p.inventario_general || 0)
        }
      } as any)); // Use any cast temporarily if types still clash slightly
      setProducts(mappedProducts);

    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar productos por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading && (
          <div className="text-center py-8 text-gray-500">Cargando productos...</div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {search ? 'No se encontraron productos' : 'Busca un producto para comenzar'}
          </div>
        )}

        {!loading && products.map(product => (
          <button
            key={product.id_producto}
            onClick={() => onSelectProduct(product)}
            className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{product.nombre}</h3>
              <span className="text-lg font-bold text-blue-600">
                ${product.precio_base.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{product.codigo_barra}</span>
              <span className="text-gray-500">
                Stock: {typeof product.inventario_general === 'object' && product.inventario_general !== null ? product.inventario_general.cantidad_actual.toFixed(3) : '0.000'} {product.unidad_medida === 'Kilogramos' ? 'kg' : 'unid'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
