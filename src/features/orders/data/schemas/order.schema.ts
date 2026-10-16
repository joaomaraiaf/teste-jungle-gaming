import { cartItemSchema } from '@/features/cart/data/schemas/cart.schema';
import { walletConnectionInputSchema } from '@/features/payment/data/schemas/wallet-connection.schema';
import { quoteTotalsSchema } from '@/features/quotes/data/schemas/quote.schema';
import { z } from 'zod';
import type { Order } from '../../domain/entities/order.entity';
export const orderCollectorSchema = z.object({
  displayName: z.string().trim().min(2),
  username: z.string().trim().min(2),
  email: z.email(),
  profileName: z.string().trim().min(2),
  ensName: z.string(),
  referralCode: z.string(),
  note: z.string().max(240),
});
export const createOrderSchema = z.object({
  quoteId: z.uuid(),
  connectionId: z.uuid(),
  collector: orderCollectorSchema,
});
export const idempotencyKeySchema = z.uuid();
export const orderSnapshotSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(100),
  totals: quoteTotalsSchema,
  collector: orderCollectorSchema,
  walletAddress: z.string().min(8),
  provider: walletConnectionInputSchema.shape.provider,
  network: walletConnectionInputSchema.shape.network,
});
const orderBaseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  attemptId: z.uuid(),
  quoteId: z.uuid(),
  connectionId: z.uuid(),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  snapshot: orderSnapshotSchema,
});
export const pendingOrderSchema = orderBaseSchema.extend({
  status: z.literal('pending'),
  resolveAt: z.iso.datetime(),
});
export const confirmedOrderSchema = orderBaseSchema.extend({
  status: z.literal('confirmed'),
  confirmedAt: z.iso.datetime(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
export const rejectedOrderSchema = orderBaseSchema.extend({
  status: z.literal('rejected'),
  rejectedAt: z.iso.datetime(),
  rejection: z.object({
    code: z.enum(['PAYMENT_REFUSED', 'INSUFFICIENT_STOCK', 'QUOTE_CHANGED', 'WALLET_DISCONNECTED']),
    message: z.string().min(1),
  }),
});
export const orderSchema = z.discriminatedUnion('status', [
  pendingOrderSchema,
  confirmedOrderSchema,
  rejectedOrderSchema,
]) satisfies z.ZodType<Order>;
export const orderListSchema = z.array(orderSchema);
