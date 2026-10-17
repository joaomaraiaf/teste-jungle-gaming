import type { Quote, QuoteInput } from '../entities/quote.entity';
export interface IQuotesRepository {
  create(input: QuoteInput, signal?: AbortSignal): Promise<Quote>;
  accept(id: string): Promise<Quote>;
  get(id: string, signal?: AbortSignal): Promise<Quote>;
}
