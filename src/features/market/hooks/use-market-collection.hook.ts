import { useAppQuery } from '@/core/hooks/use-app-query';
import { listMarketCollectionUseCase } from '../market.dependencies';

export function useMarketCollection(collection: string) {
  const limit = 15;

  return useAppQuery({
    queryKey: ['market', 'collection', collection, limit],
    queryFn: ({ signal }) => listMarketCollectionUseCase.execute(collection, limit, signal),
    staleTime: 30_000,
  });
}
