import type { Nft } from './nft.entity';

export interface CatalogFacets {
  collections: { label: string; value: Nft['category']; count: number }[];
  networks: { label: string; value: Nft['network']; count: number }[];
}
