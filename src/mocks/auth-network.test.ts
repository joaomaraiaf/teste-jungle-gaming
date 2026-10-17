// @vitest-environment node
import { AxiosAdapter } from '@/core/api/axios-adapter';
import { HttpAuthRepository } from '@/features/auth/data/repositories/http-auth.repository.impl';
import { HttpProfileRepository } from '@/features/profile/data/repositories/http-profile.repository.impl';
import { HttpWalletsRepository } from '@/features/wallets/data/repositories/http-wallets.repository.impl';
import type { SavedWallet } from '@/features/wallets/domain/entities/saved-wallet.entity';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAuthHandlers } from './auth-handlers';
import {
  ACCOUNT_LIFETIME_MS,
  AUTH_STORAGE_KEY,
  SESSION_LIFETIME_MS,
  createAuthStore,
} from './auth-store';
import { createProfileHandlers } from './profile-handlers';
import { createWalletsHandlers } from './wallets-handlers';

const apiBase = 'http://127.0.0.1:3899/api';
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
let now = Date.parse('2026-10-16T12:00:00Z');
const store = createAuthStore(storage, () => now, false, tabStorage);
const server = setupServer(
  ...createAuthHandlers(store, apiBase),
  ...createProfileHandlers(store, apiBase),
  ...createWalletsHandlers(store, apiBase)
);
const http = new AxiosAdapter(apiBase);
const repository = new HttpAuthRepository(http);
const profiles = new HttpProfileRepository(http);
const wallets = new HttpWalletsRepository(http);
const account = { username: 'Colecionador', email: 'demo@example.com', password: 'Teste123!' };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  now = Date.parse('2026-10-16T12:00:00Z');
  data.clear();
  tabData.clear();
  store.reset();
});

