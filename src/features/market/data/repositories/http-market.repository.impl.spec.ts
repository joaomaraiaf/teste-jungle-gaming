import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import type { IHttpClient, IRequestOptions, QueryParams } from '@/core/api/http-client';
import { createNftDetails } from '@/mocks/market-details.mock';
import { HttpMarketRepository } from './http-market.repository.impl';

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

describe('HttpMarketRepository', () => {
  it('valida os detalhes do NFT antes de entregá-los ao domínio', async () => {
    const nft = {
      id: 'nft-001',
      details: createNftDetails(),
      name: 'Emerald Ape #042',
      description: 'Obra digital verificada.',
      imageUrl: '/images/ape.png',
      artist: 'Nova Sato',
      collection: 'Kurio Apes',
      category: 'art',
      network: 'ethereum',
      editions: [{ id: 'standard', name: '1/10', priceEth: '1.19', available: 10 }],
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const http = createHttpClient(nft);
    const get = vi.spyOn(http, 'get');
    const repository = new HttpMarketRepository(http);

    await expect(repository.getById(nft.id)).resolves.toEqual(nft);
    expect(get).toHaveBeenCalledWith('/nfts/nft-001', undefined, { signal: undefined });
  });

  it('rejects resposta inválida antes de chegar ao domínio', async () => {
    const repository = new HttpMarketRepository(createHttpClient({ id: 'nft-001', editions: [] }));

    await expect(repository.getById('nft-001')).rejects.toBeInstanceOf(ZodError);
  });

  it('devolve os itens da coleção validados pelo contrato do catálogo', async () => {
    const nft = {
      id: 'nft-002',
      name: 'Kurio Ape #043',
      description: 'Obra digital verificada.',
      imageUrl: '/images/ape.png',
      artist: 'Nova Sato',
      collection: 'Kurio Apes',
      category: 'art',
      network: 'ethereum',
      editions: [{ id: 'standard', name: '1/10', priceEth: '0.02', available: 10 }],
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const http = createHttpClient({ data: [nft], total: 1, page: 1, limit: 6, lastPage: 1 });
    const get = vi.spyOn(http, 'get');
    const repository = new HttpMarketRepository(http);

    await expect(repository.listByCollection('Kurio Apes', 6)).resolves.toEqual([nft]);
    expect(get).toHaveBeenCalledWith(
      '/nfts',
      { collection: 'Kurio Apes', limit: 6, page: 1, search: '', sort: 'newest' },
      { signal: undefined }
    );
  });
});
