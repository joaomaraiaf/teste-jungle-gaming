import type { Favorites } from '../entities/favorites.entity';
export interface IFavoritesRepository {
  list(signal?: AbortSignal): Promise<Favorites>;
  add(nftId: string): Promise<Favorites>;
  remove(nftId: string): Promise<Favorites>;
}
