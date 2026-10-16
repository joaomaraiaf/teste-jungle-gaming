import { describe, expect, it } from 'vitest';
import type { CartItem } from './cart-item.entity';
import {
  calculateCartTotals,
  formatWeiAsEth,
  getCartEstimatedFeeWei,
  getCartSubtotalWei,
  parseEthToWei,
} from './cart-totals';

const cartItem = (unitPriceEth: string, quantity: number): CartItem => ({
  nftId: `nft-${unitPriceEth}`,
  name: 'Emerald Ape #042',
  imageUrl: null,
  collection: 'Kurio Apes',
  tokenId: '0042',
  editionId: 'edition',
  editionName: '1/10',
  unitPriceEth,
  quantity,
  available: 10,
});

describe('cart totals', () => {
  it('calculates subtotal and estimated fee without floating-point arithmetic', () => {
    const subtotalWei = getCartSubtotalWei([cartItem('1.19', 2), cartItem('0.1', 1)]);
    const estimatedFeeWei = getCartEstimatedFeeWei([cartItem('1.19', 2)]);

    expect(formatWeiAsEth(subtotalWei)).toBe('2.48');
    expect(formatWeiAsEth(estimatedFeeWei)).toBe('0.016');
    expect(formatWeiAsEth(subtotalWei + estimatedFeeWei)).toBe('2.496');
  });

  it('keeps decimal ETH values exact when parsing and formatting', () => {
    expect(parseEthToWei('0.1') + parseEthToWei('0.2')).toBe(parseEthToWei('0.3'));
    expect(formatWeiAsEth(parseEthToWei('1.2'))).toBe('1.20');
  });

  it('rounds coupon discounts down to wei and leaves the network fee undiscounted', () => {
    const totals = calculateCartTotals([cartItem('0.000000000000000019', 1)], 1000);
    expect(totals.discountEth).toBe('0.000000000000000001');
    expect(totals.estimatedFeeEth).toBe('0.016');
    expect(totals.totalEth).toBe('0.016000000000000018');
  });

  it('does not charge a network fee for an empty cart', () => {
    expect(getCartEstimatedFeeWei([])).toBe(0n);
  });
});
