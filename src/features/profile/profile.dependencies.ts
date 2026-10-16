import { apiClient } from '@/core/api/api-client';
import { HttpProfileRepository } from './data/repositories/http-profile.repository.impl';
import { ProfileUseCase } from './domain/usecases/profile.usecase';

export const profileUseCase = new ProfileUseCase(new HttpProfileRepository(apiClient));
