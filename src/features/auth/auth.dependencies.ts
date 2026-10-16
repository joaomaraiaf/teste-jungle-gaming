import { apiClient } from '@/core/api/api-client';
import { HttpAuthRepository } from './data/repositories/http-auth.repository.impl';
import { AuthUseCase } from './domain/usecases/auth.usecase';

export const authUseCase = new AuthUseCase(new HttpAuthRepository(apiClient));
