import { z } from 'zod';
import type { OrderUpdatedEvent } from '../../domain/entities/order-updated-event.entity';
import { orderSchema } from './order.schema';
export const orderUpdatedEventSchema = z
  .object({
    eventId: z.string().min(1),
    type: z.literal('order.updated'),
    resourceId: z.uuid(),
    userId: z.uuid(),
    version: z.number().int().positive(),
    occurredAt: z.iso.datetime(),
    data: orderSchema,
  })
  .refine(
    (event) =>
      event.resourceId === event.data.id &&
      event.userId === event.data.userId &&
      event.version === event.data.version,
    'Identidade e versão do pedido devem corresponder ao envelope.'
  ) satisfies z.ZodType<OrderUpdatedEvent>;
