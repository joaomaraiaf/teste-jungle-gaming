import type { z } from 'zod';
import type { walletConnectionSchema } from '../schemas/wallet-connection.schema';
export type WalletConnectionResponseDto = z.infer<typeof walletConnectionSchema>;
