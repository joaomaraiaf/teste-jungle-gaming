import type { IMarketRepository } from '../repositories/market.repository.interface';

export class ListMarketCollectionUseCase {
  constructor(private readonly repository: IMarketRepository) {}

  execute(collection: string, limit: number, signal?: AbortSignal) {
    return this.repository.listByCollection(collection, limit, signal);
  }
}
