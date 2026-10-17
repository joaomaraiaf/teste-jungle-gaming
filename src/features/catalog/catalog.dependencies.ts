import { apiClient } from '@/core/api/api-client';
import { HttpCatalogRepository } from './data/repositories/http-catalog.repository.impl';
import { GetCatalogFacetsUseCase } from './domain/usecases/get-catalog-facets.usecase';
import { ListNftsUseCase } from './domain/usecases/list-nfts.usecase';

const catalogRepository = new HttpCatalogRepository(apiClient);
export const listNftsUseCase = new ListNftsUseCase(catalogRepository);

export const getCatalogFacetsUseCase = new GetCatalogFacetsUseCase(catalogRepository);
