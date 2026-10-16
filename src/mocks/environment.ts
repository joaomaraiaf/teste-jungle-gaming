import { createAuthHandlers } from './auth-handlers';
import { createAuthStore } from './auth-store';
import { createCheckoutHandlers } from './checkout-handlers';
import { createCommerceBroadcast } from './commerce-broadcast';
import { createCommerceHandlers } from './commerce-handlers';
import { createCommerceStore } from './commerce-store';
import { createHttpHandlers } from './http-handlers';
import { createNetworkControls } from './network-controls';
import { createProfileHandlers } from './profile-handlers';
import { createSocketHandlers } from './socket-handlers';
import { createMockStore } from './store';
import { createWalletsHandlers } from './wallets-handlers';

export function createMockEnvironment(options: {
  origin: string;
  apiUrl?: string;
  socketUrl?: string;
  seedDemoAccounts?: boolean;
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'>;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}) {
  const store = createMockStore(options.storage);
  const authStore = createAuthStore(
    options.storage,
    Date.now,
    options.seedDemoAccounts,
    options.sessionStorage
  );
  const commerceStore = createCommerceStore(authStore, options.storage);
  const sockets = createSocketHandlers(
    options.socketUrl ?? options.origin,
    () => authStore.read().session?.userId ?? null
  );
  const bridge = createCommerceBroadcast(
    commerceStore,
    sockets,
    options.storage && typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('kurio:commerce:v1')
      : undefined
  );
  const apiBase = new URL(options.apiUrl ?? '/api', options.origin).href.replace(/\/$/, '');
  const network = createNetworkControls(apiBase, options.sessionStorage);
  return {
    store,
    authStore,
    commerceStore,
    handlers: [
      ...network.handlers,
      ...createHttpHandlers(store, apiBase, sockets, () => {
        network.reset();
        authStore.reset();
        const fresh = commerceStore.read();
        fresh.catalog = store.read().nfts;
        commerceStore.write(fresh);
      }),
      ...createAuthHandlers(authStore, apiBase),
      ...createCommerceHandlers(authStore, store, commerceStore, apiBase),
      ...createCheckoutHandlers(authStore, store, commerceStore, apiBase, sockets),
      ...createProfileHandlers(authStore, apiBase),
      ...createWalletsHandlers(authStore, apiBase),
      ...sockets.handlers,
    ],
    disconnect: sockets.disconnect,
    dispose: () => {
      bridge.dispose();
      sockets.disconnect();
    },
  };
}
