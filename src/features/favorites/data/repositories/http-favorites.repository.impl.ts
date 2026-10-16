import type { IHttpClient } from '@/core/api/http-client';
import type { IFavoritesRepository } from '../../domain/repositories/favorites.repository.interface';
import { favoritesSchema } from '../schemas/favorites.schema';
export class HttpFavoritesRepository implements IFavoritesRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly ownerId: string
  ) {}
  private options(signal?: AbortSignal) {
    return { signal, headers: { 'X-Expected-User': this.ownerId } };
  }
  async list(signal?: AbortSignal) {
    return favoritesSchema.parse(
      await this.http.get<unknown>('/favorites', undefined, this.options(signal))
    );
  }
  async add(nftId: string) {
    return favoritesSchema.parse(
      await this.http.put<unknown, null>(
        `/favorites/${encodeURIComponent(nftId)}`,
        null,
        this.options()
      )
    );
  }
  async remove(nftId: string) {
    return favoritesSchema.parse(
      await this.http.delete<unknown>(`/favorites/${encodeURIComponent(nftId)}`, this.options())
    );
  }
}
