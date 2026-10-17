import { setTransportReady } from '@/core/api/transport-ready';
import { canUsePublicSnapshot } from '@/mocks/can-use-public-snapshot';
import { startMocks } from '@/mocks/start-mocks';
import '@/styles/globals.css';
import '@fontsource/roboto-mono/latin-400.css';
import '@fontsource/roboto-mono/latin-500.css';
import '@fontsource/roboto-mono/latin-600.css';
import '@fontsource/roboto-mono/latin-700.css';

// Paint the public shell while MSW starts; REST and Socket.IO wait at their transport boundaries.
const useSnapshot = canUsePublicSnapshot();
let startTransport!: () => void;
const transportReady = new Promise<void>((resolve, reject) => {
  let started = false;
  startTransport = () => {
    if (started) return;
    started = true;
    void startMocks().then(() => {
      document.documentElement.dataset.transportReady = 'true';
      resolve();
      void import('./prefetch-initial-route').then(({ prefetchInitialRoute }) =>
        prefetchInitialRoute(new URL(location.href))
      );
    }, reject);
  };
});
setTransportReady(transportReady);
void transportReady.catch(() => {
  const element = document.getElementById('root');
  if (element) element.textContent = 'Não foi possível iniciar a aplicação. Recarregue a página.';
});
const dataReady = import('./prefetch-initial-route').then(({ prefetchInitialRoute }) =>
  prefetchInitialRoute(
    new URL(location.href),
    useSnapshot,
    document.getElementById('root')?.dataset.prerendered !== 'true'
  )
);
const routeReady =
  location.pathname === '/'
    ? import('@/features/catalog/components/catalog-view')
    : location.pathname.startsWith('/market/')
      ? import('@/features/market/components/nft-details-view')
      : Promise.resolve();
Promise.all([import('./app'), routeReady, dataReady])
  .then(([app]) => app.renderApplication(startTransport))
  .catch(() => {
    const element = document.getElementById('root');
    if (element)
      element.textContent =
        'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.';
  });
