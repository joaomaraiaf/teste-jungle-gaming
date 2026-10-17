import { z } from 'zod';
import { ethAmountSchema } from '@/features/catalog/data/schemas/catalog.schema';
import type { Cart } from '../../domain/entities/cart.entity';

export const cartSelectionSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1).max(10_000),
});
export const cartItemSchema = cartSelectionSchema.extend({
  name: z.string().min(1),
  imageUrl: z.string().nullable(),
  collection: z.string(),
  tokenId: z.string(),
  editionName: z.string(),
  unitPriceEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
});
export const cartSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid().nullable(),
    version: z.number().int().positive(),
    items: z.array(cartItemSchema).max(100),
    couponCode: z.string().min(1).nullable(),
    totals: z.object({
      subtotalEth: ethAmountSchema,
      discountEth: ethAmountSchema,
      estimatedFeeEth: ethAmountSchema,
      totalEth: ethAmountSchema,
    }),
  })
  .refine(
    (cart) =>
      new Set(cart.items.map((item) => `${item.nftId}:${item.editionId}`)).size ===
      cart.items.length,
    'Edições repetidas no carrinho.'
  ) satisfies z.ZodType<Cart>;
export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
});
export const cartMergeInputSchema = z.object({ guestCartId: z.uuid() });
export const cartMergeResultSchema = z.object({
  cart: cartSchema,
  adjustments: z.array(
    z.object({
      nftId: z.string().min(1),
      editionId: z.string().min(1),
      requestedQuantity: z.number().int().positive(),
      availableQuantity: z.number().int().nonnegative(),
    })
  ),
});
