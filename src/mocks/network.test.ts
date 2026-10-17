import { AxiosAdapter } from '@/core/api/axios-adapter';
import { type RealtimeSocket, createSocketClient } from '@/core/realtime/socket-client';
import type { NftUpdatedEventDto } from '@/features/catalog/data/dtos/realtime.dto';
import { subscribeNftUpdates } from '@/features/catalog/data/realtime/subscribe-nft-updates';
import { catalogFacetsSchema } from '@/features/catalog/data/schemas/catalog.schema';
import { catalogResponseSchema, nftSchema } from '@/features/catalog/data/schemas/catalog.schema';
import { marketNftSchema } from '@/features/market/data/schemas/market-nft.schema';
// @vitest-environment node
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createMockEnvironment } from './environment';

const origin = 'http://127.0.0.1:3002';
const mocks = createMockEnvironment({ origin });
const server = setupServer(...mocks.handlers);
const api = new AxiosAdapter(`${origin}/api`);
let socket: RealtimeSocket | undefined;
let unsubscribe: (() => void) | undefined;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => mocks.store.reset());
afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = undefined;
  mocks.disconnect();
  server.resetHandlers();
});
afterAll(() => {
  mocks.dispose();
  server.close();
});

async function connect() {
  socket = await createSocketClient(origin);
  await new Promise<void>((resolve, reject) => {
    socket?.once('connect', () => resolve());
    socket?.once('connect_error', reject);
    socket?.connect();
  });
  return socket;
}

describe('MSW REST + Socket.IO', () => {
  it('combina filtros e paginação via Axios e devolve contratos válidos', async () => {
    const result = catalogResponseSchema.parse(
      await api.get('/nfts', {
        category: 'art',
        network: 'ethereum',
        limit: 2,
        page: 2,
        sort: 'price-desc',
      })
    );
    expect(result).toMatchObject({ total: 6, page: 2, limit: 2, lastPage: 3 });
    expect(result.data.map((nft) => nft.id)).toEqual(['nft-025', 'nft-019']);
    const detail = nftSchema.parse(await api.get('/nfts/nft-001'));
    expect(detail.editions[0].priceEth).toBe('1.19');
    const complete = marketNftSchema.parse(await api.get('/nfts/nft-001'));
    expect(complete.details.reviews[0].author).toBe('Marina Costa');
    const facets = catalogFacetsSchema.parse(await api.get('/catalog/facets'));
    expect(facets.networks.find((facet) => facet.value === 'ethereum')?.count).toBe(
      mocks.store.read().nfts.filter((nft) => nft.network === 'ethereum').length
    );
    await expect(api.get('/nfts/missing')).rejects.toMatchObject({ status: 404 });
    await expect(api.get('/nfts', { page: 0 })).rejects.toMatchObject({ status: 422 });
  });

  it('filtra pela faixa de preço em ETH e rejeita intervalos invertidos', async () => {
    const result = catalogResponseSchema.parse(
      await api.get('/nfts', { minPriceEth: '0.25', maxPriceEth: '0.30', sort: 'price-asc' })
    );
    expect(result.total).toBe(5);
    expect(result.data.map((nft) => nft.editions[0].priceEth)).toEqual([
      '0.25',
      '0.26',
      '0.27',
      '0.29',
      '0.29',
    ]);
    await expect(
      api.get('/nfts', { minPriceEth: '1.00', maxPriceEth: '0.50' })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('configura falhas, resultado vazio e restaura o cenário conhecido', async () => {
    await api.post('/__mock/reset', { scenario: 'empty' });
    expect(catalogResponseSchema.parse(await api.get('/nfts')).total).toBe(0);
    await api.post('/__mock/reset', { scenario: 'server-error' });
    await expect(api.get('/nfts')).rejects.toMatchObject({ status: 503 });
    await api.post('/__mock/reset', { scenario: 'network-error' });
    await expect(api.get('/nfts')).rejects.toMatchObject({ status: undefined });
    await api.post('/__mock/reset', {});
    expect(catalogResponseSchema.parse(await api.get('/nfts')).total).toBe(36);
  });

  it('entrega atualização pelo cliente Socket.IO e mantém REST coerente', async () => {
    const client = await connect();
    const received = new Promise<NftUpdatedEventDto>((resolve) => {
      unsubscribe = subscribeNftUpdates(client, resolve);
    });
    const changed = await api.post<NftUpdatedEventDto, unknown>('/__mock/nfts/nft-001', {
      editionId: 'standard',
      priceEth: '0.123456789012345678',
      available: 3,
    });
    await expect(received).resolves.toEqual(changed);
    const detail = nftSchema.parse(await api.get('/nfts/nft-001'));
    expect(detail).toEqual(changed.data);
    expect(detail.editions[0]).toMatchObject({ priceEth: '0.123456789012345678', available: 3 });
    await expect(
      api.post('/__mock/nfts/nft-001', { editionId: 'standard', priceEth: 0.5 })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('ignora duplicatas e versões antigas passando pelo transporte', async () => {
    const client = await connect();
    const received: NftUpdatedEventDto[] = [];
    unsubscribe = subscribeNftUpdates(client, (event) => received.push(event));
    const first = await api.post<NftUpdatedEventDto, unknown>('/__mock/nfts/nft-001', {
      editionId: 'standard',
      available: 5,
    });
    const second = await api.post<NftUpdatedEventDto, unknown>('/__mock/nfts/nft-001', {
      editionId: 'standard',
      available: 4,
    });
    await api.post('/__mock/replay', second);
    await api.post('/__mock/replay', first);
    expect(received.map((event) => event.version)).toEqual([2, 3]);
    expect(nftSchema.parse(await api.get('/nfts/nft-001')).version).toBe(3);
  });

  it('reconecta após interrupção e permite reconciliar pela API', async () => {
    const client = await connect();
    const disconnected = new Promise<void>((resolve) => client.once('disconnect', () => resolve()));
    const reconnected = new Promise<void>((resolve) => client.once('connect', () => resolve()));
    await api.post('/__mock/disconnect', {});
    await disconnected;
    await api.post('/__mock/nfts/nft-001', { editionId: 'standard', available: 1 });
    await reconnected;
    expect(client.connected).toBe(true);
    expect(nftSchema.parse(await api.get('/nfts/nft-001')).editions[0].available).toBe(1);
  });

  it('libera o listener sem receber novas atualizações', async () => {
    const client = await connect();
    const received: NftUpdatedEventDto[] = [];
    const stop = subscribeNftUpdates(client, (event) => received.push(event));
    stop();
    await api.post('/__mock/nfts/nft-001', { editionId: 'standard', available: 5 });
    expect(received).toEqual([]);
  });
});
