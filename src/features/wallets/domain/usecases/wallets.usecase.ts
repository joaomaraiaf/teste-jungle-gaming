import type { SavedWallet, WalletSlot } from '../entities/saved-wallet.entity';
import type { IWalletsRepository } from '../repositories/wallets.repository.interface';

export class WalletsUseCase {
  constructor(private readonly repository: IWalletsRepository) {}
  getWallets(signal?: AbortSignal) {
    return this.repository.getWallets(signal);
  }
  saveWallet(slot: WalletSlot, wallet: SavedWallet) {
    return this.repository.saveWallet(slot, wallet);
  }
  linkSecondary(sameAsPrimary: boolean) {
    return this.repository.linkSecondary(sameAsPrimary);
  }
}
