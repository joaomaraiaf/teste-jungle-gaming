import { requireCollectorSession } from '@/features/auth/auth-route.guard';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { z } from 'zod';
import { rootRoute } from './root';

export const paymentConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/confirmation',
  validateSearch: z.object({ orderId: z.uuid().optional() }),
  beforeLoad: () => requireCollectorSession('/payment/confirmation'),
  component: lazyRouteComponent(
    () => import('@/features/payment/components/payment-confirmation-view'),
    'PaymentConfirmationView'
  ),
});
