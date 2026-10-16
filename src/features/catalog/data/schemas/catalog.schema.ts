import { z } from 'zod';

export const ethAmountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Informe ETH como string decimal com até 18 casas.');

function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'));
}

export const nftEditionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
});

export const nftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().nullable(),
  artist: z.string(),
  collection: z.string(),
  category: z.enum(['art', 'photography', 'gaming']),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  editions: z.array(nftEditionSchema).min(1),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
});

export const catalogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(9),
    search: z.string().trim().max(120).default(''),
    minPriceEth: ethAmountSchema.optional(),
    maxPriceEth: ethAmountSchema.optional(),
    category: z.enum(['art', 'photography', 'gaming']).optional(),
    network: z.enum(['ethereum', 'polygon', 'solana']).optional(),
    collection: z.string().max(120).optional(),
    sort: z.enum(['name-asc', 'price-asc', 'price-desc', 'newest']).default('newest'),
  })
  .superRefine((query, context) => {
    if (
      query.minPriceEth &&
      query.maxPriceEth &&
      ethToWei(query.minPriceEth) > ethToWei(query.maxPriceEth)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'O preço mínimo não pode ser maior que o preço máximo.',
        path: ['minPriceEth'],
      });
    }
  });

export const catalogResponseSchema = z.object({
  data: z.array(nftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  lastPage: z.number().int().nonnegative(),
});

export const catalogFacetsSchema = z.object({
  collections: z.array(
    z.object({
      label: z.string(),
      value: nftSchema.shape.category,
      count: z.number().int().nonnegative(),
    })
  ),
  networks: z.array(
    z.object({
      label: z.string(),
      value: nftSchema.shape.network,
      count: z.number().int().nonnegative(),
    })
  ),
});
