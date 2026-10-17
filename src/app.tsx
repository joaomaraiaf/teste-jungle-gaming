import type { QueryClient } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { environment } from '@/core/config/environment';
import { QueryProvider } from '@/core/providers/query-provider';
import { RealtimeProvider } from '@/core/providers/realtime-provider';
import { router } from '@/router';

function StartTransport({ start }: { start: () => void }) {
  useEffect(start, [start]);
  return null;
}

export function Application({
  startTransport,
  client,
}: {
  startTransport?: () => void;
  client?: QueryClient;
}) {
  return (
    <StrictMode>
      {startTransport && <StartTransport start={startTransport} />}
      <QueryProvider client={client}>
        <RealtimeProvider
          url={
            environment.mocksEnabled || import.meta.env.VITE_SOCKET_URL
              ? environment.socketUrl
              : undefined
          }
        >
          <RouterProvider router={router} />
        </RealtimeProvider>
      </QueryProvider>
    </StrictMode>
  );
}

export async function renderApplication(startTransport: () => void) {
  const element = document.getElementById('root');
  if (!element) throw new Error('Elemento raiz não encontrado.');
  const application = <Application startTransport={startTransport} />;
  if (element.dataset.prerendered === 'true') {
    router.ssr = { manifest: undefined };
    await router.load();
    hydrateRoot(element, application);
  } else createRoot(element).render(application);
}
