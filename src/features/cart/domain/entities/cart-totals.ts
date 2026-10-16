import type { CartItem } from './cart-item.entity';

const WEI_PER_ETH = 10n ** 18n;

export function parseEthToWei(value: string): bigint {
  const [whole = '0', fraction = ''] = value.split('.');
  const normalizedFraction = fraction.slice(0, 18).padEnd(18, '0');
  return BigInt(whole || '0') * WEI_PER_ETH + BigInt(normalizedFraction || '0');
}

export function formatWeiAsEth(value: bigint): string {
  const whole = value / WEI_PER_ETH;
  const fraction = (value % WEI_PER_ETH).toString().padStart(18, '0').replace(/0+$/, '');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

export function getCartSubtotalWei(items: CartItem[]): bigint {
  return items.reduce(
    (subtotal, item) => subtotal + parseEthToWei(item.unitPriceEth) * BigInt(item.quantity),
    0n
  );
}

export function getCartEstimatedFeeWei(items: CartItem[]): bigint {
  return items.length === 0 ? 0n : 16_000_000_000_000_000n;
}

export function calculateCartTotals(items: CartItem[], discountBasisPoints = 0) {
  const subtotal = getCartSubtotalWei(items);
  const discount = (subtotal * BigInt(discountBasisPoints)) / 10_000n;
  const fee = getCartEstimatedFeeWei(items);
  return {
    subtotalEth: formatWeiAsEth(subtotal),
    discountEth: formatWeiAsEth(discount),
    estimatedFeeEth: formatWeiAsEth(fee),
    totalEth: formatWeiAsEth(subtotal - discount + fee),
  };
}
