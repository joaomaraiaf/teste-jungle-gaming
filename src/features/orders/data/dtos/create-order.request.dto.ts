import type { z } from 'zod';
import type { createOrderSchema } from '../schemas/order.schema';
export type CreateOrderRequestDto = z.infer<typeof createOrderSchema>;
