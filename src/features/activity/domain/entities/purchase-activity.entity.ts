import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';

export interface CompletePurchaseInput {
  attemptId: string;
  couponCode?: string | null;
  items: CartItem[];
  walletName: 'MetaMask' | 'Coinbase Wallet' | 'WalletConnect';
}

export interface PurchaseActivity extends CompletePurchaseInput {
  id: string;
  transactionHash: string;
  createdAt: string;
  estimatedFeeEth: string;
  totalEth: string;
  discountEth?: string;
  status: 'completed';
}

export function getPurchaseFingerprint(
  input: Pick<CompletePurchaseInput, 'items' | 'walletName' | 'couponCode'>
) {
  return JSON.stringify({
    walletName: input.walletName,
    couponCode: input.couponCode ?? null,
    items: input.items
      .map(({ nftId, editionId, quantity, unitPriceEth }) => ({
        nftId,
        editionId,
        quantity,
        unitPriceEth,
      }))
      .sort((a, b) => `${a.nftId}:${a.editionId}`.localeCompare(`${b.nftId}:${b.editionId}`)),
  });
}
