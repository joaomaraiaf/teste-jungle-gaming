import { z } from 'zod';
import { ethAmountSchema, nftSchema } from '@/features/catalog/data/schemas/catalog.schema';

export const scenarioSchema = z.enum([
  'default',
  'empty',
  'slow',
  'server-error',
  'network-error',
  'out-of-order',
]);
export type MockScenario = z.infer<typeof scenarioSchema>;
export const mockStateSchema = z.object({
  schemaVersion: z.literal(1),
  scenario: scenarioSchema,
  sequence: z.number().int().nonnegative(),
  nfts: z.array(nftSchema),
});
export type MockState = z.infer<typeof mockStateSchema>;
export const resetScenarioSchema = z.object({ scenario: scenarioSchema.default('default') });
export const updateMockNftSchema = z
  .object({
    editionId: z.string().min(1),
    priceEth: ethAmountSchema.optional(),
    available: z.number().int().nonnegative().optional(),
  })
  .refine(
    (input) => input.priceEth !== undefined || input.available !== undefined,
    'Informe preço ou disponibilidade.'
  );
