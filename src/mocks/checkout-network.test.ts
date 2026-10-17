// @vitest-environment node

import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpCartRepository } from '@/features/cart/data/repositories/http-cart.repository.impl';
import { HttpOrdersRepository } from '@/features/orders/data/repositories/http-orders.repository.impl';
import type { CreateOrderInput } from '@/features/orders/domain/entities/order.entity';
import { HttpWalletConnectionRepository } from '@/features/payment/data/repositories/http-wallet-connection.repository.impl';
import { HttpQuotesRepository } from '@/features/quotes/data/repositories/http-quotes.repository.impl';
import { createAuthStore } from './auth-store';
import { createCheckoutHandlers } from './checkout-handlers';
import { createCommerceHandlers } from './commerce-handlers';
import { COMMERCE_STORAGE_KEY, type CommerceState, createCommerceStore } from './commerce-store';
import { createMockStore } from './store';

const records = new Map<string, string>();
let failWrite = false;
const storage = {
  getItem: (key: string) => records.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (failWrite && key === COMMERCE_STORAGE_KEY) throw new Error('Storage full');
    records.set(key, value);
  },
};
let now = Date.UTC(2026, 9, 16, 12);
const alice = '11111111-1111-4111-8111-111111111111';
const bruno = '22222222-2222-4222-8222-222222222222';
const authA = createAuthStore(storage, () => now, true);
const authB = createAuthStore(storage, () => now, true);
const commerceA = createCommerceStore(authA, storage);
const commerceB = createCommerceStore(authB, storage);
const catalogA = createMockStore();
const catalogB = createMockStore();
const baseA = 'http://127.0.0.1:3911/api';
const baseB = 'http://127.0.0.1:3912/api';
const server = setupServer(
  ...createCommerceHandlers(authA, catalogA, commerceA, baseA),
  ...createCheckoutHandlers(authA, catalogA, commerceA, baseA),
  ...createCommerceHandlers(authB, catalogB, commerceB, baseB),
  ...createCheckoutHandlers(authB, catalogB, commerceB, baseB)
);
function clients(base: string, owner: string) {
  const api = new AxiosAdapter(base);
  return {
    api,
    cart: new HttpCartRepository(api, crypto.randomUUID(), owner),
    quotes: new HttpQuotesRepository(api, owner),
    wallets: new HttpWalletConnectionRepository(api, owner),
    orders: new HttpOrdersRepository(api, owner),
  };
}
const a = clients(baseA, alice);
const b = clients(baseB, bruno);
const collector = {
  displayName: 'Colecionador',
  username: 'colecionador',
  email: 'demo@kurio.test',
  profileName: 'Minha coleção',
  ensName: '',
  referralCode: '',
  note: '',
};
function update(action: (state: CommerceState) => void) {
  const state = commerceA.read();
  action(state);
  commerceA.write(state);
}
async function prepare(client = a, editionId = 'standard'): Promise<CreateOrderInput> {
  const cart = await client.cart.add({ nftId: 'nft-001', editionId, quantity: 1 });
  const quoted = await client.quotes.create({
    cartId: cart.id,
    cartVersion: cart.version,
    network: 'ethereum',
  });
  const quote = await client.quotes.accept(quoted.id);
  const wallet = await client.wallets.connect({
    walletSlot: 'primary',
    network: 'ethereum',
    provider: 'metamask',
  });
  return { quoteId: quote.id, connectionId: wallet.id, collector };
}
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  failWrite = false;
  now = Date.UTC(2026, 9, 16, 12);
  authA.reset();
  const state = authA.read();
  for (const account of state.accounts)
    account.wallets.primary = {
      displayName: 'Colecionador',
      walletAlias: 'Principal',
      profileName: 'Minha coleção',
      email: account.user.email,
      walletAddress: `0x${'a'.repeat(40)}`,
      network: 'ethereum',
      walletType: 'metamask',
      secondaryWallet: '',
      referralCode: '',
      ensName: '',
    };
  state.session = { userId: alice, expiresAt: now + 100_000 };
  authA.write(state);
  const other = authB.read();
  other.session = { userId: bruno, expiresAt: now + 100_000 };
  authB.write(other);
  catalogA.reset();
});
it('cria uma vez por chave, detecta conflito e não fornece recibo pendente', async () => {
  const input = await prepare();
  const key = crypto.randomUUID();
  const [first, second] = await Promise.all([
    a.orders.create(input, key),
    a.orders.create(input, key),
  ]);
  expect(first.id).toBe(second.id);
  expect(first.status).toBe('pending');
  await expect(a.orders.getReceipt(first.id)).rejects.toMatchObject({ status: 409 });
  await expect(
    a.orders.create({ ...input, collector: { ...collector, note: 'Outro conteúdo' } }, key)
  ).rejects.toMatchObject({ status: 409, response: { code: 'IDEMPOTENCY_CONFLICT' } });
  expect((await a.orders.list()).length).toBe(1);
});
it('permite cotar NFTs em outra rede e exige que a carteira corresponda à cotação', async () => {
  const accountState = authA.read();
  accountState.accounts.find((account) => account.user.id === alice)!.wallets.primary!.network =
    'polygon';
  authA.write(accountState);

  const cart = await a.cart.add({ nftId: 'nft-001', editionId: 'standard', quantity: 1 });
  const quote = await a.quotes.create({
    cartId: cart.id,
    cartVersion: cart.version,
    network: 'polygon',
  });
  expect(quote.status).toBe('valid');

  const accepted = await a.quotes.accept(quote.id);
  const wallet = await a.wallets.connect({
    walletSlot: 'primary',
    network: 'polygon',
    provider: 'metamask',
  });
  const order = await a.orders.create(
    { quoteId: accepted.id, connectionId: wallet.id, collector },
    crypto.randomUUID()
  );
  expect(order.status).toBe('pending');
});
it('confirma atomicamente, baixa estoque uma vez e remove somente as quantidades compradas', async () => {
  const input = await prepare();
  const pending = await a.orders.create(input, crypto.randomUUID());
  await a.cart.add({ nftId: 'nft-001', editionId: 'standard', quantity: 2 });
  now += 1001;
  const confirmed = await a.orders.get(pending.id);
  expect(confirmed.status).toBe('confirmed');
  expect(await a.orders.get(pending.id)).toEqual(confirmed);
  expect((await a.cart.get()).items[0].quantity).toBe(2);
  expect(commerceA.read().catalog![0].editions[0].available).toBe(9);
  const receipt = await a.orders.getReceipt(pending.id);
  update((state) => {
    state.catalog![0].editions[0].priceEth = '99';
  });
  expect(await a.orders.getReceipt(pending.id)).toEqual(receipt);
  expect(commerceA.read().attempts[`${alice}:${pending.attemptId}`].orderId).toBe(pending.id);
});
it('recupera timeout após criação e refresh sem duplicar pedido ou estoque', async () => {
  const input = await prepare();
  await a.api.post('/__mock/checkout', { scenario: 'timeout-after-create' });
  const key = crypto.randomUUID();
  await expect(a.orders.create(input, key)).rejects.toMatchObject({ status: 504 });
  const existing = (await a.orders.list())[0];
  expect(existing.attemptId).toBe(key);
  const restored = createCommerceStore(authA, storage);
  expect(restored.read().orders[existing.id]).toEqual(existing);
  now += 1001;
  const recovered = await a.orders.create(input, key);
  expect(recovered.status).toBe('confirmed');
  expect((await a.orders.list()).length).toBe(1);
  expect(commerceA.read().catalog![0].editions[0].available).toBe(9);
});
it('recusa pagamento de modo terminal sem alterar estoque ou carrinho', async () => {
  const input = await prepare();
  await a.api.post('/__mock/checkout', { scenario: 'refused' });
  const order = await a.orders.create(input, crypto.randomUUID());
  now += 1001;
  const refused = await a.orders.get(order.id);
  expect(refused).toMatchObject({ status: 'rejected', rejection: { code: 'PAYMENT_REFUSED' } });
  expect((await a.cart.get()).items[0].quantity).toBe(1);
  expect(commerceA.read().catalog![0].editions[0].available).toBe(10);
  await a.api.post('/__mock/checkout', { scenario: 'confirmed' });
  expect(await a.orders.get(order.id)).toEqual(refused);
  await expect(a.orders.getReceipt(order.id)).rejects.toMatchObject({ status: 409 });
});
it('disputa pela última unidade resulta em uma confirmação e uma recusa sob bloqueio', async () => {
  const [inputA, inputB] = await Promise.all([
    prepare(a, 'edition-one'),
    prepare(b, 'edition-one'),
  ]);
  const [orderA, orderB] = await Promise.all([
    a.orders.create(inputA, crypto.randomUUID()),
    b.orders.create(inputB, crypto.randomUUID()),
  ]);
  now += 1001;
  const result = await Promise.all([a.orders.get(orderA.id), b.orders.get(orderB.id)]);
  expect(result.map((order) => order.status).sort()).toEqual(['confirmed', 'rejected']);
  expect(result.find((order) => order.status === 'rejected')).toMatchObject({
    rejection: { code: 'INSUFFICIENT_STOCK' },
  });
  expect(
    commerceA.read().catalog![0].editions.find((edition) => edition.id === 'edition-one')!.available
  ).toBe(0);
});
it('exige nova revisão quando preço ou disponibilidade mudam e preserva snapshots de cotação', async () => {
  const input = await prepare();
  const original = await a.quotes.get(input.quoteId);
  update((state) => {
    state.catalog![0].editions[0].priceEth = '2.19';
    state.catalog![0].version++;
  });
  await expect(a.orders.create(input, crypto.randomUUID())).rejects.toMatchObject({
    status: 409,
    response: { code: 'QUOTE_CHANGED' },
  });
  const cart = await a.cart.get();
  const review = await a.quotes.create({
    cartId: cart.id,
    cartVersion: cart.version,
    network: 'ethereum',
    previousQuoteId: original.id,
  });
  expect(review.status).toBe('review-required');
  expect(review.totals.totalEth).toBe('2.206');
  update((state) => {
    state.catalog![0].editions[0].priceEth = '3.19';
    state.catalog![0].version++;
  });
  const changedAgain = await a.quotes.accept(review.id);
  expect(changedAgain.status).toBe('review-required');
  expect(await a.quotes.get(original.id)).toEqual(original);
  const accepted = await a.quotes.accept(changedAgain.id);
  expect(accepted.status).toBe('valid');
  const order = await a.orders.create({ ...input, quoteId: accepted.id }, crypto.randomUUID());
  expect(order.status).toBe('pending');
});
it('limita quantidade com aceite explícito e bloqueia edição esgotada', async () => {
  const current = await a.cart.add({ nftId: 'nft-001', editionId: 'standard', quantity: 3 });
  update((state) => {
    state.catalog![0].editions[0].available = 2;
    state.catalog![0].version++;
  });
  const review = await a.quotes.create({
    cartId: current.id,
    cartVersion: current.version,
    network: 'ethereum',
  });
  expect(review.status).toBe('review-required');
  expect(review.items[0].quantity).toBe(2);
  const accepted = await a.quotes.accept(review.id);
  expect(accepted.status).toBe('valid');
  expect((await a.cart.get()).items[0].quantity).toBe(2);
  update((state) => {
    state.catalog![0].editions[0].available = 0;
    state.catalog![0].version++;
  });
  expect((await a.quotes.accept(accepted.id)).status).toBe('unavailable');
});
it('recusa conexão simulada e rejeita desconexão antes da confirmação', async () => {
  await a.api.post('/__mock/checkout', { refuseConnection: true });
  expect(
    await a.wallets.connect({ walletSlot: 'primary', network: 'ethereum', provider: 'metamask' })
  ).toMatchObject({ status: 'refused' });
  await a.api.post('/__mock/checkout', { refuseConnection: false });
  const input = await prepare();
  const order = await a.orders.create(input, crypto.randomUUID());
  await a.wallets.disconnect(input.connectionId);
  now += 1001;
  expect(await a.orders.get(order.id)).toMatchObject({
    status: 'rejected',
    rejection: { code: 'WALLET_DISCONNECTED' },
  });
});
it('isola pedidos/cotações/conexões por conta e exige autenticação', async () => {
  const input = await prepare();
  const order = await a.orders.create(input, crypto.randomUUID());
  await expect(b.orders.get(order.id)).rejects.toMatchObject({ status: 404 });
  await expect(b.quotes.get(input.quoteId)).rejects.toMatchObject({ status: 404 });
  await expect(b.wallets.get(input.connectionId)).rejects.toMatchObject({ status: 404 });
  await expect(
    a.wallets.connect({ walletSlot: 'primary', network: 'polygon', provider: 'metamask' })
  ).rejects.toMatchObject({ status: 422 });
  const state = authA.read();
  state.session = null;
  authA.write(state);
  await expect(a.orders.list()).rejects.toMatchObject({ status: 401 });
});
it('migra compras antigas da conta uma vez sem atribuir histórico visitante ou baixar estoque', async () => {
  const selected = await a.cart.add({ nftId: 'nft-001', editionId: 'standard', quantity: 1 });
  const state = authA.read();
  const old = {
    id: crypto.randomUUID(),
    attemptId: crypto.randomUUID(),
    createdAt: new Date(now - 1000).toISOString(),
    transactionHash: `0x${'f'.repeat(64)}`,
    items: selected.items,
    estimatedFeeEth: '0.016',
    totalEth: '1.206',
    status: 'completed' as const,
    walletName: 'MetaMask' as const,
  };
  state.accounts.find((account) => account.user.id === alice)!.activity.push(old);
  state.guestActivity.push({ ...old, id: crypto.randomUUID() });
  authA.write(state);
  expect(await a.orders.list()).toHaveLength(1);
  expect(await a.orders.list()).toHaveLength(1);
  expect(await b.orders.list()).toHaveLength(0);
  expect((await a.orders.getReceipt(old.id)).transactionHash).toBe(old.transactionHash);
  expect(commerceA.read().catalog![0].editions[0].available).toBe(10);
});

