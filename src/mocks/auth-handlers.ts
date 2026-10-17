import { HttpResponse, http } from 'msw';
import { loginFormSchema } from '@/features/auth/data/schemas/login-form.schema';
import { signupInputSchema } from '@/features/auth/data/schemas/signup-form.schema';
import type { AuthSession } from '@/features/auth/domain/entities/auth-session.entity';
import {
  ACCOUNT_LIFETIME_MS,
  type AuthStore,
  hashMockPassword,
  SESSION_LIFETIME_MS,
  toHex,
} from './auth-store';

export function createAuthHandlers(store: AuthStore, apiBase: string) {
  const error = (status: number, code: string, message: string) =>
    HttpResponse.json({ code, message }, { status });
  const unavailable = () =>
    error(
      503,
      'AUTH_UNAVAILABLE',
      'Não foi possível salvar ou consultar a conta neste navegador. Tente novamente.'
    );
  const openSession = (account: ReturnType<AuthStore['read']>['accounts'][number]) => {
    const state = store.read();
    const expiresAt = Math.min(store.now() + SESSION_LIFETIME_MS, account.expiresAt);
    state.session = { userId: account.user.id, expiresAt };
    store.write(state);
    return HttpResponse.json<AuthSession>({
      user: account.user,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  };
  return [
    http.post(`${apiBase}/__mock/auth/expire-session`, () => {
      try {
        const state = store.read();
        if (state.session) {
          state.session.expiresAt = store.now() - 1;
          store.write(state);
        }
        return new HttpResponse(null, { status: 204 });
      } catch {
        return unavailable();
      }
    }),
    http.get(`${apiBase}/auth/session`, () => {
      try {
        const state = store.read();
        const account = state.accounts.find((item) => item.user.id === state.session?.userId);
        return HttpResponse.json<AuthSession | null>(
          account && state.session
            ? { user: account.user, expiresAt: new Date(state.session.expiresAt).toISOString() }
            : null
        );
      } catch {
        return unavailable();
      }
    }),
    http.post(`${apiBase}/auth/signup`, async ({ request }) => {
      const parsed = signupInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success)
        return error(
          422,
          'VALIDATION_ERROR',
          parsed.error.issues[0]?.message ?? 'Dados inválidos.'
        );
      try {
        const email = parsed.data.email.trim().toLowerCase();
        const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
        const passwordHash = await hashMockPassword(parsed.data.password, salt);
        const state = store.read();
        if (state.accounts.some((item) => item.user.email === email))
          return error(409, 'EMAIL_IN_USE', 'Já existe uma conta com este e-mail.');
        if (
          state.accounts.some(
            (item) => item.user.username.toLowerCase() === parsed.data.username.toLowerCase()
          )
        )
          return error(409, 'USERNAME_IN_USE', 'Este nome de usuário já está em uso.');
        const account = {
          activity: [],
          user: { id: crypto.randomUUID(), username: parsed.data.username, email },
          wallets: { primary: null, secondary: null, secondarySameAsPrimary: false },
          profile: {
            displayName: parsed.data.username,
            ensName: '',
            walletAlias: '',
            avatarDataUrl: null,
          },
          salt,
          passwordHash,
          expiresAt: store.now() + ACCOUNT_LIFETIME_MS,
        };
        state.accounts.push(account);
        store.write(state);
        return openSession(account);
      } catch {
        return unavailable();
      }
    }),
    http.post(`${apiBase}/auth/login`, async ({ request }) => {
      const parsed = loginFormSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return error(422, 'VALIDATION_ERROR', 'Informe e-mail e senha válidos.');
      try {
        const account = store
          .read()
          .accounts.find((item) => item.user.email === parsed.data.email.trim().toLowerCase());
        if (
          !account ||
          (await hashMockPassword(parsed.data.password, account.salt)) !== account.passwordHash
        )
          return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
        // Recheck after hashing in case the account expired during the request.
        if (!store.read().accounts.some((item) => item.user.id === account.user.id))
          return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
        return openSession(account);
      } catch {
        return unavailable();
      }
    }),
    http.post(`${apiBase}/auth/logout`, () => {
      try {
        const state = store.read();
        state.session = null;
        store.write(state);
        return new HttpResponse(null, { status: 204 });
      } catch {
        return unavailable();
      }
    }),
  ];
}
