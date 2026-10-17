import type { QuoteInput } from '../entities/quote.entity';
import type { IQuotesRepository } from '../repositories/quotes.repository.interface';
export class QuotesUseCase {
  constructor(private readonly repository: IQuotesRepository) {}
  create(input: QuoteInput, signal?: AbortSignal) {
    return this.repository.create(input, signal);
  }
  get(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
  accept(id: string) {
    return this.repository.accept(id);
  }
}
