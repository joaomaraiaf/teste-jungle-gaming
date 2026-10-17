import type { CatalogPage, ICatalogRepository } from '../repositories/catalog.repository.interface';

export interface CatalogQuery {
  page: number;
  limit: number;
  search: string;
  minPriceEth?: string;
  maxPriceEth?: string;
  category?: 'art' | 'photography' | 'gaming';
  network?: 'ethereum' | 'polygon' | 'solana';
  collection?: string;
  sort: 'name-asc' | 'price-asc' | 'price-desc' | 'newest';
}

export class ListNftsUseCase {
  constructor(private readonly repository: ICatalogRepository) {}

  execute(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
    return this.repository.list(query, signal);
  }
}
