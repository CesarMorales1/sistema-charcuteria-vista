import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ventasApi } from '../services/ventasApi';
import { api } from '../services/api';
import { IVA_ALICUOTA, MONEDA_USD } from '../types';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ onClose, onSuccess }: CheckoutModalProps) {
  const { items, getTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [observacion, setObservacion] = useState('');
  const [tasa, setTasa] = useState(0);

  useEffect(() => {
    api.getTasaVigente(MONEDA_USD).then(val => setTasa(val || 1));
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const ventaRequest = {
        reportable_seniat: true,
        alicuota_iva: IVA_ALICUOTA,
        id_moneda: MONEDA_USD,
        tasa_referencia: tasa,
        observacion: observacion || 'Venta POS',
        detalles: items.map(item => ({
          id_producto: item.product.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        }))
      };

      await ventasApi.crearVenta(ventaRequest);

      setSuccess(true);
      clearCart();

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Confirmar Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Venta Exitosa</h3>
            <p className="text-gray-600">La venta ha sido registrada correctamente</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total a cobrar:
              </label>
              <div className="text-4xl font-bold text-blue-600">
                ${getTotal(IVA_ALICUOTA).toFixed(2)}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional):
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Cliente frecuente, pago en efectivo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
