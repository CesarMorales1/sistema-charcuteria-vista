import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ActualizarTasasModal from '../components/ActualizarTasasModal';
import { TrendingUp, RefreshCcw, Info } from 'lucide-react';
import { api } from '../services/api';
import { MONEDA_BS, MONEDA_COP } from '../types';

export default function Tasas() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [tasas, setTasas] = useState({ ves: 0, cop: 0, loading: true });

  const fetchRates = useCallback(async () => {
    setTasas(prev => ({ ...prev, loading: true }));
    try {
      const ves = await api.getTasaVigente(MONEDA_BS);
      const cop = await api.getTasaVigente(MONEDA_COP);
      setTasas({ ves: ves || 0, cop: cop || 0, loading: false });
    } catch {
      setTasas(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-10 transition-all">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1">Gestión de Tasas</h1>
              <p className="text-on-surface-variant text-sm font-medium opacity-70">Control centralizado de conversión multimoneda (USD, VES, COP)</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Actualizar Tasas
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info Card */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-5 mb-6">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-on-surface">Tasas Vigentes</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Moneda base: Dólar Estadounidense (USD)</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Bolívares (VES)</span>
                      <p className="text-[10px] text-on-surface-variant/50 font-medium mt-0.5">por 1 USD</p>
                    </div>
                    {tasas.loading ? (
                      <span className="text-sm text-outline animate-pulse">Cargando...</span>
                    ) : (
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">{fmt(tasas.ves)}</span>
                        <span className="text-xs font-bold text-on-surface-variant/60 ml-1">Bs.</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Pesos (COP)</span>
                      <p className="text-[10px] text-on-surface-variant/50 font-medium mt-0.5">por 1 USD</p>
                    </div>
                    {tasas.loading ? (
                      <span className="text-sm text-outline animate-pulse">Cargando...</span>
                    ) : (
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">{Math.round(tasas.cop).toLocaleString('es-CO')}</span>
                        <span className="text-xs font-bold text-on-surface-variant/60 ml-1">COP</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Card */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <span className="material-symbols-outlined text-8xl">history</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-6">Actividad Reciente</h3>
                <div className="space-y-6">
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    El historial de cambios de tasa se registrará automáticamente aquí. Actualmente el sistema utiliza las tasas vigentes configuradas para todos los cálculos del POS.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                    <span>Ver Log de Auditoría</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Tips / Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#006a37] to-[#108548] p-8 rounded-3xl text-white shadow-xl shadow-primary/10">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                   <Info size={24} />
                </div>
                <h4 className="font-bold text-lg mb-3">Consejo Pro</h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium">
                  Actualiza las tasas al inicio de cada jornada para asegurar que los precios en Bolívares y Pesos sean exactos según el mercado.
                </p>
              </div>

              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
                <h4 className="font-bold text-on-surface mb-4">Seguridad</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                  Solo los usuarios con permisos de administración pueden aplicar cambios globales a las tasas de cambio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <ActualizarTasasModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchRates} 
          />
        )}
      </main>
    </div>
  );
}
