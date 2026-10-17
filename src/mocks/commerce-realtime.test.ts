// @vitest-environment node

import { setupServer } from 'msw/node';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { createSocketClient, type RealtimeSocket } from '@/core/realtime/socket-client';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { HttpCartRepository } from '@/features/cart/data/repositories/http-cart.repository.impl';
import { subscribeOrderUpdates } from '@/features/orders/data/realtime/subscribe-order-updates';
import { HttpOrdersRepository } from '@/features/orders/data/repositories/http-orders.repository.impl';
import type { OrderUpdatedEvent } from '@/features/orders/domain/entities/order-updated-event.entity';
import { HttpWalletConnectionRepository } from '@/features/payment/data/repositories/http-wallet-connection.repository.impl';
import { HttpQuotesRepository } from '@/features/quotes/data/repositories/http-quotes.repository.impl';
import { createMockEnvironment } from './environment';

const origin = 'http://127.0.0.1:3920';
const mocks = createMockEnvironment({ origin, seedDemoAccounts: true });
const server = setupServer(...mocks.handlers);
const api = new AxiosAdapter(`${origin}/api`);
let socket: RealtimeSocket;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => {
  socket?.disconnect();
  mocks.dispose();
  server.close();
});
it('entrega order.updated via Socket.IO, filtra outra conta e ignora repetição/regressão até unsubscribe', async () => {
  const session = await new HttpAuthRepository(api).login({
    email: 'alice@kurio.test',
    password: 'Kurio123!',
  });
  const owner = session.user.id;
  const state = mocks.authStore.read();
  state.accounts.find((account) => account.user.id === owner)!.wallets.primary = {
    displayName: 'Alice',
    walletAlias: 'Principal',
    network: 'ethereum',
    profileName: 'Minha coleção',
    walletAddress: `0x${'a'.repeat(40)}`,
    secondaryWallet: '',
    walletType: 'metamask',
    referralCode: '',
    email: 'alice@kurio.test',
    ensName: '',
  };
  mocks.authStore.write(state);
  socket = await createSocketClient(origin);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
  const received: OrderUpdatedEvent[] = [];
  const raw: OrderUpdatedEvent[] = [];
  socket.on('order.updated', (event: OrderUpdatedEvent) => raw.push(event));
  const stop = subscribeOrderUpdates(socket, owner, (event) => received.push(event));
  const cart = await new HttpCartRepository(api, crypto.randomUUID(), owner).add({
    nftId: 'nft-001',
    editionId: 'standard',
    quantity: 1,
  });
  const quotes = new HttpQuotesRepository(api, owner);
  const quote = await quotes.accept(
    (await quotes.create({ cartId: cart.id, cartVersion: cart.version, network: 'ethereum' })).id
  );
  const connection = await new HttpWalletConnectionRepository(api, owner).connect({
    network: 'ethereum',
    walletSlot: 'primary',
    provider: 'metamask',
  });
  await api.post('/__mock/checkout', { resolveAfterMs: 0 });
  const orders = new HttpOrdersRepository(api, owner);
  const pendingEvent = new Promise<OrderUpdatedEvent>((resolve) =>
    socket.once('order.updated', resolve)
  );
  const pending = await orders.create(
    {
      quoteId: quote.id,
      connectionId: connection.id,
      collector: {
        displayName: 'Alice',
        username: 'AliceDemo',
        profileName: 'Coleção',
        email: 'alice@kurio.test',
        ensName: '',
        referralCode: '',
        note: '',
      },
    },
    crypto.randomUUID()
  );
  expect((await pendingEvent).data.status).toBe('pending');
  const confirmedEvent = new Promise<OrderUpdatedEvent>((resolve) =>
    socket.once('order.updated', resolve)
  );
  const confirmed = await orders.getReceipt(pending.id);
  const terminal = await confirmedEvent;
  expect(terminal.data).toEqual(confirmed);
  expect(received.map((event) => event.data.status)).toEqual(['pending', 'confirmed']);
  const other = '22222222-2222-4222-8222-222222222222';
  await api.post('/__mock/replay-order', {
    ...terminal,
    userId: other,
    data: { ...confirmed, userId: other },
  });
  const barrier = new Promise<void>((resolve) => socket.once('order.updated', () => resolve()));
  await api.post('/__mock/replay-order', terminal);
  await barrier;
  expect(raw).toHaveLength(3);
  expect(raw.every((event) => event.userId === owner)).toBe(true);
  expect(received).toHaveLength(2);
  const regression = { ...terminal, version: 3, data: { ...pending, version: 3 } };
  const before = new Promise<void>((resolve) => socket.once('order.updated', () => resolve()));
  await api.post('/__mock/replay-order', regression);
  await before;
  expect(received).toHaveLength(2);
  stop();
  const unsubscribed = new Promise<void>((resolve) =>
    socket.once('order.updated', () => resolve())
  );
  await api.post('/__mock/replay-order', terminal);
  await unsubscribed;
  expect(received).toHaveLength(2);
  const oldCount = raw.length;
  await new HttpAuthRepository(api).logout();
  await new HttpAuthRepository(api).login({ email: 'bruno@kurio.test', password: 'Kurio123!' });
  await api.post('/__mock/replay-order', {
    ...terminal,
    userId: other,
    data: { ...confirmed, userId: other },
  });
  const publicBarrier = new Promise<void>((resolve) => socket.once('nft.updated', () => resolve()));
  await api.post('/__mock/nfts/nft-001', { editionId: 'standard', available: 8 });
  await publicBarrier;
  expect(raw).toHaveLength(oldCount);
});
