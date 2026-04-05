import { useState, useEffect } from 'react';
import { X, RefreshCcw, Info } from 'lucide-react';
import { api } from '../services/api';
import { MONEDA_BS, MONEDA_COP } from '../types';

interface ActualizarTasasModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ActualizarTasasModal({ onClose, onSuccess }: ActualizarTasasModalProps) {
  const [ves, setVes] = useState<string>('');
  const [cop, setCop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rateVes = await api.getTasaVigente(MONEDA_BS);
        const rateCop = await api.getTasaVigente(MONEDA_COP);
        setVes(rateVes ? rateVes.toString() : '0');
        setCop(rateCop ? rateCop.toString() : '0');
      } catch (err) {
        console.error('Error fetching rates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const handleUpdate = async () => {
    const vesNum = parseFloat(ves);
    const copNum = parseFloat(cop);
    if (!ves || !cop || isNaN(vesNum) || isNaN(copNum) || vesNum <= 0 || copNum <= 0) {
      setError('Por favor, ingresa tasas válidas mayores que 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateTasa(MONEDA_BS, vesNum);
      await api.updateTasa(MONEDA_COP, copNum);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err.message || 'Error al actualizar tasas';
      if (msg.includes('403') || msg.toLowerCase().includes('permiso') || msg.toLowerCase().includes('forbidden')) {
        setError('No tienes permisos para actualizar tasas (requiere GESTION_TASAS)');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div className="relative bg-white p-8 rounded-2xl shadow-xl flex items-center gap-4">
          <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
          <span className="font-bold text-on-surface">Cargando tasas actuales...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Glass Overlay */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
        {/* Header with Close Action */}
        <div className="relative bg-gradient-to-br from-primary to-primary-container p-10 text-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 mb-6 ring-1 ring-white/30 rotate-3 transition-transform hover:rotate-6">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
          </div>
          
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2 uppercase">Actualizar Tasas de Cambio</h2>
          <p className="text-primary-fixed font-medium opacity-90 text-lg">Referencia base: 1 USD (Dólar Estadounidense)</p>
        </div>

        {/* Form Content */}
        <div className="p-10">
          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-primary-fixed text-on-primary-fixed rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ¡Tasas actualizadas correctamente!
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            {/* VES Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em]">Bolívares (VES)</label>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-high rounded text-secondary/70 tracking-wider">ACTUAL: {ves}</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                </div>
                <input 
                  type="number"
                  step="0.01"
                  value={ves}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      setVes(val.substring(1));
                    } else {
                      setVes(val);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low border-2 border-transparent rounded-xl py-5 pl-14 pr-4 text-2xl font-headline font-bold text-on-surface focus:ring-0 focus:border-primary/30 focus:bg-white transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-5 flex items-center text-on-surface-variant/60 font-bold text-xs tracking-wider">
                  VES / USD
                </div>
              </div>
            </div>

            {/* COP Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em]">Pesos Colombianos (COP)</label>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-high rounded text-secondary/70 tracking-wider">ACTUAL: {cop}</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
                <input 
                  type="number"
                  step="0.01"
                  value={cop}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      setCop(val.substring(1));
                    } else {
                      setCop(val);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low border-2 border-transparent rounded-xl py-5 pl-14 pr-4 text-2xl font-headline font-bold text-on-surface focus:ring-0 focus:border-primary/30 focus:bg-white transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-5 flex items-center text-on-surface-variant/60 font-bold text-xs tracking-wider">
                  COP / USD
                </div>
              </div>
            </div>
          </div>

          {/* Global Notice */}
          <div className="mt-10 p-5 rounded-xl bg-surface-container-low border border-outline-variant/10 flex items-start gap-4">
            <div className="p-2.5 bg-white rounded-lg shadow-sm">
              <Info className="text-primary w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface-variant mb-1">Impacto Global</p>
              <p className="text-xs text-secondary leading-relaxed font-medium">Esta actualización modificará automáticamente el precio proyectado de todos los productos y recalculará los totales en multimoneda en el sistema POS.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex items-center gap-4">
            <button 
              onClick={handleUpdate}
              disabled={saving}
              className="flex-[2] bg-primary text-white font-headline font-bold py-5 rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {saving ? 'Actualizando...' : 'Confirmar Cambio de Tasas'}
              {!saving && <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
            </button>
            <button 
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-surface-container-high text-on-surface font-headline font-bold py-5 rounded-xl hover:bg-surface-container-highest transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Descartar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low p-5 text-center border-t border-outline-variant/10">
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">Última actualización: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
