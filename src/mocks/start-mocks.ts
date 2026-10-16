import { environment } from '@/core/config/environment';

export async function startMocks() {
  if (!environment.mocksEnabled) return;
  const { worker } = await import('./browser');
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
    onUnhandledRequest(request, print) {
      const apiBase = new URL(environment.apiUrl, window.location.origin);
      const url = new URL(request.url);
      if (
        url.origin === apiBase.origin &&
        (url.pathname === apiBase.pathname ||
          url.pathname.startsWith(`${apiBase.pathname.replace(/\/$/, '')}/`))
      ) {
        print.error();
      }
    },
  });
}
