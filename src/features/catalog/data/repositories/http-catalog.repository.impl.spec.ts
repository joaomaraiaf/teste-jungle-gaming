import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { IHttpClient, IRequestOptions, QueryParams } from '@/core/api/http-client';
import type { CatalogQuery } from '../../domain/usecases/list-nfts.usecase';
import { HttpCatalogRepository } from './http-catalog.repository.impl';

function createHttpClient(response: unknown): IHttpClient {
  const unsupportedRequest = async <T>(): Promise<T> => {
    throw new Error('Este teste cobre apenas GET.');
  };

  return {
    async get<T>(_path: string, _params?: QueryParams, _options?: IRequestOptions): Promise<T> {
      return response as T;
    },
    post: unsupportedRequest,
    put: unsupportedRequest,
    patch: unsupportedRequest,
    delete: unsupportedRequest,
  };
}

const query: CatalogQuery = {
  page: 1,
  limit: 12,
  search: '',
  sort: 'newest',
};

describe('HttpCatalogRepository', () => {
  it('returns the catalog when the response matches its schema', async () => {
    const payload = {
      data: [],
      total: 0,
      page: 1,
      limit: 12,
      lastPage: 0,
    };
    const http = createHttpClient(payload);
    const get = vi.spyOn(http, 'get');
    const repository = new HttpCatalogRepository(http);

    await expect(repository.list(query)).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/nfts', query, { signal: undefined });
  });

  it('rejects an invalid response before it reaches the domain', async () => {
    const http = createHttpClient({
      data: [],
      total: 'not-a-number',
      page: 1,
      limit: 12,
      lastPage: 0,
    });
    const repository = new HttpCatalogRepository(http);

    await expect(repository.list(query)).rejects.toBeInstanceOf(ZodError);
  });
});
