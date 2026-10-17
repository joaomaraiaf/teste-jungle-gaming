import { z } from 'zod';
import type { Favorites } from '../../domain/entities/favorites.entity';
export const favoritesSchema = z.object({
  userId: z.uuid(),
  version: z.number().int().positive(),
  nftIds: z
    .array(z.string().min(1))
    .refine((ids) => new Set(ids).size === ids.length, 'NFTs repetidos nos favoritos.'),
}) satisfies z.ZodType<Favorites>;
