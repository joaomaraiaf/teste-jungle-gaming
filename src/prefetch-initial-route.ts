import { queryClient } from '@/core/providers/query-client';
import { getCatalogFacetsUseCase, listNftsUseCase } from '@/features/catalog/catalog.dependencies';
import {
  catalogFacetsSchema,
  catalogQuerySchema,
  catalogResponseSchema,
} from '@/features/catalog/data/schemas/catalog.schema';
import { marketNftSchema } from '@/features/market/data/schemas/market-nft.schema';
import { getMarketNftUseCase } from '@/features/market/market.dependencies';

/** Start public REST requests while React and the route UI are still loading. */
export function prefetchInitialRoute(url: URL, useSnapshot = false, revalidate = true) {
  let snapshot: Record<string, unknown> | undefined;
  if (useSnapshot) {
    try {
      snapshot =
        JSON.parse(document.getElementById('public-catalog-snapshot')?.textContent ?? 'null') ??
        undefined;
    } catch {
      /* Invalid build snapshots fall back to REST. */
    }
  }
  if (url.pathname === '/') {
    const parsed = catalogQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return;
    const query = { ...parsed.data, limit: 9 };
    if (
      snapshot &&
      query.page === 1 &&
      query.search === '' &&
      query.sort === 'newest' &&
      !query.category &&
      !query.network &&
      !query.collection &&
      !query.minPriceEth &&
      !query.maxPriceEth
    ) {
      const catalog = catalogResponseSchema.safeParse(snapshot.catalog);
      const facets = catalogFacetsSchema.safeParse(snapshot.facets);
      if (catalog.success) queryClient.setQueryData(['catalog', query], catalog.data);
      if (facets.success) queryClient.setQueryData(['catalog-facets'], facets.data);
    }
    if (!revalidate) return;
    void queryClient.prefetchQuery({
      queryKey: ['catalog', query],
      queryFn: ({ signal }) => listNftsUseCase.execute(query, signal),
      staleTime: 0,
    });
    void queryClient.prefetchQuery({
      queryKey: ['catalog-facets'],
      queryFn: ({ signal }) => getCatalogFacetsUseCase.execute(signal),
      staleTime: 0,
    });
  } else {
    const match = /^\/market\/([^/]+)\/?$/.exec(url.pathname);
    if (!match) return;
    const id = decodeURIComponent(match[1]);
    if (snapshot && id === 'nft-001') {
      const detail = marketNftSchema.safeParse(snapshot.detail);
      if (detail.success) queryClient.setQueryData(['market', 'nft', id], detail.data);
    }
    if (!revalidate) return;
    void queryClient.prefetchQuery({
      queryKey: ['market', 'nft', id],
      queryFn: ({ signal }) => getMarketNftUseCase.execute(id, signal),
      staleTime: 0,
      retry: false,
    });
  }
}
