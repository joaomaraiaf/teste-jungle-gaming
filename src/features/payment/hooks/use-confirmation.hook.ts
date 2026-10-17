import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useAppQuery } from '@/core/hooks/use-app-query';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { readLastOrder } from '@/features/orders/data/order-attempt.store';
import { orderToReceipt } from '@/features/orders/domain/entities/order-presenters';
import { createOrdersUseCase } from '@/features/orders/orders.dependencies';
export const RECEIPT_QUERY_KEY = ['receipt'] as const;
export function useConfirmation() {
  const { session } = useAuthSession();
  const ownerId = session?.user.id ?? '';
  const { orderId: requestedId } = useSearch({ from: '/payment/confirmation' });
  const id = requestedId ?? (ownerId ? readLastOrder(ownerId) : null);
  const service = useMemo(() => createOrdersUseCase(ownerId), [ownerId]);
  const onSessionError = useSessionErrorHandler();
  const query = useAppQuery({
    queryKey: [...RECEIPT_QUERY_KEY, ownerId, id],
    enabled: Boolean(ownerId && id),
    retry: false,
    meta: { private: true },
    queryFn: async ({ signal }) => {
      try {
        return await service.getReceipt(id!, signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
  });
  return {
    receipt: query.data ? orderToReceipt(query.data) : null,
    isLoading: Boolean(id && query.isPending),
    error: query.error,
    retry: () => {
      void query.refetch();
    },
  };
}
