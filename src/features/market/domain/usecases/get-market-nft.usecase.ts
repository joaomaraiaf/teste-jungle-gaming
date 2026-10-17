import type { IMarketRepository } from '../repositories/market.repository.interface';

export class GetMarketNftUseCase {
  constructor(private readonly repository: IMarketRepository) {}

  execute(id: string, signal?: AbortSignal) {
    return this.repository.getById(id, signal);
  }
}
