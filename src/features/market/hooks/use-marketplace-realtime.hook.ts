import { type Query, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRealtimeSocket } from '@/core/hooks/use-realtime-socket.hook';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { subscribeNftUpdates } from '@/features/catalog/data/realtime/subscribe-nft-updates';
import type { Nft } from '@/features/catalog/domain/entities/nft.entity';
import { subscribeOrderUpdates } from '@/features/orders/data/realtime/subscribe-order-updates';
import type { Order } from '@/features/orders/domain/entities/order.entity';
export function useMarketplaceRealtime() {
  const socket = useRealtimeSocket();
  const { session } = useAuthSession();
  const ownerId = session?.user.id ?? null;
  const client = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    let live = true;
    const active = () =>
      live &&
      (client.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY)?.user.id ?? null) ===
        ownerId;
    const refresh = async (predicate: (query: Query) => boolean) => {
      await client.cancelQueries({ predicate });
      if (active()) await client.invalidateQueries({ predicate, refetchType: 'active' });
    };
    const currentResources = (query: Query) => {
      const resource = query.queryKey[0];
      if (['catalog', 'catalog-facets', 'market'].includes(String(resource))) return true;
      if (resource === 'cart') return query.isActive();
      return (
        query.queryKey[1] === ownerId &&
        ['quote', 'order', 'activity', 'receipt'].includes(String(resource))
      );
    };
    const stopNfts = subscribeNftUpdates(socket, (event) => {
      if (!active()) return;
      let knownVersion = 0;
      for (const [key, data] of client.getQueriesData<Nft | { data: Nft[] }>({
        predicate: (query) => ['catalog', 'market'].includes(String(query.queryKey[0])),
      })) {
        if (key[0] === 'market' && data && 'id' in data && data.id === event.resourceId)
          knownVersion = Math.max(knownVersion, data.version);
        if (key[0] === 'catalog' && data && 'data' in data)
          knownVersion = Math.max(
            knownVersion,
            data.data.find((nft) => nft.id === event.resourceId)?.version ?? 0
          );
      }
      if (event.version < knownVersion) return;
      void refresh(currentResources);
    });
    const stopOrders = ownerId
      ? subscribeOrderUpdates(socket, ownerId, (event) => {
          if (!active()) return;
          const cached = client
            .getQueriesData<Order | Order[]>({
              predicate: (query) =>
                query.queryKey[1] === ownerId &&
                ['order', 'activity', 'receipt'].includes(String(query.queryKey[0])),
            })
            .flatMap(([, value]) => (value ? (Array.isArray(value) ? value : [value]) : []))
            .filter((order) => order.id === event.resourceId);
          if (event.data.status === 'pending' && cached.some((order) => order.status !== 'pending'))
            return;
          if (
            cached.length &&
            cached.every((order) => order.version >= event.version || order.status !== 'pending')
          )
            return;
          void refresh(
            (query) =>
              (query.queryKey[0] === 'cart' && query.isActive()) ||
              (query.queryKey[1] === ownerId &&
                ['order', 'activity', 'receipt'].includes(String(query.queryKey[0])))
          );
        })
      : () => undefined;
    let hasConnected = socket.connected;
    const reconnect = () => {
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      if (active()) void refresh(currentResources);
    };
    socket.on('connect', reconnect);
    return () => {
      live = false;
      stopNfts();
      stopOrders();
      socket.off('connect', reconnect);
    };
  }, [socket, ownerId, client]);
}
