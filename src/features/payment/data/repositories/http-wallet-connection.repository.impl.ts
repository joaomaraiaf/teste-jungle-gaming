import type { IHttpClient } from '@/core/api/http-client';
import type { WalletConnectionInput } from '../../domain/entities/wallet-connection.entity';
import type { IWalletConnectionRepository } from '../../domain/repositories/wallet-connection.repository.interface';
import { walletConnectionSchema } from '../schemas/wallet-connection.schema';
export class HttpWalletConnectionRepository implements IWalletConnectionRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly ownerId: string
  ) {}
  private options(signal?: AbortSignal) {
    return { signal, headers: { 'X-Expected-User': this.ownerId } };
  }
  async connect(input: WalletConnectionInput) {
    return walletConnectionSchema.parse(
      await this.http.post<unknown, WalletConnectionInput>(
        '/wallet-connections',
        input,
        this.options()
      )
    );
  }
  async get(id: string, signal?: AbortSignal) {
    return walletConnectionSchema.parse(
      await this.http.get<unknown>(
        `/wallet-connections/${encodeURIComponent(id)}`,
        undefined,
        this.options(signal)
      )
    );
  }
  async disconnect(id: string) {
    return walletConnectionSchema.parse(
      await this.http.delete<unknown>(
        `/wallet-connections/${encodeURIComponent(id)}`,
        this.options()
      )
    );
  }
}
