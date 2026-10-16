import type { z } from 'zod';
import type { favoritesSchema } from '../schemas/favorites.schema';
export type FavoritesResponseDto = z.infer<typeof favoritesSchema>;
