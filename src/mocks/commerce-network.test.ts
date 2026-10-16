// @vitest-environment node
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpActivityRepository } from '@/features/activity/data/repositories/http-activity.repository.impl';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { HttpCartRepository } from '@/features/cart/data/repositories/http-cart.repository.impl';
import { calculateCartTotals } from '@/features/cart/domain/entities/cart-totals';
import { HttpFavoritesRepository } from '@/features/favorites/data/repositories/http-favorites.repository.impl';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { createActivityHandlers } from './activity-handlers';
import { createAuthHandlers } from './auth-handlers';
import { createAuthStore } from './auth-store';
import { createCommerceHandlers } from './commerce-handlers';
import { createCommerceStore } from './commerce-store';
import { createMockStore } from './store';
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
};
const authA = createAuthStore(storage, Date.now, true);
const authB = createAuthStore(storage, Date.now, true);
const commerceA = createCommerceStore(authA, storage);
const commerceB = createCommerceStore(authB, storage);
const catalog = createMockStore();
const a = 'http://localhost:3901/api';
const b = 'http://localhost:3902/api';
const server = setupServer(
  ...createAuthHandlers(authA, a),
  ...createCommerceHandlers(authA, catalog, commerceA, a),
  ...createActivityHandlers(authA, catalog, a, commerceA),
  ...createAuthHandlers(authB, b),
  ...createCommerceHandlers(authB, catalog, commerceB, b)
);
const apiA = new AxiosAdapter(a);
const apiB = new AxiosAdapter(b);
const alice = '11111111-1111-4111-8111-111111111111';
const bruno = '22222222-2222-4222-8222-222222222222';
const guestA = crypto.randomUUID();
const guestB = crypto.randomUUID();
const cartA = new HttpCartRepository(apiA, guestA, alice);
const cartB = new HttpCartRepository(apiB, guestB, bruno);
const visitorA = new HttpCartRepository(apiA, guestA, null);
const visitorB = new HttpCartRepository(apiB, guestB, null);
const selection = () => {
  const nft = catalog.read().nfts[0];
  const edition = nft.editions.find((edition) => edition.available >= 3)!;
  return { nftId: nft.id, editionId: edition.id, quantity: 1 };
};
const loginA = () =>
  new HttpAuthRepository(apiA).login({ email: 'alice@kurio.test', password: 'Kurio123!' });
