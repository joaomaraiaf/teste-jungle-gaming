import type { Socket } from 'socket.io-client';
import { waitForTransport } from '@/core/api/transport-ready';

export type RealtimeSocket = Socket;

export async function createSocketClient(url: string): Promise<RealtimeSocket> {
  await waitForTransport();
  // Import after MSW starts: Engine.IO captures the global WebSocket constructor on import.
  const { io, WebSocket } = await import('socket.io-client');
  return io(url, {
    path: '/socket.io',
    transports: [WebSocket],
    autoConnect: false,
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2_000,
    randomizationFactor: 0,
    timeout: 5_000,
  });
}
