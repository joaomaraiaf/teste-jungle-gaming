import { apiClient } from '@/core/api/api-client';
import { HttpFavoritesRepository } from './data/repositories/http-favorites.repository.impl';
import { FavoritesUseCase } from './domain/usecases/favorites.usecase';
export const createFavoritesUseCase = (ownerId: string) =>
  new FavoritesUseCase(new HttpFavoritesRepository(apiClient, ownerId));
