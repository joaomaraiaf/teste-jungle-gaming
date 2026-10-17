import { useMemo } from 'react';
import { useAppQuery } from '@/core/hooks/use-app-query';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { orderToActivity } from '@/features/orders/domain/entities/order-presenters';
import { createOrdersUseCase } from '@/features/orders/orders.dependencies';
export const ACTIVITY_QUERY_KEY = ['activity'] as const;
export function useActivity() {
  const { session, isLoading } = useAuthSession();
  const ownerId = session?.user.id ?? '';
  const service = useMemo(() => createOrdersUseCase(ownerId), [ownerId]);
  const onSessionError = useSessionErrorHandler();
  const query = useAppQuery({
    queryKey: [...ACTIVITY_QUERY_KEY, ownerId],
    enabled: Boolean(session && !isLoading),
    meta: { private: true },
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return await service.list(signal);
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
    refetchInterval: (query) =>
      query.state.data?.some((order) => order.status === 'pending') ? 1000 : false,
  });
  const activities = (query.data ?? [])
    .filter((order) => order.status === 'confirmed')
    .map(orderToActivity);
  return {
    query,
    activities,
    isGuest: !session,
    totalQuantity: activities.reduce(
      (sum, activity) => sum + activity.items.reduce((count, item) => count + item.quantity, 0),
      0
    ),
    totalWei: activities.reduce((sum, activity) => sum + parseEthToWei(activity.totalEth), 0n),
  };
}
