import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product, UNIDAD_KILOGRAMOS } from '../types';

interface QuantityInputProps {
  product: Product;
  value: number;
  onChange: (value: number) => void;
}

export default function QuantityInput({ product, value, onChange }: QuantityInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const isKg = product.unidad_medida === UNIDAD_KILOGRAMOS;
  const step = isKg ? 0.05 : 1;
  const decimals = isKg ? 3 : 0;

  useEffect(() => {
    setDisplayValue(value.toFixed(decimals));
  }, [value, decimals]);

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue);

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      if (isKg && inputValue.length <= 4 && !inputValue.includes('.')) {
        const converted = numValue / 1000;
        onChange(parseFloat(converted.toFixed(3)));
      } else {
        onChange(parseFloat(numValue.toFixed(decimals)));
      }
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(displayValue);
    if (isNaN(numValue) || numValue < 0) {
      setDisplayValue('0');
      onChange(0);
    } else {
      setDisplayValue(numValue.toFixed(decimals));
      onChange(parseFloat(numValue.toFixed(decimals)));
    }
  };

  const increment = () => {
    const newValue = value + step;
    onChange(parseFloat(newValue.toFixed(decimals)));
  };

  const decrement = () => {
    const newValue = Math.max(0, value - step);
    onChange(parseFloat(newValue.toFixed(decimals)));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={decrement}
        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        <Minus className="w-4 h-4 text-gray-700" />
      </button>

      <input
        type="number"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        step={step}
        min="0"
        className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <button
        onClick={increment}
        className="w-8 h-8 flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>

      <span className="text-sm text-gray-600 ml-1">
        {isKg ? 'kg' : 'unid'}
      </span>
    </div>
  );
}
