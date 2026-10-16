import { environment } from '@/core/config/environment';
import { QueryProvider } from '@/core/providers/query-provider';
import { RealtimeProvider } from '@/core/providers/realtime-provider';
import { router } from '@/router';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export function renderApplication() {
  const element = document.getElementById('root');
  if (!element) throw new Error('Elemento raiz não encontrado.');
  createRoot(element).render(
    <StrictMode>
      <QueryProvider>
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
