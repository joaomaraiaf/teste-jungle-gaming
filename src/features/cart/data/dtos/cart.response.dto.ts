import type { z } from 'zod';
import type { cartSchema } from '../schemas/cart.schema';
export type CartResponseDto = z.infer<typeof cartSchema>;
