import { useAppQuery } from '@/core/hooks/use-app-query';
import { getCatalogFacetsUseCase, listNftsUseCase } from '../catalog.dependencies';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';

export const CATALOG_QUERY_KEY = ['catalog'] as const;

export function useCatalog(query: CatalogQuery) {
  return useAppQuery({
    queryKey: [...CATALOG_QUERY_KEY, query],
    queryFn: ({ signal }) => listNftsUseCase.execute(query, signal),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export const CATALOG_FACETS_QUERY_KEY = ['catalog-facets'] as const;
export function useCatalogFacets() {
  return useAppQuery({
    queryKey: CATALOG_FACETS_QUERY_KEY,
    queryFn: ({ signal }) => getCatalogFacetsUseCase.execute(signal),
    staleTime: 30_000,
  });
}
