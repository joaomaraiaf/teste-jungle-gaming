import type { z } from 'zod';
import type { quoteInputSchema } from '../schemas/quote.schema';
export type QuoteRequestDto = z.infer<typeof quoteInputSchema>;
