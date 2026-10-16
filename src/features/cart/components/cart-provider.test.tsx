import { AxiosAdapter } from '@/core/api/axios-adapter';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/hooks/use-session-view-model.hook';
import { createAuthStore } from '@/mocks/auth-store';
import { createCommerceHandlers } from '@/mocks/commerce-handlers';
import { createCommerceStore } from '@/mocks/commerce-store';
import { createMockStore } from '@/mocks/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { HttpCartRepository } from '../data/repositories/http-cart.repository.impl';
import { CartUseCase } from '../domain/usecases/cart.usecase';
import { useCart } from '../hooks/use-cart.hook';
import { CartProvider } from './cart-provider';
const base = 'http://localhost:3891/api';
const { authState } = vi.hoisted(() => ({
  authState: {
    session: null as { user: { id: string } } | null,
    isLoading: false,
    refreshSession: vi.fn(),
  },
}));
vi.mock('@/features/auth/hooks/use-auth-session.hook', () => ({ useAuthSession: () => authState }));
vi.mock('../cart.dependencies', () => ({
  createCartUseCase: (guest: string, owner: string | null) =>
    new CartUseCase(new HttpCartRepository(new AxiosAdapter(base), guest, owner)),
}));
const auth = createAuthStore(undefined, Date.now, true);
const commerce = createCommerceStore(auth);
const catalog = createMockStore();
const server = setupServer(...createCommerceHandlers(auth, catalog, commerce, base));
const alice = '11111111-1111-4111-8111-111111111111';
function Harness() {
  const cart = useCart();
  const nft = catalog.read().nfts[0];
  const edition = nft.editions.find((item) => item.available >= 2)!;
  return (
    <>
      <output aria-label='Quantidade'>{cart.totalQuantity}</output>
      <button
        type='button'
        disabled={cart.isLoading || cart.isPending}
        onClick={() =>
          void cart.addItem({
            nftId: nft.id,
            editionId: edition.id,
            quantity: 1,
            name: 'Nome do cliente ignorado',
            imageUrl: null,
            collection: '',
            tokenId: '',
            editionName: '',
            unitPriceEth: '0.01',
            available: 999,
          })
        }
      >
        Adicionar
      </button>
      <button type='button' onClick={() => void cart.applyCoupon('KURIO10')}>
        Cupom
      </button>
      <output aria-label='Cupom'>{cart.couponCode}</output>
    </>
  );
}
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  auth.reset();
  authState.session = null;
  window.sessionStorage.clear();
});
it('aguarda REST, persiste visitante após remontagem e incorpora uma única vez ao autenticar', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(AUTH_SESSION_QUERY_KEY, null);
  const tree = () => (
    <QueryClientProvider client={client}>
      <CartProvider>
        <Harness />
      </CartProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  await waitFor(() => expect(screen.getByText('Adicionar')).toBeEnabled());
  fireEvent.click(screen.getByText('Adicionar'));
  await waitFor(() => expect(screen.getByLabelText('Quantidade')).toHaveTextContent('1'));
  fireEvent.click(screen.getByText('Cupom'));
  await waitFor(() => expect(screen.getByLabelText('Cupom')).toHaveTextContent('KURIO10'));
  view.unmount();
  client.clear();
  client.setQueryData(AUTH_SESSION_QUERY_KEY, null);
  const restored = render(tree());
  await waitFor(() => expect(screen.getByLabelText('Quantidade')).toHaveTextContent('1'));
  const state = auth.read();
  state.session = { userId: alice, expiresAt: Date.now() + 100000 };
  auth.write(state);
  authState.session = { user: { id: alice } };
  client.setQueryData(AUTH_SESSION_QUERY_KEY, authState.session);
  restored.rerender(tree());
  await waitFor(() => expect(commerce.read().carts[alice]?.items[0]?.quantity).toBe(1));
  await waitFor(() => expect(screen.getByLabelText('Cupom')).toHaveTextContent('KURIO10'));
  await client.invalidateQueries({ queryKey: ['cart', alice] });
  expect(commerce.read().carts[alice].items[0].quantity).toBe(1);
  const logged = auth.read();
  logged.session = null;
  auth.write(logged);
  authState.session = null;
  client.setQueryData(AUTH_SESSION_QUERY_KEY, null);
  restored.rerender(tree());
  await waitFor(() => expect(screen.getByLabelText('Quantidade')).toHaveTextContent('0'));
  expect(commerce.read().carts[alice].items[0].quantity).toBe(1);
});
