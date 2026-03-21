import { useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Product, UNIDAD_KILOGRAMOS } from '../types';
import QuantityInput from './QuantityInput';

interface AddToCartModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, cantidad: number) => void;
}

export default function AddToCartModal({ product, onClose, onAdd }: AddToCartModalProps) {
  const productUnit = typeof product.unidad_medida === 'string' 
    ? product.unidad_medida 
    : (product.unidad_medida as any)?.nombre;

  const isKg = productUnit === UNIDAD_KILOGRAMOS;
  const [cantidad, setCantidad] = useState(isKg ? 0.250 : 1);

  const handleAdd = () => {
    if (cantidad > 0) {
      onAdd(product, cantidad);
      onClose();
    }
  };

  const lineTotal = cantidad * product.precio_base;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Agregar Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {product.nombre}
          </h3>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{product.codigo_barra}</span>
            <span className="font-semibold text-blue-600">
              ${product.precio_base.toFixed(2)} / {isKg ? 'kg' : 'unid'}
            </span>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cantidad:
          </label>
          <div className="flex justify-center">
            <QuantityInput
              product={product}
              value={cantidad}
              onChange={setCantidad}
            />
          </div>
          {isKg && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tip: Puedes ingresar gramos (ej: 250) y se convertirá automáticamente a kg (0.250)
            </p>
          )}
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${lineTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={cantidad <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
