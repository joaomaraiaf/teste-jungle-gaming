import type { RealtimeSocket } from '@/core/realtime/socket-client';
import type { OrderUpdatedEvent } from '../../domain/entities/order-updated-event.entity';
import { orderUpdatedEventSchema } from '../schemas/order-updated-event.schema';
export function subscribeOrderUpdates(
  socket: RealtimeSocket,
  ownerId: string,
  onUpdate: (event: OrderUpdatedEvent) => void
) {
  const versions = new Map<string, number>();
  const terminal = new Set<string>();
  const listener = (payload: unknown) => {
    const parsed = orderUpdatedEventSchema.safeParse(payload);
    if (!parsed.success || parsed.data.userId !== ownerId) return;
    const event = parsed.data;
    if (terminal.has(event.resourceId) || event.version <= (versions.get(event.resourceId) ?? 0))
      return;
    versions.set(event.resourceId, event.version);
    if (event.data.status !== 'pending') terminal.add(event.resourceId);
    onUpdate(event);
  };
  const reset = () => {
    versions.clear();
    terminal.clear();
  };
  socket.on('order.updated', listener);
  socket.on('connect', reset);
  return () => {
    socket.off('order.updated', listener);
    socket.off('connect', reset);
    reset();
  };
}
