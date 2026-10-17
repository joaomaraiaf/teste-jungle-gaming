import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';
export interface QuoteTotals {
  subtotalEth: string;
  discountEth: string;
  estimatedFeeEth: string;
  totalEth: string;
}
export interface QuoteIssue {
  code: 'PRICE_CHANGED' | 'QUANTITY_ADJUSTED' | 'SOLD_OUT' | 'COUPON_EXPIRED';
  nftId?: string;
  editionId?: string;
  message: string;
}
export interface Quote {
  id: string;
  cartId: string;
  cartVersion: number;
  network: 'ethereum' | 'polygon' | 'solana';
  pricingVersion: number;
  userId: string;
  createdAt: string;
  status: 'valid' | 'review-required' | 'unavailable';
  items: CartItem[];
  nftVersions: Record<string, number>;
  couponCode: string | null;
  totals: QuoteTotals;
  issues: QuoteIssue[];
}
export interface QuoteInput {
  previousQuoteId?: string;
  cartId: string;
  cartVersion: number;
  network: 'ethereum' | 'polygon' | 'solana';
}
