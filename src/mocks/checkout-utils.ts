import type { Cart, CartSelection } from '@/features/cart/domain/entities/cart.entity';
import { calculateCartTotals } from '@/features/cart/domain/entities/cart-totals';
import { COUPON_FIXTURES } from './commerce-scenarios';
import type { CommerceState } from './commerce-store';
export class CheckoutError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}
export const checkoutFail = (status: number, code: string, message: string): never => {
  throw new CheckoutError(status, code, message);
};
export function couponRate(code: string | null, now: number, expiredCoupons: string[] = []) {
  if (code && expiredCoupons.includes(code)) return 0;
  const coupon = COUPON_FIXTURES.find((item) => item.code === code);
  return coupon && (!coupon.expiresAt || Date.parse(coupon.expiresAt) > now)
    ? coupon.discountBasisPoints
    : 0;
}
export function canonicalItem(state: CommerceState, selection: CartSelection) {
  const nft = state.catalog?.find((item) => item.id === selection.nftId);
  const edition = nft?.editions.find((item) => item.id === selection.editionId);
  if (!nft || !edition) return checkoutFail(404, 'NFT_NOT_FOUND', 'NFT ou edição não disponível.');
  return {
    ...selection,
    name: nft.name,
    imageUrl: nft.imageUrl,
    collection: nft.collection,
    tokenId: nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id,
    editionName: edition.name,
    unitPriceEth: edition.priceEth,
    available: edition.available,
  };
}
export function refreshCart(state: CommerceState, cart: Cart, now: number) {
  cart.items = cart.items.map((item) => canonicalItem(state, item));
  cart.totals = calculateCartTotals(
    cart.items,
    couponRate(cart.couponCode, now, state.expiredCoupons)
  );
}
export function stableOrderInput(input: {
  quoteId: string;
  connectionId: string;
  collector: object;
}) {
  return JSON.stringify([
    input.quoteId,
    input.connectionId,
    Object.entries(input.collector).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
