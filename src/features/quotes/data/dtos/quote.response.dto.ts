import type { z } from 'zod';
import type { quoteSchema } from '../schemas/quote.schema';
export type QuoteResponseDto = z.infer<typeof quoteSchema>;
