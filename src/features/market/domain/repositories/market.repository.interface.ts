import type { Nft } from '@/features/catalog/domain/entities/nft.entity';
import type { MarketNft } from '../entities/market-nft.entity';

export interface IMarketRepository {
  getById(id: string, signal?: AbortSignal): Promise<MarketNft | null>;
  listByCollection(collection: string, limit: number, signal?: AbortSignal): Promise<Nft[]>;
}
