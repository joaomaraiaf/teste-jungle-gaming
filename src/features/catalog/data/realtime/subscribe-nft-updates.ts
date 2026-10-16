import type { RealtimeSocket } from '@/core/realtime/socket-client';
import type { NftUpdatedEventDto } from '../dtos/realtime.dto';
import { nftUpdatedEventSchema } from '../schemas/realtime.schema';

export function subscribeNftUpdates(
  socket: RealtimeSocket,
  onUpdate: (event: NftUpdatedEventDto) => void
) {
  const versions = new Map<string, number>();
  const listener = (payload: unknown) => {
    const parsed = nftUpdatedEventSchema.safeParse(payload);
    if (!parsed.success) return;
    const event = parsed.data;
    if (event.version <= (versions.get(event.resourceId) ?? 0)) return;
    versions.set(event.resourceId, event.version);
    onUpdate(event);
  };
  const reset = () => versions.clear();
  socket.on('connect', reset);
  socket.on('nft.updated', listener);
  return () => {
    socket.off('nft.updated', listener);
    socket.off('connect', reset);
    versions.clear();
  };
}
