import type { ICatalogRepository } from '../repositories/catalog.repository.interface';

export class GetCatalogFacetsUseCase {
  constructor(private readonly repository: ICatalogRepository) {}
  execute(signal?: AbortSignal) {
    return this.repository.getFacets(signal);
  }
}