describe('autenticação simulada via Axios → MSW', () => {
  it('cadastra, inicia a sessão e persiste somente hash com salt', async () => {
    const session = await repository.signup(account);
    expect(session.user).toMatchObject({ username: account.username, email: account.email });
    expect(await repository.getSession()).toEqual(session);
    const raw = storage.getItem(AUTH_STORAGE_KEY) ?? '';
    expect(raw).not.toContain(account.password);
    expect(JSON.parse(raw)).not.toHaveProperty('session');
    const restored = createAuthStore(storage, () => now, false, tabStorage).read();
    expect(restored.accounts[0].passwordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(restored.accounts[0].salt).toMatch(/^[a-f0-9]{32}$/);
    expect(restored.session?.userId).toBe(session.user.id);
    expect(session.user).not.toHaveProperty('passwordHash');
  });

  it('faz logout sem apagar a conta, rejeita senha errada e permite novo login', async () => {
    const first = await repository.signup(account);
    await repository.logout();
    expect(await repository.getSession()).toBeNull();
    await expect(
      repository.login({ email: account.email, password: 'Errada123!' })
    ).rejects.toMatchObject({ status: 401, message: 'E-mail ou senha incorretos.' });
    expect(await repository.getSession()).toBeNull();
    const next = await repository.login({ email: 'DEMO@EXAMPLE.COM', password: account.password });
    expect(next.user.id).toBe(first.user.id);
  });

  it('rejeita e-mail e nome de usuário duplicados sem criar sessões', async () => {
    await repository.signup(account);
    await repository.logout();
    await expect(
      repository.signup({ ...account, email: 'DEMO@EXAMPLE.COM', username: 'Outro' })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      repository.signup({ ...account, email: 'outro@example.com', username: 'colecionador' })
    ).rejects.toMatchObject({ status: 409 });
    expect(store.read().accounts).toHaveLength(1);
    expect(await repository.getSession()).toBeNull();
  });

  it('expira a sessão em 24 horas e a conta em 7 dias', async () => {
    await repository.signup(account);
    now += SESSION_LIFETIME_MS;
    expect(await repository.getSession()).toBeNull();
    expect((await repository.login(account)).user.email).toBe(account.email);
    now += ACCOUNT_LIFETIME_MS;
    expect(await repository.getSession()).toBeNull();
    await expect(repository.login(account)).rejects.toMatchObject({ status: 401 });
    expect(store.read().accounts).toHaveLength(0);
  });

  it('impede cadastro duplicado concorrente e rejeita entradas inválidas', async () => {
    const results = await Promise.allSettled([
      repository.signup(account),
      repository.signup(account),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(store.read().accounts).toHaveLength(1);
    await expect(
      http.post('/auth/signup', { username: 'x', email: 'inválido', password: '123' })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('recupera armazenamento corrompido e retorna erro ao falhar a persistência', async () => {
    storage.setItem(AUTH_STORAGE_KEY, 'inválido');
    expect(await repository.getSession()).toBeNull();
    const unavailable = createAuthStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('storage unavailable');
      },
    });
    server.use(...createAuthHandlers(unavailable, apiBase));
    await expect(repository.signup(account)).rejects.toMatchObject({ status: 503 });
    server.resetHandlers();
    expect(await repository.getSession()).toBeNull();
  });
});

describe('perfil privado via Axios → MSW', () => {
  const details = {
    displayName: 'Minha coleção',
    username: 'NovoNome',
    email: 'novo@example.com',
    ensName: 'minha-colecao',
    walletAlias: 'Carteira principal',
    avatarDataUrl: null,
  };

  it('protege o perfil, salva os dados e atualiza as credenciais de acesso', async () => {
    await expect(profiles.getProfile()).rejects.toMatchObject({ status: 401 });
    await expect(profiles.updateProfile(details)).rejects.toMatchObject({ status: 401 });
    const session = await repository.signup(account);
    expect(await profiles.getProfile()).toMatchObject({
      id: session.user.id,
      displayName: account.username,
      email: account.email,
    });
    const updated = await profiles.updateProfile(details);
    expect(updated).toMatchObject(details);
    expect(await profiles.getProfile()).toEqual(updated);
    expect((await repository.getSession())?.user.email).toBe(details.email);
    await repository.logout();
    await expect(repository.login(account)).rejects.toMatchObject({ status: 401 });
    expect(
      (await repository.login({ email: details.email, password: account.password })).user.id
    ).toBe(session.user.id);
  });

  it('valida a senha atual e troca a senha sem persistir as senhas originais', async () => {
    await repository.signup(account);
    await expect(
      profiles.updateProfile({
        ...details,
        passwordChange: { currentPassword: 'Errada123!', newPassword: 'Nova123!' },
      })
    ).rejects.toMatchObject({ status: 422 });
    expect((await profiles.getProfile()).email).toBe(account.email);
    await profiles.updateProfile({
      ...details,
      passwordChange: { currentPassword: account.password, newPassword: 'Nova123!' },
    });
    const raw = storage.getItem(AUTH_STORAGE_KEY) ?? '';
    expect(raw).not.toContain('Nova123!');
    expect(raw).not.toContain(account.password);
    expect(JSON.parse(raw)).not.toHaveProperty('session');
    await repository.logout();
    await expect(
      repository.login({ email: details.email, password: account.password })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      repository.login({ email: details.email, password: 'Nova123!' })
    ).resolves.toMatchObject({ user: { username: details.username } });
  });

  it('isola contas, rejeita duplicidade e preserva contas persistidas antes do perfil', async () => {
    const first = await repository.signup(account);
    await profiles.updateProfile({ ...details, username: account.username, email: account.email });
    await repository.logout();
    const second = await repository.signup({
      ...account,
      username: 'Segundo',
      email: 'segundo@example.com',
    });
    expect((await profiles.getProfile()).id).toBe(second.user.id);
    await expect(
      profiles.updateProfile({ ...details, email: account.email })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      profiles.updateProfile({ ...details, username: account.username })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      http.patch('/profile', { ...details, avatarDataUrl: 'data:image/svg+xml;base64,abc' })
    ).rejects.toMatchObject({ status: 422 });
    const persisted = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? '{}');
    for (const entry of persisted.accounts) delete entry.profile;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persisted));
    expect((await repository.getSession())?.user.id).toBe(second.user.id);
    expect((await profiles.getProfile()).displayName).toBe('Segundo');
    await repository.logout();
    expect((await repository.login(account)).user.id).toBe(first.user.id);
  });
});

