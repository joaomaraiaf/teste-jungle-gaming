import { apiClient } from '@/core/api/api-client';
import { HttpOrdersRepository } from './data/repositories/http-orders.repository.impl';
import { OrdersUseCase } from './domain/usecases/orders.usecase';
export const createOrdersUseCase = (ownerId: string) =>
  new OrdersUseCase(new HttpOrdersRepository(apiClient, ownerId));
