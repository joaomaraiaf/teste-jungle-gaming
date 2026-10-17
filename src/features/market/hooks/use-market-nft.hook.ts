import { useAppQuery } from '@/core/hooks/use-app-query';
import { getMarketNftUseCase } from '../market.dependencies';

export const marketNftQueryKey = (id: string) => ['market', 'nft', id] as const;

export function useMarketNft(id: string) {
  return useAppQuery({
    queryKey: marketNftQueryKey(id),
    queryFn: ({ signal }) => getMarketNftUseCase.execute(id, signal),
    staleTime: 30_000,
    retry: false,
  });
}
