import { z } from 'zod';
import { cartItemSchema } from '@/features/cart/data/schemas/cart.schema';
import { ethAmountSchema } from '@/features/catalog/data/schemas/catalog.schema';

export const completePurchaseSchema = z
  .object({
    attemptId: z.uuid(),
    couponCode: z.string().nullable().optional(),
    items: z.array(cartItemSchema).min(1).max(100),
    walletName: z.enum(['MetaMask', 'Coinbase Wallet', 'WalletConnect']),
  })
  .refine(
    (purchase) =>
      new Set(purchase.items.map((item) => `${item.nftId}:${item.editionId}`)).size ===
      purchase.items.length,
    'O pedido contém edições repetidas.'
  );

export const purchaseActivitySchema = z.object({
  attemptId: z.uuid(),
  couponCode: z.string().nullable().optional(),
  items: z.array(cartItemSchema).min(1).max(100),
  walletName: z.enum(['MetaMask', 'Coinbase Wallet', 'WalletConnect']),
  id: z.uuid(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  createdAt: z.iso.datetime(),
  estimatedFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  discountEth: ethAmountSchema.optional(),
  status: z.literal('completed'),
});

export const activityListSchema = z.array(purchaseActivitySchema);
