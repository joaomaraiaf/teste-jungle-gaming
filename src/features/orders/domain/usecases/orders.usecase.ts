import type { CreateOrderInput } from '../entities/order.entity';
import type { IOrdersRepository } from '../repositories/orders.repository.interface';
export class OrdersUseCase {
  constructor(private readonly repository: IOrdersRepository) {}
  create(input: CreateOrderInput, key: string) {
    return this.repository.create(input, key);
  }
  list(signal?: AbortSignal) {
    return this.repository.list(signal);
  }
  get(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
  getReceipt(id: string, signal?: AbortSignal) {
    return this.repository.getReceipt(id, signal);
  }
}
