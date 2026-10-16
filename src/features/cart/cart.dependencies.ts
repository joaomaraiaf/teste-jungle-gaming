import { apiClient } from '@/core/api/api-client';
import { HttpCartRepository } from './data/repositories/http-cart.repository.impl';
import { CartUseCase } from './domain/usecases/cart.usecase';
export const createCartUseCase = (guestId: string, ownerId: string | null) =>
  new CartUseCase(new HttpCartRepository(apiClient, guestId, ownerId));
