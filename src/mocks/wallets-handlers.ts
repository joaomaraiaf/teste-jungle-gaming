import { HttpResponse, http } from 'msw';
import { z } from 'zod';
import { savedWalletSchema } from '@/features/wallets/data/schemas/wallet.schema';
import type { SavedWallets } from '@/features/wallets/domain/entities/saved-wallet.entity';
import type { AuthStore } from './auth-store';

export function createWalletsHandlers(store: AuthStore, apiBase: string) {
  const error = (status: number, code: string, message: string) =>
    HttpResponse.json({ code, message }, { status });
  const unauthorized = () =>
    error(401, 'SESSION_REQUIRED', 'Entre na sua conta para acessar as carteiras.');
  const unavailable = () =>
    error(
      503,
      'WALLETS_UNAVAILABLE',
      'Não foi possível consultar ou salvar suas carteiras. Tente novamente.'
    );
  const serialize = (wallets: SavedWallets): SavedWallets => ({
    ...wallets,
    secondary: wallets.secondarySameAsPrimary ? wallets.primary : wallets.secondary,
  });

  return [
    http.get(`${apiBase}/wallets`, () => {
      try {
        const state = store.read();
        const account = state.accounts.find((item) => item.user.id === state.session?.userId);
        return account ? HttpResponse.json(serialize(account.wallets)) : unauthorized();
      } catch {
        return unavailable();
      }
    }),
    http.put(`${apiBase}/wallets/:slot`, async ({ request, params }) => {
      try {
        const userId = store.read().session?.userId;
        if (!userId) return unauthorized();
        const parsed = savedWalletSchema.safeParse(await request.json().catch(() => null));
        const state = store.read();
        if (state.session?.userId !== userId) return unauthorized();
        const account = state.accounts.find((item) => item.user.id === state.session?.userId);
        if (!account) return unauthorized();
        if (params.slot !== 'primary' && params.slot !== 'secondary')
          return error(404, 'WALLET_SLOT_NOT_FOUND', 'Tipo de carteira não encontrado.');
        if (!parsed.success)
          return error(
            422,
            'VALIDATION_ERROR',
            parsed.error.issues[0]?.message ?? 'Dados inválidos.'
          );
        if (params.slot === 'secondary' && !account.wallets.primary)
          return error(409, 'PRIMARY_REQUIRED', 'Salve a carteira principal primeiro.');
        account.wallets[params.slot] = { ...parsed.data, email: parsed.data.email.toLowerCase() };
        if (params.slot === 'secondary') account.wallets.secondarySameAsPrimary = false;
        store.write(state);
        return HttpResponse.json(serialize(account.wallets));
      } catch {
        return unavailable();
      }
    }),
    http.patch(`${apiBase}/wallets/secondary-link`, async ({ request }) => {
      try {
        const userId = store.read().session?.userId;
        if (!userId) return unauthorized();
        const parsed = z
          .object({ sameAsPrimary: z.boolean() })
          .safeParse(await request.json().catch(() => null));
        const state = store.read();
        if (state.session?.userId !== userId) return unauthorized();
        const account = state.accounts.find((item) => item.user.id === state.session?.userId);
        if (!account) return unauthorized();
        if (!parsed.success) return error(422, 'VALIDATION_ERROR', 'Selecione uma opção válida.');
        if (parsed.data.sameAsPrimary && !account.wallets.primary)
          return error(409, 'PRIMARY_REQUIRED', 'Salve a carteira principal primeiro.');
        account.wallets.secondarySameAsPrimary = parsed.data.sameAsPrimary;
        store.write(state);
        return HttpResponse.json(serialize(account.wallets));
      } catch {
        return unavailable();
      }
    }),
  ];
}
