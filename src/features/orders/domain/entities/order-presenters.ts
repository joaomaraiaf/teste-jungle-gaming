import type { PurchaseActivity } from '@/features/activity/domain/entities/purchase-activity.entity';
import { parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import type { PaymentReceipt } from '@/features/payment/domain/entities/payment-receipt.entity';
import type { ConfirmedOrder } from './order.entity';
export function orderToActivity(order: ConfirmedOrder): PurchaseActivity {
  return {
    id: order.id,
    attemptId: order.attemptId,
    createdAt: order.confirmedAt,
    transactionHash: order.transactionHash,
    items: order.snapshot.items,
    estimatedFeeEth: order.snapshot.totals.estimatedFeeEth,
    discountEth: order.snapshot.totals.discountEth,
    totalEth: order.snapshot.totals.totalEth,
    status: 'completed',
    walletName: (
      { metamask: 'MetaMask', coinbase: 'Coinbase Wallet', walletconnect: 'WalletConnect' } as const
    )[order.snapshot.provider],
  };
}
export function orderToReceipt(order: ConfirmedOrder): PaymentReceipt {
  const activity = orderToActivity(order);
  return {
    items: order.snapshot.items,
    estimatedFeeWei: parseEthToWei(activity.estimatedFeeEth),
    discountWei: parseEthToWei(activity.discountEth ?? '0'),
    totalWei: parseEthToWei(activity.totalEth),
    createdAt: activity.createdAt,
    transactionHash: order.transactionHash,
    walletName: activity.walletName,
    network: order.snapshot.network,
  };
}
