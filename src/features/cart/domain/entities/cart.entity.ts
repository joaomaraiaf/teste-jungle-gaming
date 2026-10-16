import type { CartItem } from './cart-item.entity';

export interface CartSelection {
  nftId: string;
  editionId: string;
  quantity: number;
}
export interface CartTotals {
  subtotalEth: string;
  discountEth: string;
  estimatedFeeEth: string;
  totalEth: string;
}
export interface Cart {
  id: string;
  userId: string | null;
  version: number;
  items: CartItem[];
  couponCode: string | null;
  totals: CartTotals;
}
export interface CartMergeResult {
  cart: Cart;
  adjustments: {
    nftId: string;
    editionId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}
