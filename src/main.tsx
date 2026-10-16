import { startMocks } from '@/mocks/start-mocks';
import '@/styles/globals.css';
import '@fontsource/roboto-mono/latin-400.css';
import '@fontsource/roboto-mono/latin-500.css';
import '@fontsource/roboto-mono/latin-600.css';
import '@fontsource/roboto-mono/latin-700.css';

// Download the application and the mock runtime in parallel; render only after interception starts.
const routeReady =
  location.pathname === '/'
    ? import('@/features/catalog/components/catalog-view')
    : location.pathname.startsWith('/market/')
      ? import('@/features/market/components/nft-details-view')
      : Promise.resolve();
Promise.all([startMocks(), import('./app'), routeReady])
  .then(([, app]) => app.renderApplication())
  .catch(() => {
    const element = document.getElementById('root');
    if (element)
      element.textContent =
        'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.';
  });
