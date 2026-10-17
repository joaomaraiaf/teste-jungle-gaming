import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { createContext, type ReactNode, useEffect, useRef } from 'react';
import { useRealtimeSocket } from '@/core/hooks/use-realtime-socket.hook';
import { usePaymentDraftCleanup } from '@/features/payment/hooks/use-payment-draft.hook';
import { usePaymentReceipt } from '@/features/payment/hooks/use-payment-receipt.hook';
import { useSessionViewModel } from '../hooks/use-session-view-model.hook';
import { isPrivateDestination } from '../private-destinations';

export const AuthSessionContext = createContext<ReturnType<typeof useSessionViewModel> | null>(
  null
);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const viewModel = useSessionViewModel(async () => {
    if (isPrivateDestination(location.pathname))
      await navigate({ to: '/', search: { page: 1, limit: 9, search: '', sort: 'newest' } });
  });
  const socket = useRealtimeSocket();
  usePaymentDraftCleanup(viewModel.loggedOutUserId);
  const queryClient = useQueryClient();
  const { clearReceipt } = usePaymentReceipt();
  const previousUser = useRef<string | null | undefined>(undefined);
  const userId = viewModel.session?.user.id ?? null;

  useEffect(() => {
    if (viewModel.isLoading) return;
    if (previousUser.current !== undefined && previousUser.current !== userId) {
      void queryClient.cancelQueries({
        predicate: (query) =>
          query.meta?.private === true && query.queryKey[1] !== (userId ?? 'guest'),
      });
      queryClient.removeQueries({
        predicate: (query) =>
          query.meta?.private === true && query.queryKey[1] !== (userId ?? 'guest'),
      });
      for (const mutation of queryClient.getMutationCache().getAll()) {
        if (mutation.meta?.private === true && mutation.meta.ownerId !== userId)
          queryClient.getMutationCache().remove(mutation);
      }
      clearReceipt();
      socket?.disconnect();
      socket?.connect();
    }
    previousUser.current = userId;
  }, [userId, viewModel.isLoading, queryClient, clearReceipt, socket]);

  return <AuthSessionContext.Provider value={viewModel}>{children}</AuthSessionContext.Provider>;
}
