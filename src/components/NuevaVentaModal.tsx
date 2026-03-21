import { useState, useEffect, useCallback } from 'react';
import { X, Search, Trash2, ShoppingBag, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { inventarioApi, ProductoInventario } from '../services/inventarioApi';
import { ventasApi } from '../services/ventasApi';

interface ItemVenta {
  id_producto: number;
  nombre: string;
  codigo_barra: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  unidad_medida: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const fmt2 = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function NuevaVentaModal({ isOpen, onClose, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductoInventario[]>([]);
  const [searching, setSearching] = useState(false);

  // Carrito / Detalles de venta
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [reportableSeniat, setReportableSeniat] = useState(false);
  const [alicuotaIva] = useState(16);
  const [observacion, setObservacion] = useState('');

  // Totales
  const subtotal = items.reduce((acc, item) => acc + item.subtotal_linea, 0);
  const montoIva = reportableSeniat ? (subtotal * alicuotaIva / 100) : 0;
  const total = subtotal + montoIva;

  const handleSearch = useCallback(async (val: string) => {
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await inventarioApi.getProductos(1, 10, val);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const addItem = (prod: ProductoInventario) => {
    const existing = items.find(i => i.id_producto === prod.id_producto);
    if (existing) {
      updateItem(prod.id_producto, existing.cantidad + 1);
    } else {
      setItems([...items, {
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        codigo_barra: prod.codigo_barra || '',
        cantidad: 1,
        precio_unitario: 0,
        subtotal_linea: 0,
        unidad_medida: prod.unidad_medida?.abreviatura || 'unid'
      }]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateItem = (id: number, cant: number, precio?: number) => {
    setItems(items.map(item => {
      if (item.id_producto === id) {
        const nCant = Math.max(0.001, cant);
        const nPrecio = precio !== undefined ? Math.max(0, precio) : item.precio_unitario;
        return {
          ...item,
          cantidad: nCant,
          precio_unitario: nPrecio,
          subtotal_linea: nCant * nPrecio
        };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id_producto !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }
    if (items.some(i => i.precio_unitario <= 0)) {
        setError('Todos los precios deben ser mayores a cero');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      await ventasApi.crearVenta({
        detalles: items.map(i => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        })),
        reportable_seniat: reportableSeniat,
        alicuota_iva: alicuotaIva,
        observacion: observacion || undefined
      });
      setSuccess(true);
      onRefresh();
      setTimeout(() => {
        onClose();
        reset();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setItems([]);
    setSearchTerm('');
    setReportableSeniat(false);
    setObservacion('');
    setSuccess(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 scale-in-center overflow-none">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">Nueva Venta</h3>
              <p className="text-emerald-100 text-xs mt-0.5">Generación de factura / comprobante</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Search and Products */}
          <div className="w-1/3 border-r border-gray-100 flex flex-col p-6 space-y-4 bg-gray-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="text-emerald-500 animate-spin" size={24} />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(prod => (
                  <button
                    key={prod.id_producto}
                    onClick={() => addItem(prod)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-700">{prod.nombre}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400 font-mono italic">{prod.codigo_barra}</p>
                      <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Stock: {prod.stock_general}</p>
                    </div>
                  </button>
                ))
              ) : searchTerm.length >= 2 ? (
                <p className="text-center py-8 text-gray-400 text-sm italic">No se encontraron productos</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 opacity-60">
                    <Search size={40} />
                    <p className="text-xs font-bold uppercase tracking-widest mt-3">Busca un producto</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Cart and Totals */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <ShoppingBag size={64} className="mb-4 text-emerald-100" />
                    <p className="text-lg font-bold">Carrito vacío</p>
                    <p className="text-sm">Selecciona productos de la izquierda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id_producto} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{item.nombre}</p>
                        <p className="text-[10px] text-gray-400 italic">Cod: {item.codigo_barra}</p>
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Cantidad</label>
                        <div className="flex items-center gap-1">
                            <input
                            type="number"
                            step="any"
                            value={item.cantidad}
                            onChange={(e) => updateItem(item.id_producto, parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-50 border-none text-xs font-bold p-1.5 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] text-gray-400 font-bold">{item.unidad_medida}</span>
                        </div>
                      </div>
                      <div className="w-32">
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Precio Unit. (Bs)</label>
                        <input
                          type="number"
                          step="any"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(item.id_producto, item.cantidad, parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border-none text-xs font-black p-1.5 rounded-lg text-emerald-600 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="w-24 text-right">
                        <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Subtotal</label>
                        <p className="text-sm font-black text-gray-900 italic">Bs.{fmt2(item.subtotal_linea)}</p>
                      </div>
                      <button onClick={() => removeItem(item.id_producto)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Bar: Options and Summary */}
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-8 items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReportableSeniat(!reportableSeniat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      reportableSeniat 
                        ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' 
                        : 'bg-white border-gray-200 text-gray-400 grayscale'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    REPORTE SENIAT (LEGAL)
                  </button>
                  {reportableSeniat && (
                    <span className="text-[10px] font-bold text-amber-600 animate-pulse">Aplica IVA {alicuotaIva}%</span>
                  )}
                </div>
                <textarea
                  placeholder="Observación de la venta..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px] resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal:</span>
                  <span className="font-bold">Bs. {fmt2(subtotal)}</span>
                </div>
                {reportableSeniat && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>IVA ({alicuotaIva}%):</span>
                    <span className="font-bold">Bs. {fmt2(montoIva)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                  <span className="font-black text-gray-900 uppercase">Total:</span>
                  <span className="font-black text-emerald-600 italic">Bs. {fmt2(total)}</span>
                </div>
                
                <button
                  disabled={loading || items.length === 0 || success}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 mt-4 ${
                    success ? 'bg-emerald-500 cursor-default' :
                    items.length === 0 ? 'bg-gray-300 cursor-not-allowed' :
                    'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 /> : 'Procesar Venta'}
                  {success ? '¡Venta Exitosa!' : loading ? 'Procesando...' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
            <div className="px-8 py-3 bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                {error}
            </div>
        )}
      </div>
    </div>
  );
}
