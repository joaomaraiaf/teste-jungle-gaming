import type { z } from 'zod';
import type { cartSelectionSchema } from '../schemas/cart.schema';
export type CartSelectionRequestDto = z.infer<typeof cartSelectionSchema>;
