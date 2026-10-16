import type { IHttpClient } from '@/core/api/http-client';
import type { CartSelection } from '../../domain/entities/cart.entity';
import type { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { cartMergeResultSchema, cartSchema } from '../schemas/cart.schema';
export class HttpCartRepository implements ICartRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly guestCartId: string,
    private readonly ownerId: string | null
  ) {}
  private options(signal?: AbortSignal) {
    return {
      signal,
      headers: { 'X-Guest-Cart-Id': this.guestCartId, 'X-Expected-User': this.ownerId ?? 'guest' },
    };
  }
  async get(signal?: AbortSignal) {
    return cartSchema.parse(await this.http.get<unknown>('/cart', undefined, this.options(signal)));
  }
  async add(input: CartSelection) {
    return cartSchema.parse(
      await this.http.post<unknown, CartSelection>('/cart/items', input, this.options())
    );
  }
  private path(nftId: string, editionId: string) {
    return `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`;
  }
  async update(input: CartSelection) {
    return cartSchema.parse(
      await this.http.patch<unknown, { quantity: number }>(
        this.path(input.nftId, input.editionId),
        { quantity: input.quantity },
        this.options()
      )
    );
  }
  async remove(nftId: string, editionId: string) {
    return cartSchema.parse(
      await this.http.delete<unknown>(this.path(nftId, editionId), this.options())
    );
  }
  async applyCoupon(code: string) {
    return cartSchema.parse(
      await this.http.put<unknown, { code: string }>('/cart/coupon', { code }, this.options())
    );
  }
  async removeCoupon() {
    return cartSchema.parse(await this.http.delete<unknown>('/cart/coupon', this.options()));
  }
  async merge(guestCartId: string) {
    return cartMergeResultSchema.parse(
      await this.http.post<unknown, { guestCartId: string }>(
        '/cart/merge',
        { guestCartId },
        this.options()
      )
    );
  }
}
