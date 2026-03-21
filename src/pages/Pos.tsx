import { useState } from 'react';
import { Store, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';
import AddToCartModal from '../components/AddToCartModal';
import CheckoutModal from '../components/CheckoutModal';
import { Product } from '../types';
import Sidebar from '../components/Sidebar';

function POSContent() {
  const { addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleAddToCart = (product: Product, cantidad: number) => {
    addItem(product, cantidad);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 cursor-default">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-md border-b border-gray-200 shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Registro de Ventas</h1>
                  <p className="text-sm text-gray-600"></p>
                </div>
              </div>
              <Link
                to="/ventas"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver a Ventas
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto h-full min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 flex flex-col min-h-[500px]">
                <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">Productos</h2>
                <div className="flex-1 overflow-hidden min-h-0">
                  <ProductSearch onSelectProduct={setSelectedProduct} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col min-h-[500px]">
                <h2 className="text-xl font-bold text-gray-900 mb-4 shrink-0">Carrito de Venta</h2>
                <div className="flex-1 overflow-hidden min-h-0">
                  <Cart onCheckout={() => setShowCheckout(true)} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedProduct && (
        <AddToCartModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={() => { }}
        />
      )}
    </div>
  );
}

export default function Pos() {
  return (
    <CartProvider>
      <POSContent />
    </CartProvider>
  );
}
