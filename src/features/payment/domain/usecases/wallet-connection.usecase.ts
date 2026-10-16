import type { WalletConnectionInput } from '../entities/wallet-connection.entity';
import type { IWalletConnectionRepository } from '../repositories/wallet-connection.repository.interface';
export class WalletConnectionUseCase {
  constructor(private readonly repository: IWalletConnectionRepository) {}
  connect(input: WalletConnectionInput) {
    return this.repository.connect(input);
  }
  get(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
  disconnect(id: string) {
    return this.repository.disconnect(id);
  }
}
