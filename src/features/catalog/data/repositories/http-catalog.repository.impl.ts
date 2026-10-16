import type { IHttpClient } from '@/core/api/http-client';
import type {
  CatalogPage,
  ICatalogRepository,
} from '../../domain/repositories/catalog.repository.interface';
import type { CatalogQuery } from '../../domain/usecases/list-nfts.usecase';
import type { CatalogResponseDto } from '../dtos/catalog.dto';
import { catalogFacetsSchema, catalogResponseSchema } from '../schemas/catalog.schema';

export class HttpCatalogRepository implements ICatalogRepository {
  constructor(private readonly http: IHttpClient) {}

  async getFacets(signal?: AbortSignal) {
    return catalogFacetsSchema.parse(
      await this.http.get<unknown>('/catalog/facets', undefined, { signal })
    );
  }

  async list(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
    const response: CatalogResponseDto = catalogResponseSchema.parse(
      await this.http.get<unknown>('/nfts', { ...query }, { signal })
    );
    return response;
  }
}
