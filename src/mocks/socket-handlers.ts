import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws } from 'msw';
import type { NftUpdatedEventDto } from '@/features/catalog/data/dtos/realtime.dto';
import type { OrderUpdatedEvent } from '@/features/orders/domain/entities/order-updated-event.entity';

export function createSocketHandlers(
  socketOrigin: string,
  currentUser: () => string | null = () => null
) {
  const url = new URL('/', socketOrigin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  // MSW 2 normalizes the Socket.IO /socket.io/ transport path to the root URL.
  const channel = ws.link(url.href);
  const clients = new Map<ReturnType<typeof toSocketIo>, string | null>();
  let available = true;
  const handlers = [
    channel.addEventListener('connection', (connection) => {
      if (!available) {
        connection.client.close(1013, 'Simulated offline transport');
        return;
      }
      const io = toSocketIo(connection);
      clients.set(io, currentUser());
      // Binding 0.2.0 implements the handshake but does not schedule Engine.IO heartbeats.
      const heartbeat = setInterval(() => connection.client.send('2'), 10_000);
      connection.client.addEventListener('close', () => {
        clearInterval(heartbeat);
        clients.delete(io);
      });
    }),
  ];
  return {
    handlers,
    connectionCount: () => clients.size,
    emitNftUpdated: (event: NftUpdatedEventDto) => {
      if (!available) return;
      for (const io of clients.keys()) io.client.emit('nft.updated', event);
    },
    emitOrderUpdated: (event: OrderUpdatedEvent) => {
      if (!available) return;
      const owner = currentUser();
      if (!owner || owner !== event.userId) return;
      for (const [io, capturedOwner] of clients)
        if (capturedOwner === owner) io.client.emit('order.updated', event);
    },
    setAvailable: (next: boolean) => {
      available = next;
      if (!next)
        for (const io of clients.keys()) io.rawClient.close(1012, 'Simulated offline transport');
    },
    disconnect: () => {
      for (const io of clients.keys())
        io.rawClient.close(1012, 'Simulated connection interruption');
    },
  };
}
