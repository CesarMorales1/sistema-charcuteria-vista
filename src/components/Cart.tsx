import { useState, useEffect } from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { UNIDAD_KILOGRAMOS, IVA_ALICUOTA, MONEDA_BS, MONEDA_COP } from '../types';
import { api } from '../services/api';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getIVA, getTotal } = useCart();
  const [tasas, setTasas] = useState({ ves: 36.5, cop: 3920 });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rateVes = await api.getTasaVigente(MONEDA_BS);
        const rateCop = await api.getTasaVigente(MONEDA_COP);
        setTasas({
          ves: rateVes || 36.5,
          cop: rateCop || 3920
        });
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    };
    fetchRates();
  }, []);

  const subtotal = getSubtotal();
  const iva = getIVA(IVA_ALICUOTA);
  const totalUsd = getTotal(IVA_ALICUOTA);
  
  const totalVes = totalUsd * tasas.ves;
  const totalCop = totalUsd * tasas.cop;

  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 py-20">
        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-bold">Carrito vacío</p>
        <p className="text-sm">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
      {/* Cart Header */}
      <div className="p-6 bg-surface-container-lowest border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold brand-font text-on-surface">Carrito de Venta</h2>
          <span className="bg-primary-fixed text-on-primary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold">MULTIMONEDA</span>
        </div>
        <div className="flex items-center text-xs font-bold text-outline tracking-widest uppercase">
          <span className="flex-1">Producto</span>
          <span className="w-24 text-center">Cant.</span>
          <span className="w-24 text-right">Subtotal</span>
        </div>
      </div>

      {/* Scrollable Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map(item => {
          const lineTotal = item.cantidad * item.precio_unitario;
          const productUnit = typeof item.product.unidad_medida === 'string' 
            ? item.product.unidad_medida 
            : (item.product.unidad_medida as any)?.nombre;
          const isKg = productUnit === UNIDAD_KILOGRAMOS;

          return (
            <div key={item.product.id_producto} className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 border border-outline-variant/10 shadow-sm group">
              <div className="flex-1">
                <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">{item.product.nombre}</h4>
                <p className="text-xs text-on-surface-variant">$ {fmt(item.precio_unitario)} / {isKg ? 'kg' : 'und'}</p>
              </div>
              
              <div className="flex items-center gap-2 bg-surface-container p-1 rounded-lg">
                <button 
                  onClick={() => updateQuantity(item.product.id_producto, Math.max(0, item.cantidad - (isKg ? 0.05 : 1)))}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-variant transition-colors text-on-surface/60 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <input 
                  className="w-12 bg-transparent border-none p-0 text-center text-sm font-bold focus:ring-0 text-on-surface" 
                  type="text" 
                  value={item.cantidad.toFixed(isKg ? 3 : 0)}
                  readOnly
                />
                <button 
                  onClick={() => updateQuantity(item.product.id_producto, item.cantidad + (isKg ? 0.05 : 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-variant transition-colors text-on-surface/60 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>

              <div className="w-24 text-right flex flex-col items-end">
                <button 
                  onClick={() => removeItem(item.product.id_producto)}
                  className="mb-1 text-on-surface-variant/20 hover:text-error transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <p className="font-bold text-on-surface">$ {fmt(lineTotal)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Currency Financial Summary */}
      <div className="p-6 bg-surface-container-high space-y-4 border-t border-outline-variant/10">
        <div className="space-y-1">
          <div className="flex justify-between text-sm font-medium text-on-surface-variant">
            <span>Subtotal</span>
            <span>$ {fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-on-surface-variant">
            <span>IVA ({IVA_ALICUOTA}%)</span>
            <span>$ {fmt(iva)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-outline-variant/20 space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-secondary uppercase tracking-tight opacity-70">Total (USD)</span>
            <p className="text-4xl font-extrabold brand-font text-primary-container leading-none">$ {fmt(totalUsd)}</p>
          </div>

          {/* Other Currencies Panel */}
          <div className="bg-surface-container-lowest/60 rounded-xl p-4 space-y-2 border border-outline-variant/10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-secondary uppercase opacity-60">Pesos (COP)</span>
              <span className="font-headline font-bold text-lg text-on-surface">
                {Math.round(totalCop).toLocaleString('es-CO')} <span className="text-[10px]">COP</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-800 uppercase opacity-70">Bolívares (VES)</span>
              <span className="font-headline font-bold text-lg text-on-surface">Bs. {fmt(totalVes)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-outline-variant/10 flex justify-center">
              <p className="text-[10px] uppercase font-bold text-outline tracking-wider opacity-60">Tasa: 1 USD = {tasas.ves} VES</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={onCheckout}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-extrabold text-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">payments</span>
          Procesar Venta
        </button>
      </div>
    </div>
  );
}
