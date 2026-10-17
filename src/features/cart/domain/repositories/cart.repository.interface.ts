import type { Cart, CartMergeResult, CartSelection } from '../entities/cart.entity';

export interface ICartRepository {
  get(signal?: AbortSignal): Promise<Cart>;
  add(input: CartSelection): Promise<Cart>;
  update(input: CartSelection): Promise<Cart>;
  remove(nftId: string, editionId: string): Promise<Cart>;
  applyCoupon(code: string): Promise<Cart>;
  removeCoupon(): Promise<Cart>;
  merge(guestCartId: string): Promise<CartMergeResult>;
}
