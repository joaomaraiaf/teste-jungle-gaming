import { cartItemSchema } from '@/features/cart/data/schemas/cart.schema';
import { parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { ethAmountSchema, nftSchema } from '@/features/catalog/data/schemas/catalog.schema';
import { z } from 'zod';
import type { Quote } from '../../domain/entities/quote.entity';
export const quoteTotalsSchema = z
  .object({
    subtotalEth: ethAmountSchema,
    discountEth: ethAmountSchema,
    estimatedFeeEth: ethAmountSchema,
    totalEth: ethAmountSchema,
  })
  .superRefine((totals, context) => {
    const subtotal = parseEthToWei(totals.subtotalEth);
    const discount = parseEthToWei(totals.discountEth);
    if (discount > subtotal)
      context.addIssue({
        code: 'custom',
        path: ['discountEth'],
        message: 'Desconto maior que o subtotal.',
      });
    if (
      parseEthToWei(totals.totalEth) !==
      subtotal - discount + parseEthToWei(totals.estimatedFeeEth)
    )
      context.addIssue({
        code: 'custom',
        path: ['totalEth'],
        message: 'Total inconsistente com os valores da cotação.',
      });
  });
export const quoteInputSchema = z.object({
  previousQuoteId: z.uuid().optional(),
  cartId: z.uuid(),
  cartVersion: z.number().int().positive(),
  network: nftSchema.shape.network,
});
export const quoteIssueSchema = z.object({
  code: z.enum(['PRICE_CHANGED', 'QUANTITY_ADJUSTED', 'SOLD_OUT', 'COUPON_EXPIRED']),
  nftId: z.string().min(1).optional(),
  editionId: z.string().min(1).optional(),
  message: z.string().min(1),
});
export const quoteSchema = z.object({
  id: z.uuid(),
  cartId: z.uuid(),
  cartVersion: z.number().int().positive(),
  network: nftSchema.shape.network,
  pricingVersion: z.number().int().positive(),
  userId: z.uuid(),
  createdAt: z.iso.datetime(),
  status: z.enum(['valid', 'review-required', 'unavailable']),
  items: z.array(cartItemSchema).min(1).max(100),
  nftVersions: z.record(z.string().min(1), z.number().int().positive()),
  couponCode: z.string().min(1).nullable(),
  totals: quoteTotalsSchema,
  issues: z.array(quoteIssueSchema),
}) satisfies z.ZodType<Quote>;