describe('carteiras privadas via Axios → MSW', () => {
  const primary: SavedWallet = {
    displayName: 'Colecionador',
    walletAlias: 'Principal',
    network: 'ethereum',
    profileName: 'Minha coleção',
    walletAddress: `0x${'a'.repeat(40)}`,
    secondaryWallet: '',
    walletType: 'metamask',
    referralCode: '',
    email: 'demo@example.com',
    ensName: 'colecionador',
  };
  const secondary: SavedWallet = {
    ...primary,
    walletAlias: 'Reserva',
    network: 'polygon',
    walletAddress: `0x${'b'.repeat(40)}`,
  };

  it('exige sessão e carteira principal, valida o endereço e persiste as carteiras', async () => {
    await expect(wallets.getWallets()).rejects.toMatchObject({ status: 401 });
    await expect(wallets.saveWallet('primary', primary)).rejects.toMatchObject({ status: 401 });
    await repository.signup(account);
    await expect(wallets.saveWallet('secondary', secondary)).rejects.toMatchObject({ status: 409 });
    await expect(wallets.linkSecondary(true)).rejects.toMatchObject({ status: 409 });
    await expect(
      wallets.saveWallet('primary', { ...primary, walletAddress: '0x123' })
    ).rejects.toMatchObject({ status: 422 });
    await wallets.saveWallet('primary', primary);
    await wallets.saveWallet('secondary', secondary);
    expect(await wallets.getWallets()).toEqual({
      primary,
      secondary,
      secondarySameAsPrimary: false,
    });
    expect(createAuthStore(storage, () => now).read().accounts[0].wallets).toEqual({
      primary,
      secondary,
      secondarySameAsPrimary: false,
    });
    await repository.logout();
    await repository.login(account);
    expect((await wallets.getWallets()).primary).toEqual(primary);
  });

  it('vincula a secundária à principal, acompanha alterações e restaura a secundária anterior', async () => {
    await repository.signup(account);
    await wallets.saveWallet('primary', primary);
    await wallets.saveWallet('secondary', secondary);
    expect((await wallets.linkSecondary(true)).secondary).toEqual(primary);
    const changed = { ...primary, walletAlias: 'Nova principal' };
    expect((await wallets.saveWallet('primary', changed)).secondary).toEqual(changed);
    expect((await wallets.linkSecondary(false)).secondary).toEqual(secondary);
  });

  it('isola carteiras por conta, suporta Solana e migra contas antigas sem apagar o login', async () => {
    await repository.signup(account);
    await wallets.saveWallet('primary', primary);
    await repository.logout();
    await repository.signup({ ...account, username: 'Outro', email: 'outro@example.com' });
    expect(await wallets.getWallets()).toEqual({
      primary: null,
      secondary: null,
      secondarySameAsPrimary: false,
    });
    await expect(
      wallets.saveWallet('primary', { ...primary, network: 'solana' })
    ).rejects.toMatchObject({ status: 422 });
    await wallets.saveWallet('primary', {
      ...primary,
      network: 'solana',
      walletAddress: '1'.repeat(32),
    });
    await repository.logout();
    await repository.login(account);
    expect((await wallets.getWallets()).primary?.network).toBe('ethereum');
    const state = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? '{}');
    for (const entry of state.accounts) delete entry.wallets;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    expect((await repository.getSession())?.user.email).toBe(account.email);
    expect((await wallets.getWallets()).primary).toBeNull();
  });
});
