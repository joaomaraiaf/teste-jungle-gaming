import { setupWorker } from 'msw/browser';
import { environment } from '@/core/config/environment';
import { createMockEnvironment } from './environment';

const mocks = createMockEnvironment({
  origin: window.location.origin,
  apiUrl: environment.apiUrl,
  socketUrl: environment.socketUrl,
  storage: window.localStorage,
  sessionStorage: window.sessionStorage,
  seedDemoAccounts: true,
});
const disposeOnPageHide = () => mocks.dispose();
const reloadOnRestore = (event: PageTransitionEvent) => {
  if (event.persisted) window.location.reload();
};
window.addEventListener('pagehide', disposeOnPageHide, { once: true });
window.addEventListener('pageshow', reloadOnRestore);
export const worker = setupWorker(...mocks.handlers);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('pagehide', disposeOnPageHide);
    window.removeEventListener('pageshow', reloadOnRestore);
    mocks.dispose();
    worker.stop();
  });
}
