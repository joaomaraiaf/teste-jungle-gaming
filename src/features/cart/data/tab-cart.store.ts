import { z } from 'zod';
import { cartItemSchema } from './schemas/cart.schema';

export const TAB_CART_STORAGE_KEY = 'kurio:checkout-cart:v1';
const schema = z.object({ ownerId: z.uuid().nullable(), items: z.array(cartItemSchema).max(100) });
export type TabCart = z.infer<typeof schema>;
export function readTabCart(): TabCart {
  try {
    const raw = window.sessionStorage.getItem(TAB_CART_STORAGE_KEY);
    return raw ? schema.parse(JSON.parse(raw)) : { ownerId: null, items: [] };
  } catch {
    return { ownerId: null, items: [] };
  }
}
export function writeTabCart(cart: TabCart) {
  try {
    window.sessionStorage.setItem(TAB_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* In-memory cart remains usable when browser storage is unavailable. */
  }
}
