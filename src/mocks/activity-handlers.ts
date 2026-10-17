import { completePurchaseSchema } from '@/features/activity/data/schemas/activity.schema';
import {
  type PurchaseActivity,
  getPurchaseFingerprint,
} from '@/features/activity/domain/entities/purchase-activity.entity';
import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';
import { calculateCartTotals } from '@/features/cart/domain/entities/cart-totals';
import { http, HttpResponse } from 'msw';
import { type AuthStore, toHex } from './auth-store';
import { COUPON_FIXTURES } from './commerce-scenarios';
import type { CommerceStore } from './commerce-store';
import type { MockStore } from './store';

export function createActivityHandlers(
  auth: AuthStore,
  catalog: MockStore,
  apiBase: string,
  commerce?: CommerceStore
) {
  const error = (status: number, code: string, message: string) =>
    HttpResponse.json({ code, message }, { status });
  const unavailable = () =>
    error(
      503,
      'ACTIVITY_UNAVAILABLE',
      'Não foi possível salvar ou consultar a atividade. Tente novamente.'
    );
  return [
    http.get(`${apiBase}/activity`, () => {
      try {
        const state = auth.read();
        if (!state.session)
          return error(401, 'SESSION_REQUIRED', 'Entre novamente para acessar seus pedidos.');
        const history =
          state.accounts.find((account) => account.user.id === state.session?.userId)?.activity ??
          [];
        return HttpResponse.json(
          [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      } catch {
        return unavailable();
      }
    }),
    http.post(`${apiBase}/activity/purchases`, async ({ request }) => {
      try {
        const owner = auth.read().session?.userId;
        if (!owner)
          return error(401, 'SESSION_REQUIRED', 'Entre novamente para concluir a compra.');
        const expectedOwner = request.headers.get('X-Expected-User');
        if (expectedOwner && expectedOwner !== owner)
          return error(
            409,
            'SESSION_CHANGED',
            'Sua sessão mudou. Confira o pedido e tente novamente.'
          );
        const parsed = completePurchaseSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return error(
            422,
            'VALIDATION_ERROR',
            parsed.error.issues[0]?.message ?? 'Pedido inválido.'
          );
        const input = parsed.data;
        if (request.headers.get('Idempotency-Key') !== input.attemptId)
          return error(
            422,
            'IDEMPOTENCY_KEY_REQUIRED',
            'Informe a identificação da tentativa de compra.'
          );
        const state = auth.read();
        if (state.session?.userId !== owner)
          return error(
            401,
            'SESSION_REQUIRED',
            'Sua sessão mudou. Confira o pedido e tente novamente.'
          );
        const account = state.accounts.find((item) => item.user.id === owner);
        if (!account)
          return error(401, 'SESSION_REQUIRED', 'Entre novamente para concluir a compra.');
        const history = account.activity;
        const existing = history.find((activity) => activity.attemptId === input.attemptId);
        if (existing)
          return getPurchaseFingerprint(existing) === getPurchaseFingerprint(input)
            ? HttpResponse.json(existing)
            : error(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa já foi usada para outro pedido.');
        const items: CartItem[] = [];
        const nfts = catalog.read().nfts;
        for (const selection of input.items) {
          const nft = nfts.find((item) => item.id === selection.nftId);
          const edition = nft?.editions.find((item) => item.id === selection.editionId);
          if (!nft || !edition)
            return error(
              404,
              'NFT_NOT_FOUND',
              'Um NFT ou edição do pedido não está mais disponível.'
            );
          if (selection.quantity > edition.available)
            return error(
              409,
              'INSUFFICIENT_STOCK',
              'A quantidade disponível mudou. Revise o carrinho.'
            );
          if (selection.unitPriceEth !== edition.priceEth)
            return error(
              409,
              'PRICE_CHANGED',
              'O preço de um NFT mudou. Revise o carrinho antes de concluir.'
            );
          items.push({
            nftId: nft.id,
            name: nft.name,
            imageUrl: nft.imageUrl,
            collection: nft.collection,
            tokenId: nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id,
            editionId: edition.id,
            editionName: edition.name,
            unitPriceEth: edition.priceEth,
            quantity: selection.quantity,
            available: edition.available,
          });
        }
        const code = commerce?.read().carts[owner]?.couponCode ?? null;
        if ((input.couponCode ?? null) !== code)
          return error(
            409,
            'COUPON_CHANGED',
            'O cupom mudou. Revise o carrinho antes de concluir.'
          );
        const coupon = code ? COUPON_FIXTURES.find((item) => item.code === code) : null;
        if (code && (!coupon || (coupon.expiresAt && Date.parse(coupon.expiresAt) <= auth.now())))
          return error(
            422,
            'COUPON_EXPIRED',
            'O código promocional expirou. Remova o cupom e revise o carrinho.'
          );
        const totals = calculateCartTotals(items, coupon?.discountBasisPoints ?? 0);
        const activity: PurchaseActivity = {
          ...input,
          items,
          id: crypto.randomUUID(),
          createdAt: new Date(auth.now()).toISOString(),
          transactionHash: `0x${toHex(crypto.getRandomValues(new Uint8Array(32))).toUpperCase()}`,
          estimatedFeeEth: totals.estimatedFeeEth,
          discountEth: totals.discountEth,
          totalEth: totals.totalEth,
          status: 'completed',
        };
        history.unshift(activity);
        auth.write(state);
        return HttpResponse.json(activity, { status: 201 });
      } catch {
        return unavailable();
      }
    }),
  ];
}
