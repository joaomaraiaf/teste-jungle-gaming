import { orderUpdatedEventSchema } from '@/features/orders/data/schemas/order-updated-event.schema';
import {
  createOrderSchema,
  idempotencyKeySchema,
} from '@/features/orders/data/schemas/order.schema';
import type { OrderUpdatedEvent } from '@/features/orders/domain/entities/order-updated-event.entity';
import type { CreateOrderInput, Order } from '@/features/orders/domain/entities/order.entity';
import { walletConnectionInputSchema } from '@/features/payment/data/schemas/wallet-connection.schema';
import { quoteInputSchema } from '@/features/quotes/data/schemas/quote.schema';
import type { Quote } from '@/features/quotes/domain/entities/quote.entity';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { AuthStore } from './auth-store';
import { CheckoutError, checkoutFail, stableOrderInput } from './checkout-utils';
import { COMMERCE_SCENARIOS } from './commerce-scenarios';
import { type CommerceState, type CommerceStore, checkoutScenarioSchema } from './commerce-store';
import { migrateActivities, resolveOrders } from './order-engine';
import { evaluateQuote, sameQuoteValues } from './quote-engine';
import type { MockStore } from './store';

export function createCheckoutHandlers(
  auth: AuthStore,
  catalog: MockStore,
  commerce: CommerceStore,
  apiBase: string,
  events?: { emitOrderUpdated(event: OrderUpdatedEvent): void }
) {
  catalog.attachCommerce(commerce);
  const run = async (
    request: Request,
    action: (
      state: CommerceState,
      owner: string
    ) => Promise<{ body: unknown; status?: number }> | { body: unknown; status?: number }
  ) => {
    try {
      return await commerce.exclusive(async () => {
        const owner = auth.read().session?.userId;
        if (
          !owner ||
          (request.headers.has('X-Expected-User') &&
            request.headers.get('X-Expected-User') !== owner)
        )
          checkoutFail(401, 'SESSION_REQUIRED', 'Entre novamente para continuar.');
        const state = commerce.read();
        state.catalog ??= catalog.read().nfts;
        migrateActivities(state, auth);
        resolveOrders(state, auth.now());
        const result = await action(state, owner!);
        if (auth.read().session?.userId !== owner)
          checkoutFail(401, 'SESSION_REQUIRED', 'Sua sessão mudou. Entre novamente.');
        commerce.write(state);
        return new HttpResponse(JSON.stringify(result.body), {
          status: result.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
    } catch (error) {
      if (error instanceof CheckoutError)
        return HttpResponse.json(
          { code: error.code, message: error.message },
          { status: error.status }
        );
      if (error instanceof z.ZodError)
        return HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: error.issues[0]?.message ?? 'Dados inválidos.',
            fieldErrors: Object.fromEntries(
              error.issues.map((issue) => [issue.path.join('.'), [issue.message]])
            ),
          },
          { status: 422 }
        );
      return HttpResponse.json(
        {
          code: 'CHECKOUT_UNAVAILABLE',
          message: 'Não foi possível consultar o pedido. Você pode tentar recuperá-lo.',
        },
        { status: 503 }
      );
    }
  };
  const owned = <T extends { userId: string }>(
    records: Record<string, T>,
    id: string,
    owner: string
  ): T => {
    const item = records[id];
    if (!item || item.userId !== owner)
      return checkoutFail(404, 'RESOURCE_NOT_FOUND', 'Recurso não encontrado.');
    return item;
  };
  const cart = (state: CommerceState, owner: string) => {
    const current = state.carts[owner];
    if (!current?.items.length)
      return checkoutFail(422, 'EMPTY_CART', 'Adicione um NFT ao carrinho.');
    return current;
  };
  return [
    http.post(`${apiBase}/__mock/replay-order`, async ({ request }) => {
      const parsed = orderUpdatedEventSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return new HttpResponse(null, { status: 422 });
      events?.emitOrderUpdated(parsed.data);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${apiBase}/activity/purchases`, () =>
      HttpResponse.json(
        { code: 'USE_ORDERS', message: 'Use o fluxo de cotação, conexão e pedidos.' },
        { status: 410 }
      )
    ),
    http.post(`${apiBase}/__mock/checkout`, async ({ request }) => {
      const parsed = z
        .object({
          outcome: z.enum(['confirmed', 'rejected']).optional(),
          resolveAfterMs: z.number().int().min(0).max(60_000).optional(),
          timeoutAfterCreation: z.boolean().optional(),
          refuseConnection: z.boolean().optional(),
          scenario: z
            .enum(['confirmed', 'refused', 'timeout-after-create', 'last-unit'])
            .optional(),
          expireCoupon: z.boolean().optional(),
          pricingVersion: z.number().int().positive().optional(),
        })
        .safeParse(await request.json().catch(() => null));
      if (!parsed.success) return new HttpResponse(null, { status: 422 });
      return commerce.exclusive(() => {
        const state = commerce.read();
        state.catalog ??= catalog.read().nfts;
        const { scenario, pricingVersion, expireCoupon, ...overrides } = parsed.data;
        const definition = scenario ? COMMERCE_SCENARIOS[scenario] : {};
        state.checkoutScenario = checkoutScenarioSchema.parse({
          ...state.checkoutScenario,
          ...definition,
          ...overrides,
        });
        if (pricingVersion) state.pricingVersion = pricingVersion;
        if (expireCoupon !== undefined) state.expiredCoupons = expireCoupon ? ['KURIO10'] : [];
        if (scenario === 'last-unit') {
          const nft = state.catalog.find((nft) => nft.id === 'nft-001');
          const edition = nft?.editions.find((edition) => edition.id === 'edition-one');
          if (nft && edition) {
            edition.available = 1;
            nft.version++;
          }
        }
        commerce.write(state);
        return new HttpResponse(null, { status: 204 });
      });
    }),
    http.post(`${apiBase}/quotes`, ({ request }) =>
      run(request, async (state, owner) => {
        const input = quoteInputSchema.parse(await request.json().catch(() => null));
        const current = cart(state, owner);
        if (current.id !== input.cartId)
          checkoutFail(404, 'CART_NOT_FOUND', 'Carrinho não encontrado.');
        if (current.version !== input.cartVersion)
          checkoutFail(409, 'CART_CHANGED', 'O carrinho mudou. Atualize antes de revisar.');
        const previous = input.previousQuoteId
          ? owned(state.quotes, input.previousQuoteId, owner)
          : undefined;
        const quote = evaluateQuote(state, current, input.network, auth.now(), previous);
        state.quotes[quote.id] = quote;
        return { body: quote, status: 201 };
      })
    ),
    http.get(`${apiBase}/quotes/:id`, ({ request, params }) =>
      run(request, (state, owner) => ({ body: owned(state.quotes, String(params.id), owner) }))
    ),
    http.post(`${apiBase}/quotes/:id/accept`, ({ request, params }) =>
      run(request, (state, owner) => {
        const previous = owned(state.quotes, String(params.id), owner);
        const current = cart(state, owner);
        const candidate = evaluateQuote(state, current, previous.network, auth.now(), previous);
        if (candidate.status === 'unavailable' || !sameQuoteValues(previous, candidate)) {
          candidate.status = candidate.status === 'unavailable' ? 'unavailable' : 'review-required';
          state.quotes[candidate.id] = candidate;
          return { body: candidate };
        }
        const changed =
          JSON.stringify(current.items) !== JSON.stringify(candidate.items) ||
          current.couponCode !== candidate.couponCode;
        if (changed) {
          current.items = candidate.items;
          current.couponCode = candidate.couponCode;
          current.totals = candidate.totals;
          current.version++;
        }
        const accepted: Quote = {
          ...candidate,
          cartVersion: current.version,
          status: 'valid',
          issues: [],
        };
        state.quotes[accepted.id] = accepted;
        state.acceptedQuotes[accepted.id] = true;
        return { body: accepted };
      })
    ),
    http.post(`${apiBase}/wallet-connections`, ({ request }) =>
      run(request, async (state, owner) => {
        const input = walletConnectionInputSchema.parse(await request.json().catch(() => null));
        const account = auth.read().accounts.find((account) => account.user.id === owner)!;
        const wallet =
          input.walletSlot === 'secondary' && account.wallets.secondarySameAsPrimary
            ? account.wallets.primary
            : account.wallets[input.walletSlot];
        if (!wallet)
          checkoutFail(
            422,
            'WALLET_REQUIRED',
            'Cadastre e selecione uma carteira antes de conectar.'
          );
        if (wallet!.network !== input.network)
          checkoutFail(
            422,
            'NETWORK_MISMATCH',
            'A rede da carteira deve corresponder à rede selecionada.'
          );
        const connection = {
          ...input,
          id: crypto.randomUUID(),
          userId: owner,
          walletAddress: wallet!.walletAddress,
          status: state.checkoutScenario.refuseConnection
            ? ('refused' as const)
            : ('connected' as const),
          version: 1,
        };
        state.connections[connection.id] = connection;
        return { body: connection, status: 201 };
      })
    ),
    http.get(`${apiBase}/wallet-connections/:id`, ({ request, params }) =>
      run(request, (state, owner) => ({ body: owned(state.connections, String(params.id), owner) }))
    ),
    http.delete(`${apiBase}/wallet-connections/:id`, ({ request, params }) =>
      run(request, (state, owner) => {
        const connection = owned(state.connections, String(params.id), owner);
        if (connection.status !== 'disconnected') {
          connection.status = 'disconnected';
          connection.version++;
        }
        return { body: connection };
      })
    ),
    http.post(`${apiBase}/orders`, ({ request }) =>
      run(request, async (state, owner) => {
        const input: CreateOrderInput = createOrderSchema.parse(
          await request.json().catch(() => null)
        );
        const attemptId = idempotencyKeySchema.parse(request.headers.get('Idempotency-Key'));
        const key = `${owner}:${attemptId}`;
        const existing = state.attempts[key];
        if (existing) {
          if (stableOrderInput(existing.input) !== stableOrderInput(input))
            checkoutFail(
              409,
              'IDEMPOTENCY_CONFLICT',
              'Esta tentativa já foi usada para outro pedido.'
            );
          return { body: state.orders[existing.orderId] };
        }
        if (
          Object.values(state.orders).some(
            (order) => order.userId === owner && order.attemptId === attemptId
          )
        )
          checkoutFail(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa já foi usada.');
        const quote = owned(state.quotes, input.quoteId, owner);
        const connection = owned(state.connections, input.connectionId, owner);
        if (!state.acceptedQuotes[quote.id] || quote.status !== 'valid')
          checkoutFail(409, 'QUOTE_CHANGED', 'Revise e aceite a cotação antes de confirmar.');
        if (connection.status !== 'connected')
          checkoutFail(409, 'WALLET_DISCONNECTED', 'Conecte a carteira antes de confirmar.');
        if (connection.network !== quote.network)
          checkoutFail(422, 'NETWORK_MISMATCH', 'Carteira e cotação devem usar a mesma rede.');
        const candidate = evaluateQuote(
          state,
          cart(state, owner),
          quote.network,
          auth.now(),
          quote
        );
        if (candidate.status !== 'valid' || !sameQuoteValues(quote, candidate))
          checkoutFail(409, 'QUOTE_CHANGED', 'Preço, estoque ou cupom mudou. Revise a cotação.');
        const createdAt = new Date(auth.now()).toISOString();
        const order: Order = {
          id: crypto.randomUUID(),
          userId: owner,
          attemptId,
          quoteId: quote.id,
          connectionId: connection.id,
          version: 1,
          createdAt,
          updatedAt: createdAt,
          snapshot: {
            items: structuredClone(quote.items),
            totals: structuredClone(quote.totals),
            collector: input.collector,
            walletAddress: connection.walletAddress,
            provider: connection.provider,
            network: connection.network,
          },
          status: 'pending',
          resolveAt: new Date(auth.now() + state.checkoutScenario.resolveAfterMs).toISOString(),
        };
        state.orders[order.id] = order;
        state.attempts[key] = { orderId: order.id, input };
        state.resolutions[order.id] = state.checkoutScenario.outcome;
        return state.checkoutScenario.timeoutAfterCreation
          ? {
              body: {
                code: 'TIMEOUT_AFTER_CREATION',
                message:
                  'O envio demorou, mas o pedido pode ter sido criado. Consulte o resultado antes de tentar outra compra.',
              },
              status: 504,
            }
          : { body: order, status: 201 };
      })
    ),
    http.get(`${apiBase}/orders`, ({ request }) =>
      run(request, (state, owner) => ({
        body: Object.values(state.orders)
          .filter((order) => order.userId === owner)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
    ),
    http.get(`${apiBase}/orders/:id/receipt`, ({ request, params }) =>
      run(request, (state, owner) => {
        const order = owned(state.orders, String(params.id), owner);
        if (order.status !== 'confirmed')
          checkoutFail(
            409,
            'ORDER_NOT_CONFIRMED',
            'O comprovante só está disponível para pedidos confirmados.'
          );
        return { body: order };
      })
    ),
    http.get(`${apiBase}/orders/:id`, ({ request, params }) =>
      run(request, (state, owner) => ({ body: owned(state.orders, String(params.id), owner) }))
    ),
  ];
}
