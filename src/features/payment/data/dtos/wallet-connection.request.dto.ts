import type { z } from 'zod';
import type { walletConnectionInputSchema } from '../schemas/wallet-connection.schema';
export type WalletConnectionRequestDto = z.infer<typeof walletConnectionInputSchema>;
