import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { requireCollectorSession } from '@/features/auth/auth-route.guard';
import { rootRoute } from './root';

export const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: () => requireCollectorSession('/wallets'),
  component: lazyRouteComponent(
    () => import('@/features/wallets/components/wallets-view'),
    'WalletsView'
  ),
});
