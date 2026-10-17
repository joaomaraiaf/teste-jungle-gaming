import type { z } from 'zod';
import type { orderSchema } from '../schemas/order.schema';
export type OrderResponseDto = z.infer<typeof orderSchema>;
