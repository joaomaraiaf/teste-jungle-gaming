import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { requireCollectorSession } from '@/features/auth/auth-route.guard';
import { rootRoute } from './root';

export const paymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment',
  beforeLoad: () => requireCollectorSession('/payment'),
  component: lazyRouteComponent(
    () => import('@/features/payment/components/payment-view'),
    'PaymentView'
  ),
});
