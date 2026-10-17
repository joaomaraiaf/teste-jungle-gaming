import type { IHttpClient } from '@/core/api/http-client';
import type { QuoteInput } from '../../domain/entities/quote.entity';
import type { IQuotesRepository } from '../../domain/repositories/quotes.repository.interface';
import { quoteSchema } from '../schemas/quote.schema';
export class HttpQuotesRepository implements IQuotesRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly ownerId: string
  ) {}
  private options(signal?: AbortSignal) {
    return { signal, headers: { 'X-Expected-User': this.ownerId } };
  }
  async create(input: QuoteInput, signal?: AbortSignal) {
    return quoteSchema.parse(
      await this.http.post<unknown, QuoteInput>('/quotes', input, this.options(signal))
    );
  }
  async get(id: string, signal?: AbortSignal) {
    return quoteSchema.parse(
      await this.http.get<unknown>(
        `/quotes/${encodeURIComponent(id)}`,
        undefined,
        this.options(signal)
      )
    );
  }
  async accept(id: string) {
    return quoteSchema.parse(
      await this.http.post<unknown, null>(
        `/quotes/${encodeURIComponent(id)}/accept`,
        null,
        this.options()
      )
    );
  }
}
