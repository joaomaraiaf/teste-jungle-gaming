import { type ReactNode, createContext } from 'react';
import { useCartViewModel } from '../hooks/use-cart-view-model.hook';
export const CartContext = createContext<ReturnType<typeof useCartViewModel> | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const value = useCartViewModel();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
