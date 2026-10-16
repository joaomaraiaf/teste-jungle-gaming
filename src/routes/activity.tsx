import { requireCollectorSession } from '@/features/auth/auth-route.guard';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root';

export const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  beforeLoad: () => requireCollectorSession('/activity'),
  component: lazyRouteComponent(
    () => import('@/features/activity/components/activity-view'),
    'ActivityView'
  ),
});
