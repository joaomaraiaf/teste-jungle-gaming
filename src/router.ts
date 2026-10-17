import { createRouter } from '@tanstack/react-router';
import { indexRoute } from '@/routes';
import { activityRoute } from '@/routes/activity';
import { cartRoute } from '@/routes/cart';
import { nftDetailsRoute } from '@/routes/market.$nftId';
import { paymentRoute } from '@/routes/payment';
import { paymentConfirmationRoute } from '@/routes/payment-confirmation';
import { profileRoute } from '@/routes/profile';
import { rootRoute } from '@/routes/root';
import { walletsRoute } from '@/routes/wallets';

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailsRoute,
  cartRoute,
  paymentRoute,
  paymentConfirmationRoute,
  profileRoute,
  walletsRoute,
  activityRoute,
]);
export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
