import type { NftUpdatedEventDto } from '@/features/catalog/data/dtos/realtime.dto';
import type { OrderUpdatedEvent } from '@/features/orders/domain/entities/order-updated-event.entity';
import { z } from 'zod';
import type { CommerceStore } from './commerce-store';
const noticeSchema = z.object({
  epoch: z.string(),
  nftIds: z.array(z.string()).max(1000),
  orderIds: z.array(z.uuid()).max(1000),
});
export interface CommerceChannel {
  postMessage(data: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  close(): void;
}
export function createCommerceBroadcast(
  store: CommerceStore,
  sockets: {
    emitNftUpdated(event: NftUpdatedEventDto): void;
    emitOrderUpdated(event: OrderUpdatedEvent): void;
    disconnect(): void;
  },
  channel?: CommerceChannel
) {
  let epoch = store.read().epoch;
  let closed = false;
  const deliver = (input: unknown) => {
    if (closed) return;
    const parsed = noticeSchema.safeParse(input);
    if (!parsed.success) return;
    const state = store.read();
    if (parsed.data.epoch !== state.epoch) return;
    if (epoch !== state.epoch) {
      epoch = state.epoch;
      sockets.disconnect();
    }
    for (const id of parsed.data.nftIds) {
      const nft = state.catalog?.find((nft) => nft.id === id);
      if (nft)
        sockets.emitNftUpdated({
          type: 'nft.updated',
          eventId: `nft.updated:${id}:${nft.version}`,
          resourceId: id,
          version: nft.version,
          occurredAt: nft.updatedAt,
          data: nft,
        });
    }
    for (const id of parsed.data.orderIds) {
      const order = state.orders[id];
      if (order)
        sockets.emitOrderUpdated({
          type: 'order.updated',
          eventId: `order.updated:${epoch}:${id}:${order.version}`,
          resourceId: id,
          userId: order.userId,
          version: order.version,
          occurredAt: order.updatedAt,
          data: order,
        });
    }
  };
  const listener = (event: MessageEvent) => deliver(event.data);
  channel?.addEventListener('message', listener);
  const unsubscribe = store.subscribe((change) => {
    deliver(change);
    channel?.postMessage(change);
  });
  return {
    dispose: () => {
      closed = true;
      unsubscribe();
      channel?.removeEventListener('message', listener);
      channel?.close();
    },
  };
}
