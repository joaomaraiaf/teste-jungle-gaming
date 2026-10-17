import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/react-query';

export const useAppQuery = <
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) => useQuery(options);
