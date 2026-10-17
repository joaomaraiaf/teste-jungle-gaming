import { nftSchema } from '@/features/catalog/data/schemas/catalog.schema';
import { z } from 'zod';
import type { WalletConnection } from '../../domain/entities/wallet-connection.entity';
export const walletConnectionInputSchema = z.object({
  walletSlot: z.enum(['primary', 'secondary']),
  network: nftSchema.shape.network,
  provider: z.enum(['metamask', 'coinbase', 'walletconnect']),
});
export const walletConnectionSchema = walletConnectionInputSchema.extend({
  id: z.uuid(),
  userId: z.uuid(),
  walletAddress: z.string().min(8),
  status: z.enum(['connected', 'refused', 'disconnected']),
  version: z.number().int().positive(),
}) satisfies z.ZodType<WalletConnection>;
