import { z } from 'zod';
import { nftSchema } from '@/features/catalog/data/schemas/catalog.schema';
import type { MarketNft } from '../../domain/entities/market-nft.entity';

export const nftDetailsSchema = z.object({
  rating: z
    .string()
    .regex(/^[0-5](\.\d+)?$/)
    .refine((value) => Number(value) <= 5),
  reviewsCount: z.number().int().nonnegative(),
  description: z.string(),
  contract: z.string().min(1),
  royalty: z.string(),
  royaltyDescription: z.string(),
  attributes: z.array(z.string()),
  reviews: z.array(
    z.object({
      id: z.string().min(1),
      author: z.string().min(1),
      date: z.string(),
      rating: z.number().int().min(0).max(5),
      comment: z.string(),
      initials: z.string(),
    })
  ),
});
export const marketNftSchema = nftSchema.extend({
  details: nftDetailsSchema,
}) satisfies z.ZodType<MarketNft>;
