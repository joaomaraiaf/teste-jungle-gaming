import type { z } from 'zod';
import type { apiErrorResponseSchema } from '../schemas/api-error.schema';

export type ApiErrorResponseDto = z.infer<typeof apiErrorResponseSchema>;
