// @vitest-environment node
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpActivityRepository } from '@/features/activity/data/repositories/http-activity.repository.impl';
import type { CompletePurchaseInput } from '@/features/activity/domain/entities/purchase-activity.entity';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { createActivityHandlers } from './activity-handlers';
import { createAuthHandlers } from './auth-handlers';
import { ACCOUNT_LIFETIME_MS, createAuthStore } from './auth-store';
import { createMockStore } from './store';

const base = 'http://127.0.0.1:3898/api';
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
};
const tabData = new Map<string, string>();
const tabStorage = {
  getItem: (key: string) => tabData.get(key) ?? null,
  setItem: (key: string, value: string) => {
    tabData.set(key, value);
  },
};
let now = Date.now();
const store = createAuthStore(storage, () => now, false, tabStorage);
const catalog = createMockStore();
const server = setupServer(
  ...createAuthHandlers(store, base),
  ...createActivityHandlers(store, catalog, base)
);
const api = new AxiosAdapter(base);
const activities = new HttpActivityRepository(api);
const auth = new HttpAuthRepository(api);
const account = { username: 'Colecionador', email: 'activity@example.com', password: 'Teste123!' };
function input(): CompletePurchaseInput {
  const nft = catalog
    .read()
    .nfts.find((item) => item.editions.some((edition) => edition.available > 1));
  if (!nft) throw new Error('Missing fixture');
  const edition = nft.editions.find((item) => item.available > 1)!;
  return {
    attemptId: crypto.randomUUID(),
    walletName: 'MetaMask',
    items: [
      {
        nftId: nft.id,
        name: nft.name,
        imageUrl: nft.imageUrl,
        collection: nft.collection,
        tokenId: nft.id,
        editionId: edition.id,
        editionName: edition.name,
        unitPriceEth: edition.priceEth,
        quantity: 1,
        available: edition.available,
      },
    ],
  };
}
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  now = Date.now();
  data.clear();
  tabData.clear();
  store.reset();
});

it('persiste a compra e repete a mesma tentativa sem duplicar o histórico', async () => {
  await auth.signup(account);
  const order = input();
  const saved = await activities.completePurchase(order);
  expect(await activities.completePurchase(order)).toEqual(saved);
  expect(await activities.list()).toEqual([saved]);
  expect(createAuthStore(storage).read().accounts[0].activity).toEqual([saved]);
  expect(saved.transactionHash).toMatch(/^0x[A-F0-9]{64}$/);
  expect(saved.estimatedFeeEth).toBe('0.016');
  await expect(
    activities.completePurchase({ ...order, items: [{ ...order.items[0], quantity: 2 }] })
  ).rejects.toMatchObject({ status: 409 });
  expect(await activities.list()).toHaveLength(1);
});
it('nega visitante e isola compras entre contas, restaurando o histórico ao entrar novamente', async () => {
  await expect(activities.completePurchase(input())).rejects.toMatchObject({ status: 401 });
  await expect(activities.list()).rejects.toMatchObject({ status: 401 });
  await auth.signup(account);
  expect(await activities.list()).toEqual([]);
  const personal = await activities.completePurchase(input());
  await auth.logout();
  await expect(activities.list()).rejects.toMatchObject({ status: 401 });
  await auth.signup({ ...account, username: 'Outro', email: 'other@example.com' });
  expect(await activities.list()).toEqual([]);
  await auth.logout();
  await auth.login(account);
  expect(await activities.list()).toEqual([personal]);
});
it('rejeita preço adulterado e estoque insuficiente sem registrar uma compra', async () => {
  await auth.signup(account);
  const order = input();
  await expect(
    activities.completePurchase({ ...order, items: [{ ...order.items[0], unitPriceEth: '0.001' }] })
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    activities.completePurchase({
      ...order,
      items: [{ ...order.items[0], quantity: order.items[0].available + 1 }],
    })
  ).rejects.toMatchObject({ status: 409 });
  expect(await activities.list()).toEqual([]);
});
it('nega a compra após expiração da conta sem atribuí-la a visitante', async () => {
  await auth.signup(account);
  now += ACCOUNT_LIFETIME_MS;
  await expect(activities.completePurchase(input())).rejects.toMatchObject({ status: 401 });
  expect(store.read().guestActivity).toEqual([]);
});
it('preserva o histórico anterior se o armazenamento falhar', async () => {
  await auth.signup(account);
  const saved = await activities.completePurchase(input());
  const failing = createAuthStore(
    {
      getItem: storage.getItem,
      setItem: () => {
        throw new Error('quota');
      },
    },
    () => now,
    false,
    tabStorage
  );
  server.use(...createActivityHandlers(failing, catalog, base));
  await expect(activities.completePurchase(input())).rejects.toMatchObject({ status: 503 });
  server.resetHandlers();
  expect(await activities.list()).toEqual([saved]);
});
