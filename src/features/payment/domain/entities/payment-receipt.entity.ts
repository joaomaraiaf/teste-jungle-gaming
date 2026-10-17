import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';

export interface PaymentReceipt {
  network?: 'ethereum' | 'polygon' | 'solana';
  items: CartItem[];
  estimatedFeeWei: bigint;
  totalWei: bigint;
  discountWei?: bigint;
  createdAt: string;
  transactionHash: string;
  walletName: string;
}
