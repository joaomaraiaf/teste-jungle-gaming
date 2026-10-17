import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useFavoriteAccess } from '@/features/auth/hooks/use-favorite-access.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Favorites } from '../domain/entities/favorites.entity';
import { createFavoritesUseCase } from '../favorites.dependencies';

export const FAVORITES_QUERY_KEY = ['favorites'] as const;
export const FAVORITES_MUTATION_KEY = ['favorites', 'set'] as const;
export function useFavorite(nftId: string) {
  const { session } = useAuthSession();
  const ownerId = session?.user.id ?? '';
  const access = useFavoriteAccess();
  const onSessionError = useSessionErrorHandler();
  const client = useQueryClient();
  const useCase = useMemo(() => createFavoritesUseCase(ownerId), [ownerId]);
  const key = [...FAVORITES_QUERY_KEY, ownerId];
  const activeOwner = () =>
    client.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id === ownerId;
  const query = useAppQuery({
    queryKey: key,
    queryFn: async ({ signal }) => {
      try {
        return await useCase.list(signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
    enabled: Boolean(session),
    staleTime: 30_000,
    retry: false,
    meta: { private: true },
  });
  const pending = useIsMutating({ mutationKey: [...FAVORITES_MUTATION_KEY, ownerId] });
  const mutation = useAppMutation<Favorites, Error, boolean, { previous: Favorites | undefined }>({
    mutationKey: [...FAVORITES_MUTATION_KEY, ownerId],
    meta: { private: true, ownerId },
    retry: false,
    mutationFn: (active) => useCase.set(nftId, active),
    onMutate: async (active) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Favorites>(key);
      if (activeOwner())
        client.setQueryData<Favorites>(key, {
          userId: ownerId,
          version: previous?.version ?? 1,
          nftIds: active
            ? [...new Set([...(previous?.nftIds ?? []), nftId])]
            : (previous?.nftIds ?? []).filter((id) => id !== nftId),
        });
      return { previous };
    },
    onSuccess: (data) => {
      if (activeOwner()) client.setQueryData(key, data);
    },
    onError: (error, _active, context) => {
      if (activeOwner()) {
        if (context?.previous) client.setQueryData(key, context.previous);
        else client.removeQueries({ queryKey: key, exact: true });
      }
      onSessionError(error);
    },
    onSettled: () => {
      if (activeOwner()) return client.invalidateQueries({ queryKey: key });
    },
  });
  const isFavorite = Boolean(session && query.data?.nftIds.includes(nftId));
  return {
    isFavorite,
    isPending: pending > 0,
    toggleFavorite: () =>
      access(() => {
        if (!client.isMutating({ mutationKey: [...FAVORITES_MUTATION_KEY, ownerId] }))
          mutation.mutate(!isFavorite);
      }),
  };
}
