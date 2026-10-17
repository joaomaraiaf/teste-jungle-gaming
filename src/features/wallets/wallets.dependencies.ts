import { apiClient } from '@/core/api/api-client';
import { HttpWalletsRepository } from './data/repositories/http-wallets.repository.impl';
import { WalletsUseCase } from './domain/usecases/wallets.usecase';

export const walletsUseCase = new WalletsUseCase(new HttpWalletsRepository(apiClient));
