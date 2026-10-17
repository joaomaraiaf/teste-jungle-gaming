import type { ApiErrorResponseDto } from '@/core/api/dtos/api-error.dto';
import { apiErrorResponseSchema } from '@/core/api/schemas/api-error.schema';
import type { CatalogResponseDto } from '@/features/catalog/data/dtos/catalog.dto';
import type { NftUpdatedEventDto } from '@/features/catalog/data/dtos/realtime.dto';
import { catalogQuerySchema } from '@/features/catalog/data/schemas/catalog.schema';
import { nftUpdatedEventSchema } from '@/features/catalog/data/schemas/realtime.schema';
import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import { CATALOG_COLLECTION_FILTERS, CATALOG_NETWORK_FILTERS } from './catalog-view.mock';
import { createNftDetails } from './market-details.mock';
import { resetScenarioSchema, updateMockNftSchema } from './mock-state.schema';
import type { MockStore } from './store';

export function createHttpHandlers(
  store: MockStore,
  apiBase: string,
  events: {
    emitNftUpdated: (event: NftUpdatedEventDto) => void;
    disconnect: () => void;
    connectionCount: () => number;
    setAvailable: (available: boolean) => void;
  },
  resetAuth: () => void = () => undefined
) {
  let requestCount = 0;
  const error = (status: number, code: string, message: string) =>
    HttpResponse.json<ApiErrorResponseDto>(apiErrorResponseSchema.parse({ code, message }), {
      status,
    });
  const networkCondition = async () => {
    const scenario = store.read().scenario;
    requestCount += 1;
    if (scenario === 'slow') await delay(1_500);
    if (scenario === 'out-of-order') await delay(requestCount % 2 === 1 ? 500 : 20);
    if (scenario === 'server-error')
      return error(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.');
    if (scenario === 'network-error') return HttpResponse.error();
  };
  const toWei = (value: string) => {
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'));
  };

  return [
    http.post(`${apiBase}/__mock/socket`, async ({ request }) => {
      const input = z
        .object({ connected: z.boolean() })
        .safeParse(await request.json().catch(() => null));
      if (!input.success) return error(422, 'VALIDATION_ERROR', 'Informe o estado de conexão.');
      events.setAvailable(input.data.connected);
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${apiBase}/catalog/facets`, async () => {
      const snapshot = store.read();
      const failure = await networkCondition();
      if (failure) return failure;
      const nfts = snapshot.scenario === 'empty' ? [] : snapshot.nfts;
      return HttpResponse.json({
        collections: CATALOG_COLLECTION_FILTERS.map((filter) => ({
          ...filter,
          count: nfts.filter((nft) => nft.category === filter.value).length,
        })),
        networks: CATALOG_NETWORK_FILTERS.map((filter) => ({
          ...filter,
          count: nfts.filter((nft) => nft.network === filter.value).length,
        })),
      });
    }),
    http.get(`${apiBase}/health`, () =>
      HttpResponse.json({ status: 'ok', mode: 'mock', scenario: store.read().scenario })
    ),
    http.get(`${apiBase}/nfts`, async ({ request }) => {
      const parsed = catalogQuerySchema.safeParse(
        Object.fromEntries(new URL(request.url).searchParams)
      );
      if (!parsed.success)
        return error(
          422,
          'VALIDATION_ERROR',
          parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.'
        );
      const query = parsed.data;
      const snapshot = store.read();
      const failure = await networkCondition();
      if (failure) return failure;
      let nfts = snapshot.scenario === 'empty' ? [] : snapshot.nfts;
      nfts = nfts.filter(
        (nft) =>
          (!query.search ||
            `${nft.name} ${nft.artist}`.toLowerCase().includes(query.search.toLowerCase())) &&
          (!query.minPriceEth || toWei(nft.editions[0].priceEth) >= toWei(query.minPriceEth)) &&
          (!query.maxPriceEth || toWei(nft.editions[0].priceEth) <= toWei(query.maxPriceEth)) &&
          (!query.category || nft.category === query.category) &&
          (!query.network || nft.network === query.network) &&
          (!query.collection || nft.collection === query.collection)
      );
      nfts.sort((a, b) => {
        if (query.sort === 'name-asc') return a.name.localeCompare(b.name);
        if (query.sort === 'newest')
          return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
        const difference = toWei(a.editions[0].priceEth) - toWei(b.editions[0].priceEth);
        const direction = query.sort === 'price-desc' ? -1 : 1;
        return difference < 0n
          ? -direction
          : difference > 0n
            ? direction
            : a.id.localeCompare(b.id);
      });
      return HttpResponse.json<CatalogResponseDto>({
        data: nfts.slice((query.page - 1) * query.limit, query.page * query.limit),
        total: nfts.length,
        page: query.page,
        limit: query.limit,
        lastPage: Math.ceil(nfts.length / query.limit),
      });
    }),
    http.get(`${apiBase}/nfts/:id`, async ({ params }) => {
      const nft = store.read().nfts.find((item) => item.id === params.id);
      const failure = await networkCondition();
      if (failure) return failure;
      return nft
        ? HttpResponse.json({ ...nft, details: createNftDetails() })
        : error(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
    }),
    http.get(`${apiBase}/__mock/status`, () =>
      HttpResponse.json({ connections: events.connectionCount(), scenario: store.read().scenario })
    ),
    http.get(`${apiBase}/__mock/state`, () => HttpResponse.json(store.read())),
    http.post(`${apiBase}/__mock/reset`, async ({ request }) => {
      const parsed = resetScenarioSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return error(422, 'VALIDATION_ERROR', 'Cenário inválido.');
      return store.exclusive(() => {
        requestCount = 0;
        store.reset(parsed.data.scenario);
        resetAuth();
        events.disconnect();
        return HttpResponse.json({ scenario: parsed.data.scenario });
      });
    }),
    http.post(`${apiBase}/__mock/nfts/:id`, async ({ params, request }) => {
      const parsed = updateMockNftSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success)
        return error(
          422,
          'VALIDATION_ERROR',
          'Informe edição, preço decimal ou disponibilidade válida.'
        );
      return store.exclusive(() => {
        const state = store.read();
        const nft = state.nfts.find((item) => item.id === params.id);
        if (!nft) return error(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
        const edition = nft.editions.find((item) => item.id === parsed.data.editionId);
        if (!edition) return error(404, 'EDITION_NOT_FOUND', 'Edição não encontrada.');
        if (parsed.data.priceEth !== undefined) edition.priceEth = parsed.data.priceEth;
        if (parsed.data.available !== undefined) edition.available = parsed.data.available;
        state.sequence += 1;
        nft.version += 1;
        nft.updatedAt = new Date(Date.UTC(2026, 0, 1) + state.sequence * 1_000).toISOString();
        store.write(state);
        const event: NftUpdatedEventDto = {
          eventId: `nft.updated:${nft.id}:${nft.version}`,
          type: 'nft.updated',
          resourceId: nft.id,
          version: nft.version,
          occurredAt: nft.updatedAt,
          data: nft,
        };
        return HttpResponse.json(event);
      });
    }),
    http.post(`${apiBase}/__mock/replay`, async ({ request }) => {
      const parsed = nftUpdatedEventSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return error(422, 'VALIDATION_ERROR', 'Evento inválido.');
      events.emitNftUpdated(parsed.data);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${apiBase}/__mock/disconnect`, () => {
      events.disconnect();
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
