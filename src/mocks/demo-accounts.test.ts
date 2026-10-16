// @vitest-environment node
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { createAuthHandlers } from './auth-handlers';
import { ACCOUNT_LIFETIME_MS, AUTH_STORAGE_KEY, createAuthStore } from './auth-store';
import { DEMO_ACCOUNTS } from './demo-accounts';

const base = 'http://127.0.0.1:3897/api';
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
};
let now = Date.parse('2026-10-16T12:00:00Z');
const store = createAuthStore(storage, () => now, true);
const server = setupServer(...createAuthHandlers(store, base));
const auth = new HttpAuthRepository(new AxiosAdapter(base));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  now = Date.parse('2026-10-16T12:00:00Z');
  data.clear();
  store.reset();
});

it('permite entrar nas duas contas preexistentes pela API sem persistir senha em claro', async () => {
  for (const account of DEMO_ACCOUNTS) {
    const session = await auth.login({ email: account.email, password: 'Kurio123!' });
    expect(session.user).toEqual({
      id: account.id,
      username: account.username,
      email: account.email,
    });
    await auth.logout();
  }
  expect(storage.getItem(AUTH_STORAGE_KEY)).not.toContain('Kurio123!');
  expect(store.read().accounts).toHaveLength(2);
});
it('não recria contas expiradas no refresh e o reset restaura as fixtures', () => {
  now += ACCOUNT_LIFETIME_MS;
  expect(store.read().accounts).toHaveLength(0);
  expect(createAuthStore(storage, () => now, true).read().accounts).toHaveLength(0);
  store.reset();
  expect(store.read().accounts.map((account) => account.user.id)).toEqual(
    DEMO_ACCOUNTS.map((account) => account.id)
  );
});
it('migra o armazenamento anterior preservando usuários e perfil e invalidando a sessão antiga', async () => {
  data.clear();
  const legacy = createAuthStore(storage, () => now);
  const state = legacy.read();
  state.accounts.push({
    user: {
      id: '33333333-3333-4333-8333-333333333333',
      username: 'Existente',
      email: 'existente@example.com',
    },
    activity: [],
    wallets: { primary: null, secondary: null, secondarySameAsPrimary: false },
    profile: {
      displayName: 'Meu nome',
      ensName: '',
      walletAlias: 'Principal',
      avatarDataUrl: null,
    },
    salt: DEMO_ACCOUNTS[0].salt,
    passwordHash: DEMO_ACCOUNTS[0].passwordHash,
    expiresAt: now + ACCOUNT_LIFETIME_MS,
  });
  state.session = { userId: state.accounts[0].user.id, expiresAt: now + 100_000 };
  legacy.write(state);
  const previous = {
    ...JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? '{}'),
    session: state.session,
  };
  delete previous.schemaVersion;
  delete previous.sessionEpoch;
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(previous));
  const restored = createAuthStore(storage, () => now, true).read();
  expect(restored.accounts).toHaveLength(3);
  expect(restored.accounts[0].profile.displayName).toBe('Meu nome');
  expect(restored.session).toBeNull();
  expect(JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? '{}')).not.toHaveProperty('session');
});
