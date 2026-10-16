import type { IHttpClient } from '@/core/api/http-client';
import type {
  SavedWallet,
  SavedWallets,
  WalletSlot,
} from '../../domain/entities/saved-wallet.entity';
import type { IWalletsRepository } from '../../domain/repositories/wallets.repository.interface';
import { savedWalletsSchema } from '../schemas/wallet.schema';

export class HttpWalletsRepository implements IWalletsRepository {
  constructor(private readonly http: IHttpClient) {}
  async getWallets(signal?: AbortSignal): Promise<SavedWallets> {
    return savedWalletsSchema.parse(
      await this.http.get<unknown>('/wallets', undefined, { signal })
    );
  }
  async saveWallet(slot: WalletSlot, wallet: SavedWallet): Promise<SavedWallets> {
    return savedWalletsSchema.parse(
      await this.http.put<unknown, SavedWallet>(`/wallets/${slot}`, wallet)
    );
  }
  async linkSecondary(sameAsPrimary: boolean): Promise<SavedWallets> {
    return savedWalletsSchema.parse(
      await this.http.patch<unknown, { sameAsPrimary: boolean }>('/wallets/secondary-link', {
        sameAsPrimary,
      })
    );
  }
}
