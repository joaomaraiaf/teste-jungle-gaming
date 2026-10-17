import { calculateCartTotals } from '@/features/cart/domain/entities/cart-totals';
import type { Cart } from '@/features/cart/domain/entities/cart.entity';
import type { WalletNetwork } from '@/features/payment/domain/entities/wallet-connection.entity';
import type { Quote, QuoteIssue } from '@/features/quotes/domain/entities/quote.entity';
import { canonicalItem, checkoutFail, couponRate } from './checkout-utils';
import type { CommerceState } from './commerce-store';

export function evaluateQuote(
  state: CommerceState,
  cart: Cart,
  network: WalletNetwork,
  now: number,
  previous?: Quote
): Quote {
  if (!cart.userId || !cart.items.length)
    return checkoutFail(422, 'EMPTY_CART', 'Adicione um NFT ao carrinho.');
  const issues: QuoteIssue[] = [];
  const nftVersions: Record<string, number> = {};
  const items = cart.items.map((selection) => {
    const nft = state.catalog?.find((item) => item.id === selection.nftId);
    if (!nft || !nft.editions.some((edition) => edition.id === selection.editionId)) {
      issues.push({
        code: 'SOLD_OUT',
        nftId: selection.nftId,
        editionId: selection.editionId,
        message: 'Esta edição não está mais disponível.',
      });
      return { ...selection, available: 0 };
    }
    nftVersions[nft.id] = nft.version;
    const item = canonicalItem(state, selection);
    const old = (previous?.items ?? cart.items).find(
      (old) => old.nftId === item.nftId && old.editionId === item.editionId
    );
    if (old?.unitPriceEth !== item.unitPriceEth)
      issues.push({
        code: 'PRICE_CHANGED',
        nftId: nft.id,
        editionId: item.editionId,
        message: 'O preço mudou. Revise os novos valores.',
      });
    if (!item.available)
      issues.push({
        code: 'SOLD_OUT',
        nftId: nft.id,
        editionId: item.editionId,
        message: 'Esta edição esgotou.',
      });
    else if (item.quantity > item.available) {
      item.quantity = item.available;
      issues.push({
        code: 'QUANTITY_ADJUSTED',
        nftId: nft.id,
        editionId: item.editionId,
        message: 'A quantidade foi limitada ao estoque disponível.',
      });
    }
    return item;
  });
  const rate = couponRate(cart.couponCode, now, state.expiredCoupons);
  const code = cart.couponCode && rate ? cart.couponCode : null;
  if (cart.couponCode && !rate)
    issues.push({
      code: 'COUPON_EXPIRED',
      message: 'O cupom não é mais válido. Revise o total sem desconto.',
    });
  const totals = calculateCartTotals(items, rate);
  const quote: Quote = {
    id: crypto.randomUUID(),
    userId: cart.userId,
    cartId: cart.id,
    cartVersion: cart.version,
    network,
    pricingVersion: state.pricingVersion,
    createdAt: new Date(now).toISOString(),
    status: issues.some((issue) => issue.code === 'SOLD_OUT') ? 'unavailable' : 'valid',
    items,
    nftVersions,
    couponCode: code,
    totals,
    issues,
  };
  if (
    quote.status !== 'unavailable' &&
    (issues.length || (previous && !sameQuoteValues(previous, quote)))
  )
    quote.status = 'review-required';
  return quote;
}
export function sameQuoteValues(a: Quote, b: Quote) {
  const values = (quote: Quote) =>
    JSON.stringify({
      cartId: quote.cartId,
      cartVersion: quote.cartVersion,
      network: quote.network,
      pricingVersion: quote.pricingVersion,
      items: quote.items,
      nftVersions: quote.nftVersions,
      couponCode: quote.couponCode,
      totals: quote.totals,
    });
  return values(a) === values(b);
}
