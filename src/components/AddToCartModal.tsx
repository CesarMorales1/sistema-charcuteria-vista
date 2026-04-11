import { useState, useEffect } from 'react';
import { Product, MONEDA_BS, MONEDA_COP, UNIDAD_KILOGRAMOS } from '../types';
import { api } from '../services/api';

interface AddToCartModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, cantidad: number) => void;
}

export default function AddToCartModal({ product, onClose, onAdd }: AddToCartModalProps) {
  const [cantidad, setCantidad] = useState(0.250);
  const [tasas, setTasas] = useState({ ves: 36.5, cop: 3920 });

  const productUnit = typeof product.unidad_medida === 'string'
    ? product.unidad_medida
    : (product.unidad_medida as any)?.nombre;
  const isKg = productUnit === UNIDAD_KILOGRAMOS;

  useEffect(() => {
    // Inicializar cantidad basada en tipo de unidad
    setCantidad(isKg ? 0.250 : 1);

    // Cargar tasas reales
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
  }, [isKg]);

  const handleAdd = () => {
    if (cantidad > 0) {
      onAdd(product, cantidad);
      onClose();
    }
  };

  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalUsd = cantidad * product.precio_base;
  const totalVes = totalUsd * tasas.ves;
  const totalCop = totalUsd * tasas.cop;

  const updateQuantity = (val: number) => {
    setCantidad(Math.max(0, parseFloat(val.toFixed(3))));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh] scale-in-center">

        {/* Header: Product Title & Category */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-8 relative">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="text-on-primary/70 hover:text-on-primary transition-colors p-1 rounded-full hover:bg-white/10">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <span className="text-[10px] font-label font-bold text-on-primary/80 uppercase tracking-[0.25em] mb-2 block">
            Categoría: {typeof product.categoria === 'string' ? product.categoria : (product.categoria as any)?.nombre || 'General'}
          </span>
          <h2 className="text-3xl font-headline font-extrabold text-on-primary tracking-tight leading-tight">
            {product.nombre}
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="bg-white/10 text-on-primary px-2 py-0.5 rounded text-[11px] font-mono tracking-tighter border border-white/10">
              SKU: {product.codigo_barra || 'N/A'}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-on-primary/90 font-medium uppercase">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              En Stock: {typeof product.inventario_general === 'object' ? product.inventario_general.cantidad_actual.toFixed(3) : '0.000'} {isKg ? 'kg' : 'und'}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

          {/* Pricing & Quantity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            {/* Price Indicator */}
            <div className="space-y-1">
              <label className="text-[11px] font-label font-bold text-secondary uppercase tracking-widest opacity-60">
                Precio por {isKg ? 'Kg' : 'Unid'}
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-headline font-extrabold text-primary">$ {fmt(product.precio_base)}</span>
                <span className="text-sm font-medium text-secondary">/ {isKg ? 'kg' : 'und'}</span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2">
              <label className="text-[11px] font-label font-bold text-secondary uppercase tracking-widest opacity-60">
                Cantidad ({isKg ? 'Kg' : 'Unid'})
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 group transition-all border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary/20">
                <button
                  onClick={() => updateQuantity(cantidad - (isKg ? 0.05 : 1))}
                  className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-highest rounded-lg transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  className="flex-1 bg-transparent border-none text-center font-headline font-bold text-lg text-on-surface focus:ring-0 w-full"
                  type="number"
                  step={isKg ? "0.050" : "1"}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                />
                <button
                  onClick={() => updateQuantity(cantidad + (isKg ? 0.05 : 1))}
                  className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-highest rounded-lg transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Currency Display */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">Total Estimado</h3>
              <div className="text-[10px] font-medium text-secondary flex items-center gap-1 bg-surface-container-highest px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                Tasa: 1 USD = {tasas.ves} VES / {tasas.cop} COP
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-3">
                <span className="text-sm font-medium text-secondary">Dólares Estadounidenses</span>
                <span className="text-3xl font-headline font-extrabold text-on-surface">$ {fmt(totalUsd)}</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-secondary uppercase opacity-60">Bolívares (VES)</span>
                  <p className="text-xl font-headline font-bold text-on-surface-variant">Bs. {fmt(totalVes)}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] font-bold text-secondary uppercase opacity-60">Pesos (COP)</span>
                  <p className="text-xl font-headline font-bold text-on-surface-variant">
                    {Math.round(totalCop).toLocaleString('es-CO')} <span className="text-[10px]">COP</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAdd}
              disabled={cantidad <= 0}
              className="flex-1 order-1 sm:order-2 h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-headline font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Agregar Producto
            </button>
            <button
              onClick={onClose}
              className="px-8 order-2 sm:order-1 h-14 bg-surface-container-high text-on-surface rounded-xl font-headline font-semibold hover:bg-surface-container-highest active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
