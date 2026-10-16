import type { CatalogFacets } from '../entities/catalog-facets.entity';
import type { Nft } from '../entities/nft.entity';
import type { CatalogQuery } from '../usecases/list-nfts.usecase';

export interface ICatalogRepository {
  getFacets(signal?: AbortSignal): Promise<CatalogFacets>;
  list(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage>;
}

export interface CatalogPage {
  data: Nft[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}
