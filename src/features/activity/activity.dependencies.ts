import { apiClient } from '@/core/api/api-client';
import { HttpActivityRepository } from './data/repositories/http-activity.repository.impl';
import { ActivityUseCase } from './domain/usecases/activity.usecase';

export const activityUseCase = new ActivityUseCase(new HttpActivityRepository(apiClient));
