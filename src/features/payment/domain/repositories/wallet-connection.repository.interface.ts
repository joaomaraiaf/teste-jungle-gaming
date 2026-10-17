import type { WalletConnection, WalletConnectionInput } from '../entities/wallet-connection.entity';
export interface IWalletConnectionRepository {
  connect(input: WalletConnectionInput): Promise<WalletConnection>;
  get(id: string, signal?: AbortSignal): Promise<WalletConnection>;
  disconnect(id: string): Promise<WalletConnection>;
}
