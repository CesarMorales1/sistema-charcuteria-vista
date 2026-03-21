import { useState } from 'react';
import { X, Loader, AlertCircle, CheckCircle, ArrowUpDown } from 'lucide-react';
import { inventarioApi, ProductoInventario } from '../services/inventarioApi';

interface AjusteInventarioModalProps {
  producto: ProductoInventario;
  onClose: () => void;
  onCompleted: () => void;
}

export default function AjusteInventarioModal({ producto, onClose, onCompleted }: AjusteInventarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    tipo_inventario: 'general' as 'general' | 'legal' | 'ambos',
    tipo_movimiento: 'ajuste' as 'entrada' | 'salida' | 'ajuste',
    cantidad: '',
    observacion: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cantidad = Number(formData.cantidad);

    if (!formData.cantidad || isNaN(cantidad) || cantidad <= 0) {
      setError('Debe ingresar una cantidad válida mayor a 0');
      return;
    }

    if (!formData.observacion.trim()) {
      setError('Debe agregar una observación');
      return;
    }

    setLoading(true);

    try {
      await inventarioApi.ajusteInventario(producto.id_producto, {
        tipo_inventario: formData.tipo_inventario,
        tipo_movimiento: formData.tipo_movimiento,
        cantidad,
        observacion: formData.observacion.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onCompleted();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar ajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 pt-8 pb-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <ArrowUpDown size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ajuste de Inventario</h3>
              <p className="text-xs text-gray-500 mt-0.5">{producto.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">Ajuste registrado exitosamente</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Stock General Actual</p>
                <p className="text-lg font-bold text-gray-900 font-mono">
                  {(Number(producto.stock_general) || 0).toFixed(3)} {producto.unidad_medida?.abreviatura}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Stock Legal Actual</p>
                <p className="text-lg font-bold text-gray-900 font-mono">
                  {(Number(producto.stock_legal) || 0).toFixed(3)} {producto.unidad_medida?.abreviatura}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Inventario <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'general' as const, label: 'General' },
                { value: 'legal' as const, label: 'Legal (SENIAT)' },
                { value: 'ambos' as const, label: 'Ambos' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_inventario: value })}
                  disabled={loading || success}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    formData.tipo_inventario === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'entrada' as const, label: 'Entrada' },
                { value: 'salida' as const, label: 'Salida' },
                { value: 'ajuste' as const, label: 'Ajuste' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_movimiento: value })}
                  disabled={loading || success}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    formData.tipo_movimiento === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cantidad <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={formData.cantidad}
                onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm pr-16"
                placeholder="Ej: 10.500"
                disabled={loading || success}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                {producto.unidad_medida?.abreviatura}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.tipo_movimiento === 'entrada' && 'Se sumará al inventario actual'}
              {formData.tipo_movimiento === 'salida' && 'Se restará del inventario actual'}
              {formData.tipo_movimiento === 'ajuste' && 'Se establecerá como el nuevo stock'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observación <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.observacion}
              onChange={e => setFormData({ ...formData, observacion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none"
              rows={3}
              placeholder="Motivo del ajuste..."
              disabled={loading || success}
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={loading || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={14} className="animate-spin" />}
              Registrar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
