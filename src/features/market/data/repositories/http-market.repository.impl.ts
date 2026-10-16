import type { IHttpClient } from '@/core/api/http-client';
import { catalogResponseSchema } from '@/features/catalog/data/schemas/catalog.schema';
import type { MarketNft } from '../../domain/entities/market-nft.entity';
import type { IMarketRepository } from '../../domain/repositories/market.repository.interface';
import { marketNftSchema } from '../schemas/market-nft.schema';

export class HttpMarketRepository implements IMarketRepository {
  constructor(private readonly http: IHttpClient) {}

  async getById(id: string, signal?: AbortSignal): Promise<MarketNft | null> {
    try {
      const response = await this.http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, undefined, {
        signal,
      });
      return marketNftSchema.parse(response);
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) return null;
      throw error;
    }
  }

  async listByCollection(collection: string, limit: number, signal?: AbortSignal) {
    const response = catalogResponseSchema.parse(
      await this.http.get<unknown>(
        '/nfts',
        { collection, limit, page: 1, search: '', sort: 'newest' },
        { signal }
      )
    );
    return response.data;
  }
}
