import type { IHttpClient } from '@/core/api/http-client';
import type { CreateOrderInput } from '../../domain/entities/order.entity';
import type { IOrdersRepository } from '../../domain/repositories/orders.repository.interface';
import { confirmedOrderSchema, orderListSchema, orderSchema } from '../schemas/order.schema';
export class HttpOrdersRepository implements IOrdersRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly ownerId: string
  ) {}
  private options(signal?: AbortSignal) {
    return { signal, headers: { 'X-Expected-User': this.ownerId } };
  }
  async create(input: CreateOrderInput, key: string) {
    return orderSchema.parse(
      await this.http.post<unknown, CreateOrderInput>('/orders', input, {
        headers: { ...this.options().headers, 'Idempotency-Key': key },
      })
    );
  }
  async list(signal?: AbortSignal) {
    return orderListSchema.parse(
      await this.http.get<unknown>('/orders', undefined, this.options(signal))
    );
  }
  async get(id: string, signal?: AbortSignal) {
    return orderSchema.parse(
      await this.http.get<unknown>(
        `/orders/${encodeURIComponent(id)}`,
        undefined,
        this.options(signal)
      )
    );
  }
  async getReceipt(id: string, signal?: AbortSignal) {
    return confirmedOrderSchema.parse(
      await this.http.get<unknown>(
        `/orders/${encodeURIComponent(id)}/receipt`,
        undefined,
        this.options(signal)
      )
    );
  }
}
