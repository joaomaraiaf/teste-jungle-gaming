import { apiClient } from '@/core/api/api-client';
import { HttpQuotesRepository } from './data/repositories/http-quotes.repository.impl';
import { QuotesUseCase } from './domain/usecases/quotes.usecase';
export const createQuotesUseCase = (ownerId: string) =>
  new QuotesUseCase(new HttpQuotesRepository(apiClient, ownerId));
