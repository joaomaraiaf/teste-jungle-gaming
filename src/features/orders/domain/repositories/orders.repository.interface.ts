import type { ConfirmedOrder, CreateOrderInput, Order } from '../entities/order.entity';
export interface IOrdersRepository {
  create(input: CreateOrderInput, idempotencyKey: string): Promise<Order>;
  list(signal?: AbortSignal): Promise<Order[]>;
  get(id: string, signal?: AbortSignal): Promise<Order>;
  getReceipt(id: string, signal?: AbortSignal): Promise<ConfirmedOrder>;
}
