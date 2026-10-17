import type { CatalogQuery } from '@/features/catalog/domain/usecases/list-nfts.usecase';

type CollectionFilter = {
  label: string;
  value: NonNullable<CatalogQuery['category']>;
};

type NetworkFilter = {
  label: string;
  value: NonNullable<CatalogQuery['network']>;
};

export const CATALOG_COLLECTION_FILTERS: CollectionFilter[] = [
  { label: 'Digital Art', value: 'art' },
  { label: 'Photography', value: 'photography' },
  { label: 'Music', value: 'art' },
  { label: '3D Art', value: 'art' },
  { label: 'Collectibles', value: 'art' },
  { label: 'Generative', value: 'art' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Memberships', value: 'art' },
  { label: 'Utility', value: 'art' },
];

export const CATALOG_NETWORK_FILTERS: NetworkFilter[] = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Solana', value: 'solana' },
];
