import { apiClient } from '@/core/api/api-client';
import { HttpMarketRepository } from './data/repositories/http-market.repository.impl';
import { GetMarketNftUseCase } from './domain/usecases/get-market-nft.usecase';
import { ListMarketCollectionUseCase } from './domain/usecases/list-market-collection.usecase';

const marketRepository = new HttpMarketRepository(apiClient);

export const getMarketNftUseCase = new GetMarketNftUseCase(marketRepository);
export const listMarketCollectionUseCase = new ListMarketCollectionUseCase(marketRepository);
