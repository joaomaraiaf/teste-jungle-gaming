import type { SavedWallet, SavedWallets, WalletSlot } from '../entities/saved-wallet.entity';

export interface IWalletsRepository {
  getWallets(signal?: AbortSignal): Promise<SavedWallets>;
  saveWallet(slot: WalletSlot, wallet: SavedWallet): Promise<SavedWallets>;
  linkSecondary(sameAsPrimary: boolean): Promise<SavedWallets>;
}
