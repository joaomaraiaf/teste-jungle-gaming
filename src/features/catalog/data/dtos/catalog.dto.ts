import type { z } from 'zod';
import type {
  catalogQuerySchema,
  catalogResponseSchema,
  nftEditionSchema,
  nftSchema,
} from '../schemas/catalog.schema';

export type NftDto = z.infer<typeof nftSchema>;
export type NftEditionDto = z.infer<typeof nftEditionSchema>;
export type CatalogQueryDto = z.infer<typeof catalogQuerySchema>;
export type CatalogResponseDto = z.infer<typeof catalogResponseSchema>;
