import { ApiError } from '@/core/api/api-error';
import { useAppMutation } from '@/core/hooks/use-app-mutation';
import { useAppQuery } from '@/core/hooks/use-app-query';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useSessionErrorHandler } from '@/features/auth/hooks/use-session-error-handler.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  type OrderAttempt,
  clearOrderAttempt,
  readOrderAttempt,
  writeOrderAttempt,
} from '../data/order-attempt.store';
import type { CreateOrderInput, Order } from '../domain/entities/order.entity';
import { createOrdersUseCase } from '../orders.dependencies';
export const ORDER_QUERY_KEY = ['order'] as const;
export const CREATE_ORDER_MUTATION_KEY = ['orders', 'create'] as const;
export function useOrderAttempt(ownerId: string) {
  const [attempt, setAttempt] = useState(() => readOrderAttempt(ownerId));
  const service = useMemo(() => createOrdersUseCase(ownerId), [ownerId]);
  const client = useQueryClient();
  const onSessionError = useSessionErrorHandler();
  const queryKey = [...ORDER_QUERY_KEY, ownerId, attempt?.key];
  const create = useAppMutation<Order, Error, CreateOrderInput>({
    mutationKey: [...CREATE_ORDER_MUTATION_KEY, ownerId],
    retry: false,
    meta: { private: true, ownerId },
    mutationFn: async (input) => {
      const next: OrderAttempt = { key: crypto.randomUUID(), input, orderId: null };
      writeOrderAttempt(ownerId, next);
      setAttempt(next);
      const order = await service.create(input, next.key);
      const saved = { ...next, orderId: order.id };
      writeOrderAttempt(ownerId, saved);
      if (client.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id === ownerId) {
        setAttempt(saved);
        client.setQueryData([...ORDER_QUERY_KEY, ownerId, next.key], order);
      }
      return order;
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status && [404, 409, 422].includes(error.status)) {
        clearOrderAttempt(ownerId);
        setAttempt(null);
      }
      onSessionError(error);
    },
  });
  const query = useAppQuery({
    queryKey,
    enabled: Boolean(ownerId && attempt && !create.isPending),
    retry: false,
    meta: { private: true },
    queryFn: async ({ signal }) => {
      if (!attempt) throw new Error('Tentativa não encontrada.');
      try {
        const order = attempt.orderId
          ? await service.get(attempt.orderId, signal)
          : ((await service.list(signal)).find((order) => order.attemptId === attempt.key) ??
            (await service.create(attempt.input, attempt.key)));
        if (!signal.aborted) {
          try {
            writeOrderAttempt(ownerId, { ...attempt, orderId: order.id });
          } catch {
            /* The original key and request were already saved before sending. */
          }
        }
        return order;
      } catch (error) {
        onSessionError(error);
        throw error;
      }
    },
    refetchInterval: (query) =>
      !query.state.error && query.state.data?.status === 'pending' ? 500 : false,
    refetchOnWindowFocus: true,
  });
  return {
    attempt,
    order: query.data,
    isRecovering: Boolean(attempt && (query.isPending || create.isPending)),
    error: query.error,
    retry: () => {
      void query.refetch();
    },
    create: create.mutateAsync,
    complete: () => clearOrderAttempt(ownerId),
    reset: () => {
      clearOrderAttempt(ownerId);
      setAttempt(null);
    },
    isCreating: create.isPending,
  };
}
