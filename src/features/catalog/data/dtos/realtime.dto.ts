import type { z } from 'zod';
import type { nftUpdatedEventSchema } from '../schemas/realtime.schema';

export type NftUpdatedEventDto = z.infer<typeof nftUpdatedEventSchema>;
