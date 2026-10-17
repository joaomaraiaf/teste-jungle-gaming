import { useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import type { SavedWallet, SavedWallets, WalletSlot } from '../domain/entities/saved-wallet.entity';
import { walletsUseCase } from '../wallets.dependencies';

export const WALLETS_QUERY_KEY = ['wallets'] as const;
export const SAVE_WALLET_MUTATION_KEY = ['wallets', 'save'] as const;
export const LINK_SECONDARY_MUTATION_KEY = ['wallets', 'link-secondary'] as const;

export function useWallets() {
  const { session } = useAuthSession();
  const onSessionError = useSessionErrorHandler();
  return useAppQuery({
    queryKey: [...WALLETS_QUERY_KEY, session?.user.id],
    queryFn: async ({ signal }) => {
      try {
        return await walletsUseCase.getWallets(signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
    enabled: Boolean(session),
    meta: { private: true },
    retry: false,
  });
}

export function useWalletActions() {
  const { session } = useAuthSession();
  const onSessionError = useSessionErrorHandler();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const updateCache = (wallets: SavedWallets) => {
    if (queryClient.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id !== userId)
      return;
    queryClient.setQueryData([...WALLETS_QUERY_KEY, userId], wallets);
  };
  const save = useAppMutation({
    mutationKey: [...SAVE_WALLET_MUTATION_KEY, userId],
    meta: { private: true, ownerId: userId },
    onError: onSessionError,
    mutationFn: ({ slot, wallet }: { slot: WalletSlot; wallet: SavedWallet }) =>
      walletsUseCase.saveWallet(slot, wallet),
    onSuccess: updateCache,
    successMessage: 'Carteira salva com sucesso.',
    retry: false,
  });
  const link = useAppMutation({
    mutationKey: [...LINK_SECONDARY_MUTATION_KEY, userId],
    meta: { private: true, ownerId: userId },
    onError: onSessionError,
    mutationFn: (sameAsPrimary: boolean) => walletsUseCase.linkSecondary(sameAsPrimary),
    onSuccess: updateCache,
    successMessage: 'Carteira secundária atualizada.',
    retry: false,
  });
  return { save, link };
}
