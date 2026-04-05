import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Product, MONEDA_BS, MONEDA_COP } from '../types';
import { api } from '../services/api';

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void;
}

export default function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasas, setTasas] = useState({ ves: 36.5, cop: 4000 }); // Default/Fallback rates

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Load official rates
    const fetchRates = async () => {
      try {
        const rateVes = await api.getTasaVigente(MONEDA_BS);
        const rateCop = await api.getTasaVigente(MONEDA_COP);
        setTasas({
          ves: rateVes || 36.5,
          cop: rateCop || 4000
        });
      } catch (error) {
        console.error('Error fetching rates:', error);
      }
    };
    fetchRates();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.getProductos(1, 20, search, true);
      const mappedProducts: Product[] = response.data.map(p => ({
        ...p,
        precio_base: p.precio_base || 0,
        unidad_medida: p.unidad_medida?.nombre || 'Unidades',
        categoria: p.categoria?.nombre || 'General',
        inventario_general: {
          cantidad_actual: typeof p.inventario_general === 'object' && p.inventario_general ? Number(p.inventario_general.cantidad_actual) : Number(p.inventario_general || 0)
        }
      } as any));
      setProducts(mappedProducts);

    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search Bar - Mockup Style */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-outline" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/40 text-on-surface text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-medium">Buscando productos...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant/60">
            <Search className="mx-auto mb-4 opacity-20" size={64} />
            <p className="text-lg font-bold">
              {search ? 'No se encontraron productos' : 'Empieza a escribir para buscar'}
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
            {products.map(product => {
              const stock = product.inventario_general.cantidad_actual;
              const isKilograms = product.unidad_medida === 'Kilogramos';
              
              return (
                <button
                  key={product.id_producto}
                  onClick={() => onSelectProduct(product)}
                  className="bg-surface-container-lowest p-4 rounded-xl text-left border border-outline-variant/20 hover:border-primary/40 hover:bg-surface transition-all group active:scale-95 duration-150 shadow-sm flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{product.codigo_barra || 'SIN-COD'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stock <= 5 ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed/30 text-on-primary-fixed'}`}>
                      Stock: {stock.toFixed(3)} {isKilograms ? 'kg' : 'und'}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-on-surface text-md line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                    {product.nombre}
                  </h3>

                  <div className="mt-auto pt-3 border-t border-outline-variant/10 flex justify-between items-end">
                    <div>
                      <p className="text-primary-container font-black text-xl">
                        $ {fmt(product.precio_base)} 
                        <span className="text-[10px] font-normal text-on-surface-variant ml-1">/{isKilograms ? 'kg' : 'und'}</span>
                      </p>
                    </div>
                    
                    {/* Multi-Currency Side Panel */}
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[8px] font-black text-on-secondary-container/60 uppercase">COP</span>
                        <span className="text-xs font-bold text-on-surface">${Math.round(product.precio_base * tasas.cop).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[8px] font-black text-emerald-800/60 uppercase">VES</span>
                        <span className="text-xs font-bold text-on-surface">Bs.{fmt(product.precio_base * tasas.ves)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
