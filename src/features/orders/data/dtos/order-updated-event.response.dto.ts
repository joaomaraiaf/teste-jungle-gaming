import type { z } from 'zod';
import type { orderUpdatedEventSchema } from '../schemas/order-updated-event.schema';
export type OrderUpdatedEventDto = z.infer<typeof orderUpdatedEventSchema>;
