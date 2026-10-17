import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { requireCollectorSession } from '@/features/auth/auth-route.guard';
import { rootRoute } from './root';

export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: () => requireCollectorSession('/profile'),
  component: lazyRouteComponent(
    () => import('@/features/profile/components/profile-view'),
    'ProfileView'
  ),
});
