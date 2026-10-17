import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';
import type {
  WalletNetwork,
  WalletProvider,
} from '@/features/payment/domain/entities/wallet-connection.entity';
import type { QuoteTotals } from '@/features/quotes/domain/entities/quote.entity';

export interface OrderCollector {
  displayName: string;
  username: string;
  email: string;
  profileName: string;
  ensName: string;
  referralCode: string;
  note: string;
}
export interface CreateOrderInput {
  quoteId: string;
  connectionId: string;
  collector: OrderCollector;
}
export interface OrderSnapshot {
  items: CartItem[];
  totals: QuoteTotals;
  collector: OrderCollector;
  walletAddress: string;
  provider: WalletProvider;
  network: WalletNetwork;
}
interface OrderBase {
  id: string;
  userId: string;
  attemptId: string;
  quoteId: string;
  connectionId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  snapshot: OrderSnapshot;
}
export type OrderRejectionCode =
  | 'PAYMENT_REFUSED'
  | 'INSUFFICIENT_STOCK'
  | 'QUOTE_CHANGED'
  | 'WALLET_DISCONNECTED';
export type Order = OrderBase &
  (
    | { status: 'pending'; resolveAt: string }
    | { status: 'confirmed'; confirmedAt: string; transactionHash: string }
    | {
        status: 'rejected';
        rejectedAt: string;
        rejection: { code: OrderRejectionCode; message: string };
      }
  );
export type ConfirmedOrder = Extract<Order, { status: 'confirmed' }>;
