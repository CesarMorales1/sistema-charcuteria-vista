import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, cantidad: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, cantidad: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getIVA: (alicuota: number) => number;
  getTotal: (alicuota: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, cantidad: number) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        item => item.product.id_producto === product.id_producto
      );

      if (existingIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          cantidad: newItems[existingIndex].cantidad + cantidad
        };
        return newItems;
      }

      return [...prevItems, {
        product,
        cantidad,
        precio_unitario: product.precio_base
      }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(prevItems => prevItems.filter(
      item => item.product.id_producto !== productId
    ));
  };

  const updateQuantity = (productId: number, cantidad: number) => {
    setItems(prevItems => prevItems.map(item =>
      item.product.id_producto === productId
        ? { ...item, cantidad }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.cantidad * item.precio_unitario);
    }, 0);
  };

  const getIVA = (alicuota: number) => {
    return getSubtotal() * (alicuota / 100);
  };

  const getTotal = (alicuota: number) => {
    return getSubtotal() + getIVA(alicuota);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      getIVA,
      getTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
