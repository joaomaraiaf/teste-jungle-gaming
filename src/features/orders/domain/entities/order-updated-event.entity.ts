import type { Order } from './order.entity';
export interface OrderUpdatedEvent {
  eventId: string;
  type: 'order.updated';
  resourceId: string;
  userId: string;
  version: number;
  occurredAt: string;
  data: Order;
}