const loginB = () =>
  new HttpAuthRepository(apiB).login({ email: 'bruno@kurio.test', password: 'Kurio123!' });
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  authA.reset();
  const state = authB.read();
  state.session = null;
  authB.write(state);
  catalog.reset();
});
it('persiste favoritos canônicos por conta e nega acesso visitante ou identidade antiga', async () => {
  const favoritesA = new HttpFavoritesRepository(apiA, alice);
  const favoritesB = new HttpFavoritesRepository(apiB, bruno);
  await expect(favoritesA.list()).rejects.toMatchObject({ status: 401 });
  await loginA();
  await loginB();
  await favoritesA.add('nft-001');
  await favoritesA.add('nft-001');
  expect((await favoritesA.list()).nftIds).toEqual(['nft-001']);
  expect((await favoritesB.list()).nftIds).toEqual([]);
  await expect(favoritesA.add('inexistente')).rejects.toMatchObject({ status: 404 });
  expect((await favoritesA.remove('nft-001')).nftIds).toEqual([]);
  await new HttpAuthRepository(apiA).logout();
  await expect(favoritesA.add('nft-001')).rejects.toMatchObject({ status: 401 });
});
it('preserva visitante no refresh, isola abas e valida quantidade sem aceitar preço do cliente', async () => {
  const selected = selection();
  await apiA.post(
    '/cart/items',
    { ...selected, unitPriceEth: '0', name: 'Adulterado' },
    { headers: { 'X-Guest-Cart-Id': guestA } }
  );
  const fresh = new HttpCartRepository(new AxiosAdapter(a), guestA, null);
  const cart = await fresh.get();
  expect(cart.items[0].name).not.toBe('Adulterado');
  expect(cart.items[0].unitPriceEth).not.toBe('0');
  expect((await visitorB.get()).items).toEqual([]);
  await expect(
    fresh.update({ ...selected, quantity: cart.items[0].available + 1 })
  ).rejects.toMatchObject({ status: 409 });
  expect((await fresh.get()).items[0].quantity).toBe(1);
  await expect(fresh.add({ ...selected, quantity: 0 })).rejects.toMatchObject({ status: 422 });
  await fresh.remove(selected.nftId, selected.editionId);
  await fresh.remove(selected.nftId, selected.editionId);
  expect((await fresh.get()).items).toEqual([]);
});
it('incorpora quantidades, limita ao estoque e torna o merge repetível sem duplicar', async () => {
  const selected = selection();
  const source = await visitorA.add({ ...selected, quantity: 2 });
  await visitorA.applyCoupon('KURIO10');
  await loginA();
  await cartA.add({ ...selected, quantity: source.items[0].available });
  const result = await cartA.merge(guestA);
  expect(result.cart.items[0].quantity).toBe(source.items[0].available);
  expect(result.adjustments).toEqual([
    {
      nftId: selected.nftId,
      editionId: selected.editionId,
      requestedQuantity: source.items[0].available + 2,
      availableQuantity: source.items[0].available,
    },
  ]);
  expect(result.cart.couponCode).toBe('KURIO10');
  expect((await cartA.merge(guestA)).cart.items[0].quantity).toBe(source.items[0].available);
  await loginB();
  expect((await new HttpCartRepository(apiB, guestA, bruno).merge(guestA)).cart.items).toEqual([]);
  await new HttpAuthRepository(apiA).logout();
  expect((await visitorA.get()).items).toEqual([]);
  await loginA();
  expect((await cartA.get()).items[0].quantity).toBe(source.items[0].available);
});
it('valida e persiste cupom e calcula descontos em wei também no snapshot da compra', async () => {
  await loginA();
  const selected = selection();
  await cartA.add(selected);
  const applied = await cartA.applyCoupon('  kurio10  ');
  expect(applied.couponCode).toBe('KURIO10');
  expect(applied.totals).toEqual(calculateCartTotals(applied.items, 1000));
  await expect(cartA.applyCoupon('INEXISTENTE')).rejects.toMatchObject({
    status: 422,
    response: { code: 'COUPON_INVALID' },
  });
  await expect(cartA.applyCoupon('EXPIRADO')).rejects.toMatchObject({
    status: 422,
    response: { code: 'COUPON_EXPIRED' },
  });
  expect((await cartA.get()).couponCode).toBe('KURIO10');
  const purchase = await new HttpActivityRepository(apiA).completePurchase(
    {
      attemptId: crypto.randomUUID(),
      items: applied.items,
      couponCode: applied.couponCode,
      walletName: 'MetaMask',
    },
    alice
  );
  expect(purchase.totalEth).toBe(applied.totals.totalEth);
  expect(purchase.discountEth).toBe(applied.totals.discountEth);
  const removed = await cartA.removeCoupon();
  expect(removed.couponCode).toBeNull();
  expect(removed.totals.discountEth).toBe('0.00');
});
it('falhas de mutation não alteram o carrinho nem os favoritos persistidos', async () => {
  await loginA();
  const before = await cartA.add(selection());
  await apiA.post('/__mock/commerce/failure', { resource: 'cart' });
  await expect(cartA.remove(selection().nftId, selection().editionId)).rejects.toMatchObject({
    status: 503,
  });
  expect((await cartA.get()).items).toEqual(before.items);
  await apiA.post('/__mock/commerce/failure', { resource: 'favorites' });
  await expect(new HttpFavoritesRepository(apiA, alice).add('nft-001')).rejects.toMatchObject({
    status: 503,
  });
  expect((await new HttpFavoritesRepository(apiA, alice).list()).nftIds).toEqual([]);
});
