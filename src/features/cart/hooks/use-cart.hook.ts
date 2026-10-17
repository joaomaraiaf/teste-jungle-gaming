import { useContext } from 'react';
import { CartContext } from '../components/cart-provider';

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error('useCart precisa ser usado dentro de CartProvider.');
  }

  return cart;
}
