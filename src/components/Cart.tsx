import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { UNIDAD_KILOGRAMOS, IVA_ALICUOTA } from '../types';
import QuantityInput from './QuantityInput';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getIVA, getTotal } = useCart();

  const subtotal = getSubtotal();
  const iva = getIVA(IVA_ALICUOTA);
  const total = getTotal(IVA_ALICUOTA);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <ShoppingCart className="w-16 h-16 mb-4" />
        <p className="text-lg">Carrito vacío</p>
        <p className="text-sm">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {items.map(item => {
          const lineTotal = item.cantidad * item.precio_unitario;
          const isKg = (typeof item.product.unidad_medida === 'string' 
            ? item.product.unidad_medida 
            : (item.product.unidad_medida as any)?.nombre) === UNIDAD_KILOGRAMOS;


          return (
            <div
              key={item.product.id_producto}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 flex-1">
                  {item.product.nombre}
                </h3>
                <button
                  onClick={() => removeItem(item.product.id_producto)}
                  className="text-red-500 hover:text-red-700 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center mb-3">
                <QuantityInput
                  product={item.product}
                  value={item.cantidad}
                  onChange={(newQty) => updateQuantity(item.product.id_producto, newQty)}
                />
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    ${item.precio_unitario.toFixed(2)} × {item.cantidad.toFixed(isKg ? 3 : 0)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <span className="text-lg font-bold text-blue-600">
                  ${lineTotal.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-300 pt-4 space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>IVA ({IVA_ALICUOTA}%):</span>
          <span className="font-semibold">${iva.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-300">
          <span>Total USD:</span>
          <span className="text-blue-600">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg shadow-lg"
        >
          Procesar Venta
        </button>
      </div>
    </div>
  );
}
