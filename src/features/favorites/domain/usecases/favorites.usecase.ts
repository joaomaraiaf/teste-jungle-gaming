import type { IFavoritesRepository } from '../repositories/favorites.repository.interface';
export class FavoritesUseCase {
  constructor(private readonly repository: IFavoritesRepository) {}
  list(signal?: AbortSignal) {
    return this.repository.list(signal);
  }
  set(nftId: string, active: boolean) {
    return active ? this.repository.add(nftId) : this.repository.remove(nftId);
  }
}
