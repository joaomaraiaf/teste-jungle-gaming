import { z } from 'zod';
import { nftSchema } from './catalog.schema';

export const nftUpdatedEventSchema = z
  .object({
    eventId: z.string().min(1),
    type: z.literal('nft.updated'),
    resourceId: z.string().min(1),
    version: z.number().int().positive(),
    occurredAt: z.iso.datetime(),
    data: nftSchema,
  })
  .refine(
    (event) => event.resourceId === event.data.id && event.version === event.data.version,
    'A identidade e a versão do evento devem corresponder ao NFT.'
  );
