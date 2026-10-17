import { HttpResponse, http } from 'msw';
import { updateProfileSchema } from '@/features/profile/data/schemas/profile.schema';
import type { CollectorProfile } from '@/features/profile/domain/entities/collector-profile.entity';
import { type AuthStore, hashMockPassword, toHex } from './auth-store';

export function createProfileHandlers(store: AuthStore, apiBase: string) {
  const error = (status: number, code: string, message: string) =>
    HttpResponse.json({ code, message }, { status });
  const unauthorized = () =>
    error(401, 'SESSION_REQUIRED', 'Entre na sua conta para acessar o perfil.');
  const unavailable = () =>
    error(
      503,
      'PROFILE_UNAVAILABLE',
      'Não foi possível consultar ou salvar seu perfil. Tente novamente.'
    );
  const serialize = (
    account: ReturnType<AuthStore['read']>['accounts'][number]
  ): CollectorProfile => ({
    ...account.profile,
    ...account.user,
    displayName: account.profile.displayName || account.user.username,
  });

  return [
    http.get(`${apiBase}/profile`, () => {
      try {
        const state = store.read();
        const account = state.accounts.find((item) => item.user.id === state.session?.userId);
        return account ? HttpResponse.json(serialize(account)) : unauthorized();
      } catch {
        return unavailable();
      }
    }),
    http.patch(`${apiBase}/profile`, async ({ request }) => {
      try {
        const initial = store.read();
        const original = initial.accounts.find((item) => item.user.id === initial.session?.userId);
        if (!original) return unauthorized();
        const parsed = updateProfileSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return error(
            422,
            'VALIDATION_ERROR',
            parsed.error.issues[0]?.message ?? 'Dados inválidos.'
          );
        const input = parsed.data;
        let credentials: { salt: string; passwordHash: string } | undefined;
        if (input.passwordChange) {
          if (
            (await hashMockPassword(input.passwordChange.currentPassword, original.salt)) !==
            original.passwordHash
          )
            return error(422, 'CURRENT_PASSWORD_INVALID', 'A senha atual está incorreta.');
          const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
          credentials = {
            salt,
            passwordHash: await hashMockPassword(input.passwordChange.newPassword, salt),
          };
        }
        const state = store.read();
        if (state.session?.userId !== original.user.id) return unauthorized();
        const account = state.accounts.find((item) => item.user.id === original.user.id);
        if (!account) return unauthorized();
        if (credentials && account.passwordHash !== original.passwordHash)
          return error(
            409,
            'PROFILE_CONFLICT',
            'Sua senha foi alterada em outra sessão. Tente novamente.'
          );
        const email = input.email.toLowerCase();
        if (
          state.accounts.some(
            (item) => item.user.id !== account.user.id && item.user.email === email
          )
        )
          return error(409, 'EMAIL_IN_USE', 'Já existe uma conta com este e-mail.');
        if (
          state.accounts.some(
            (item) =>
              item.user.id !== account.user.id &&
              item.user.username.toLowerCase() === input.username.toLowerCase()
          )
        )
          return error(409, 'USERNAME_IN_USE', 'Este nome de usuário já está em uso.');
        account.user = { ...account.user, username: input.username, email };
        account.profile = {
          displayName: input.displayName,
          ensName: input.ensName,
          walletAlias: input.walletAlias,
          avatarDataUrl: input.avatarDataUrl,
        };
        if (credentials) Object.assign(account, credentials);
        store.write(state);
        return HttpResponse.json(serialize(account));
      } catch {
        return unavailable();
      }
    }),
  ];
}
