import { delay, HttpResponse, http } from 'msw';
import { z } from 'zod';
import {
  cartMergeInputSchema,
  cartSelectionSchema,
  couponInputSchema,
} from '@/features/cart/data/schemas/cart.schema';
import type { Cart, CartSelection } from '@/features/cart/domain/entities/cart.entity';
import { calculateCartTotals } from '@/features/cart/domain/entities/cart-totals';
import type { AuthStore } from './auth-store';
import { couponRate } from './checkout-utils';
import { COUPON_FIXTURES } from './commerce-scenarios';
import type { CommerceStore } from './commerce-store';
import type { MockStore } from './store';

class CommerceError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}
const fail = (status: number, code: string, message: string): never => {
  throw new CommerceError(status, code, message);
};
const emptyCart = (userId: string | null): Cart => ({
  id: crypto.randomUUID(),
  userId,
  version: 1,
  items: [],
  couponCode: null,
  totals: calculateCartTotals([]),
});
export function createCommerceHandlers(
  auth: AuthStore,
  catalog: MockStore,
  store: CommerceStore,
  apiBase: string
) {
  let nextFailure: { resource: 'cart' | 'favorites'; delayMs: number; status: number } | null =
    null;
  const run = async (
    resource: 'cart' | 'favorites',
    request: Request,
    action: (owner: string | null, guest: string | null) => Promise<unknown> | unknown
  ) => {
    try {
      if (request.method !== 'GET' && nextFailure?.resource === resource) {
        const failure = nextFailure;
        nextFailure = null;
        await delay(failure.delayMs);
        if (failure.status)
          return HttpResponse.json(
            { code: 'SIMULATED_FAILURE', message: 'Não foi possível salvar. Tente novamente.' },
            { status: failure.status }
          );
      }
      const execute = async () => {
        const owner = auth.read().session?.userId ?? null;
        const expected = request.headers.get('X-Expected-User');
        if (expected && expected !== (owner ?? 'guest'))
          fail(401, 'SESSION_REQUIRED', 'Entre novamente para continuar.');
        if (resource === 'favorites' && !owner)
          fail(401, 'SESSION_REQUIRED', 'Entre para acessar seus favoritos.');
        const guest = request.headers.get('X-Guest-Cart-Id');
        if (!owner && resource === 'cart' && !z.uuid().safeParse(guest).success)
          fail(422, 'GUEST_CART_REQUIRED', 'Identificação do carrinho inválida.');
        return action(owner, guest);
      };
      // Also serialize reads that create an empty cart. Every mutation reloads persisted state inside this lock.
      const operation = store.exclusive(execute);
      return new HttpResponse(JSON.stringify(await operation), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof CommerceError)
        return HttpResponse.json(
          { code: error.code, message: error.message },
          { status: error.status }
        );
      if (error instanceof z.ZodError)
        return HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Dados inválidos.' },
          { status: 422 }
        );
      return HttpResponse.json(
        {
          code: 'COMMERCE_UNAVAILABLE',
          message: 'Não foi possível salvar ou consultar seus dados. Tente novamente.',
        },
        { status: 503 }
      );
    }
  };
  const canonical = (selection: CartSelection) => {
    const nft = catalog.read().nfts.find((nft) => nft.id === selection.nftId);
    const edition = nft?.editions.find((edition) => edition.id === selection.editionId);
    if (!nft || !edition) return fail(404, 'NFT_NOT_FOUND', 'NFT ou edição não encontrado.');
    return {
      ...selection,
      name: nft.name,
      imageUrl: nft.imageUrl,
      collection: nft.collection,
      tokenId: nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id,
      editionName: edition.name,
      unitPriceEth: edition.priceEth,
      available: edition.available,
    };
  };
  const coupon = (code: string) => {
    const value = COUPON_FIXTURES.find((item) => item.code === code);
    if (!value) return fail(422, 'COUPON_INVALID', 'Código promocional inválido.');
    if (
      store.read().expiredCoupons.includes(code) ||
      (value.expiresAt && Date.parse(value.expiresAt) <= auth.now())
    )
      return fail(422, 'COUPON_EXPIRED', 'Este código promocional expirou.');
    return value;
  };
  const saveCart = (cart: Cart) => {
    cart.items = cart.items.map(canonical);
    cart.totals = calculateCartTotals(
      cart.items,
      couponRate(cart.couponCode, auth.now(), store.read().expiredCoupons)
    );
    return cart;
  };
  const cartAction = (
    request: Request,
    action: (cart: Cart) => Promise<void> | void,
    mutate = true
  ) =>
    run('cart', request, async (owner, guest) => {
      const state = store.read();
      const key = owner ?? `guest:${guest}`;
      const cart = state.carts[key] ?? emptyCart(owner);
      await action(cart);
      if (!mutate) {
        for (const item of cart.items) {
          const available = canonical(item).available;
          if (available > 0 && item.quantity > available) {
            item.quantity = available;
            cart.version++;
          }
        }
      }
      if (mutate) cart.version++;
      saveCart(cart);
      state.carts[key] = cart;
      store.write(state);
      return cart;
    });
  const favorites = (request: Request, nftId?: string, add = false) =>
    run('favorites', request, (owner) => {
      const state = store.read();
      const userId = owner!;
      const result = state.favorites[userId] ?? { userId, version: 1, nftIds: [] };
      if (nftId) {
        if (!catalog.read().nfts.some((nft) => nft.id === nftId))
          fail(404, 'NFT_NOT_FOUND', 'NFT não encontrado.');
        result.nftIds = add
          ? [...new Set([...result.nftIds, nftId])]
          : result.nftIds.filter((id) => id !== nftId);
        result.version++;
      }
      state.favorites[userId] = result;
      store.write(state);
      return result;
    });
  return [
    http.post(`${apiBase}/__mock/commerce/failure`, async ({ request }) => {
      const parsed = z
        .object({
          resource: z.enum(['cart', 'favorites']),
          delayMs: z.number().int().min(0).max(5000).default(0),
          status: z.union([z.literal(0), z.literal(503)]).default(503),
        })
        .safeParse(await request.json().catch(() => null));
      if (!parsed.success) return new HttpResponse(null, { status: 422 });
      nextFailure = parsed.data;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${apiBase}/favorites`, ({ request }) => favorites(request)),
    http.put(`${apiBase}/favorites/:nftId`, ({ request, params }) =>
      favorites(request, String(params.nftId), true)
    ),
    http.delete(`${apiBase}/favorites/:nftId`, ({ request, params }) =>
      favorites(request, String(params.nftId))
    ),
    http.get(`${apiBase}/cart`, ({ request }) => cartAction(request, () => undefined, false)),
    http.post(`${apiBase}/cart/items`, ({ request }) =>
      cartAction(request, async (cart) => {
        const input = cartSelectionSchema.parse(await request.json());
        const existing = cart.items.find(
          (item) => item.nftId === input.nftId && item.editionId === input.editionId
        );
        const item = canonical({ ...input, quantity: input.quantity + (existing?.quantity ?? 0) });
        if (item.quantity > item.available || item.quantity > 10_000)
          fail(409, 'INSUFFICIENT_STOCK', 'Quantidade maior que o estoque disponível.');
        if (!existing && cart.items.length >= 100)
          fail(422, 'CART_LIMIT', 'O carrinho aceita até 100 edições.');
        cart.items = [
          item,
          ...cart.items.filter(
            (entry) => entry.nftId !== input.nftId || entry.editionId !== input.editionId
          ),
        ];
      })
    ),
    http.patch(`${apiBase}/cart/items/:nftId/:editionId`, ({ request, params }) =>
      cartAction(request, async (cart) => {
        const body = z
          .object({ quantity: z.number().int().positive().max(10_000) })
          .parse(await request.json());
        const input = cartSelectionSchema.parse({
          ...body,
          nftId: params.nftId,
          editionId: params.editionId,
        });
        const item = canonical(input);
        if (
          !cart.items.some(
            (entry) => entry.nftId === input.nftId && entry.editionId === input.editionId
          )
        )
          fail(404, 'CART_ITEM_NOT_FOUND', 'Edição não encontrada no carrinho.');
        if (input.quantity > item.available)
          fail(409, 'INSUFFICIENT_STOCK', 'Quantidade maior que o estoque disponível.');
        cart.items = cart.items.map((entry) =>
          entry.nftId === input.nftId && entry.editionId === input.editionId ? item : entry
        );
      })
    ),
    http.delete(`${apiBase}/cart/items/:nftId/:editionId`, ({ request, params }) =>
      cartAction(request, (cart) => {
        cart.items = cart.items.filter(
          (item) => item.nftId !== params.nftId || item.editionId !== params.editionId
        );
      })
    ),
    http.put(`${apiBase}/cart/coupon`, ({ request }) =>
      cartAction(request, async (cart) => {
        const { code } = couponInputSchema.parse(await request.json());
        coupon(code);
        cart.couponCode = code;
      })
    ),
    http.delete(`${apiBase}/cart/coupon`, ({ request }) =>
      cartAction(request, (cart) => {
        cart.couponCode = null;
      })
    ),
    http.post(`${apiBase}/cart/merge`, ({ request }) =>
      run('cart', request, async (owner) => {
        if (!owner) return fail(401, 'SESSION_REQUIRED', 'Entre para incorporar seu carrinho.');
        const { guestCartId } = cartMergeInputSchema.parse(await request.json());
        if (request.headers.get('X-Guest-Cart-Id') !== guestCartId)
          fail(422, 'GUEST_CART_REQUIRED', 'Identificação do carrinho inválida.');
        const state = store.read();
        const target = state.carts[owner] ?? emptyCart(owner);
        const source = state.carts[`guest:${guestCartId}`];
        const adjustments = [];
        if (source && !state.merges[guestCartId]) {
          for (const selection of source.items) {
            const existing = target.items.find(
              (item) => item.nftId === selection.nftId && item.editionId === selection.editionId
            );
            const requestedQuantity = selection.quantity + (existing?.quantity ?? 0);
            const item = canonical({ ...selection, quantity: requestedQuantity });
            const limit =
              target.items.length >= 100 && !existing ? 0 : Math.min(item.available, 10_000);
            item.quantity = Math.min(requestedQuantity, limit);
            if (item.quantity !== requestedQuantity)
              adjustments.push({
                nftId: item.nftId,
                editionId: item.editionId,
                requestedQuantity,
                availableQuantity: item.quantity,
              });
            target.items = target.items.filter(
              (entry) => entry.nftId !== item.nftId || entry.editionId !== item.editionId
            );
            if (item.quantity > 0) target.items.push(item);
          }
          if (!target.couponCode && source.couponCode) {
            try {
              coupon(source.couponCode);
              target.couponCode = source.couponCode;
            } catch {
              /* Expired guest coupons are not transferred. */
            }
          }
          target.version++;
          state.merges[guestCartId] = owner;
          delete state.carts[`guest:${guestCartId}`];
        }
        state.carts[owner] = saveCart(target);
        store.write(state);
        return { cart: target, adjustments };
      })
    ),
  ];
}