it('revalida cupom expirado e exige aceite do total sem desconto', async () => {
  const input = await prepare();
  const cart = await a.cart.applyCoupon('KURIO10');
  const discounted = await a.quotes.accept(
    (await a.quotes.create({ cartId: cart.id, cartVersion: cart.version, network: 'ethereum' })).id
  );
  expect(discounted.totals.discountEth).toBe('0.119');
  await a.api.post('/__mock/checkout', { expireCoupon: true });
  await expect(
    a.orders.create({ ...input, quoteId: discounted.id }, crypto.randomUUID())
  ).rejects.toMatchObject({ status: 409 });
  const review = await a.quotes.accept(discounted.id);
  expect(review).toMatchObject({
    status: 'review-required',
    couponCode: null,
    totals: { discountEth: '0.00', totalEth: '1.206' },
  });
  const accepted = await a.quotes.accept(review.id);
  expect(accepted.status).toBe('valid');
  expect((await a.cart.get()).couponCode).toBeNull();
});
it('falha de persistência não deixa baixa de estoque ou confirmação parcial', async () => {
  const input = await prepare();
  const order = await a.orders.create(input, crypto.randomUUID());
  now += 1001;
  failWrite = true;
  await expect(a.orders.get(order.id)).rejects.toMatchObject({ status: 503 });
  expect(commerceA.read().orders[order.id].status).toBe('pending');
  expect(commerceA.read().catalog![0].editions[0].available).toBe(10);
  failWrite = false;
  expect((await a.orders.get(order.id)).status).toBe('confirmed');
  expect(commerceA.read().catalog![0].editions[0].available).toBe(9);
});
it('recusa preço alterado durante processamento e conserva o carrinho', async () => {
  const input = await prepare();
  const order = await a.orders.create(input, crypto.randomUUID());
  update((state) => {
    state.catalog![0].editions[0].priceEth = '2.19';
    state.catalog![0].version++;
  });
  now += 1001;
  expect(await a.orders.get(order.id)).toMatchObject({
    status: 'rejected',
    rejection: { code: 'QUOTE_CHANGED' },
  });
  expect((await a.cart.get()).items[0].quantity).toBe(1);
  expect(commerceA.read().catalog![0].editions[0].available).toBe(10);
});
