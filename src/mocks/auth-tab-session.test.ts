// @vitest-environment node
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { HttpProfileRepository } from '@/features/profile/data/repositories/http-profile.repository.impl';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { createAuthHandlers } from './auth-handlers';
import {
  ACCOUNT_LIFETIME_MS,
  AUTH_STORAGE_KEY,
  SESSION_LIFETIME_MS,
  TAB_SESSION_STORAGE_KEY,
  createAuthStore,
} from './auth-store';
import { createProfileHandlers } from './profile-handlers';

function storage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
const shared = storage();
const a = storage();
const b = storage();
let now = Date.parse('2026-10-16T12:00:00Z');
const storeA = createAuthStore(shared, () => now, true, a);
const storeB = createAuthStore(shared, () => now, true, b);
const baseA = 'http://127.0.0.1:3896/a';
const baseB = 'http://127.0.0.1:3896/b';
const server = setupServer(
  ...createAuthHandlers(storeA, baseA),
  ...createAuthHandlers(storeB, baseB),
  ...createProfileHandlers(storeA, baseA),
  ...createProfileHandlers(storeB, baseB)
);
const apiA = new HttpAuthRepository(new AxiosAdapter(baseA));
const apiB = new HttpAuthRepository(new AxiosAdapter(baseB));
const profilesA = new HttpProfileRepository(new AxiosAdapter(baseA));
const profilesB = new HttpProfileRepository(new AxiosAdapter(baseB));
const alice = { email: 'alice@kurio.test', password: 'Kurio123!' };
const bruno = { email: 'bruno@kurio.test', password: 'Kurio123!' };
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  now = Date.parse('2026-10-16T12:00:00Z');
  shared.data.clear();
  a.data.clear();
  b.data.clear();
  storeA.reset();
});

it('mantém identidades e perfil independentes entre abas, inclusive após novo login/logout', async () => {
  const [first, second] = await Promise.all([apiA.login(alice), apiB.login(bruno)]);
  expect((await profilesA.getProfile()).id).toBe(first.user.id);
  expect((await profilesB.getProfile()).id).toBe(second.user.id);
  await apiA.logout();
  expect(await apiA.getSession()).toBeNull();
  expect((await apiB.getSession())?.user.id).toBe(second.user.id);
  await apiA.login(bruno);
  expect((await apiB.getSession())?.user.id).toBe(second.user.id);
  expect(JSON.parse(shared.getItem(AUTH_STORAGE_KEY) ?? '{}')).not.toHaveProperty('session');
  expect(a.getItem(TAB_SESSION_STORAGE_KEY)).not.toBeNull();
});
it('recupera apenas a sessão da própria aba após recriar o store', async () => {
  const first = await apiA.login(alice);
  expect(createAuthStore(shared, () => now, true, a).read().session?.userId).toBe(first.user.id);
  expect(createAuthStore(shared, () => now, true, storage()).read().session).toBeNull();
});
it('expira uma sessão sem derrubar outra que entrou depois e respeita sete dias de conta', async () => {
  await apiA.login(alice);
  now += 60_000;
  await apiB.login(bruno);
  now += SESSION_LIFETIME_MS - 60_000;
  expect(await apiA.getSession()).toBeNull();
  expect((await apiB.getSession())?.user.username).toBe('BrunoDemo');
  now += ACCOUNT_LIFETIME_MS;
  expect(await apiB.getSession()).toBeNull();
});
it('o reset global invalida sessões antigas em outras abas por geração', async () => {
  await apiA.login(alice);
  await apiB.login(bruno);
  storeA.reset();
  expect(await apiA.getSession()).toBeNull();
  expect(await apiB.getSession()).toBeNull();
});
