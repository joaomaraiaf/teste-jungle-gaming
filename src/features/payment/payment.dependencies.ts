import { apiClient } from '@/core/api/api-client';
import { HttpWalletConnectionRepository } from './data/repositories/http-wallet-connection.repository.impl';
import { WalletConnectionUseCase } from './domain/usecases/wallet-connection.usecase';
export const createWalletConnectionUseCase = (ownerId: string) =>
  new WalletConnectionUseCase(new HttpWalletConnectionRepository(apiClient, ownerId));
