import {
  type PrivateDestination,
  isPrivateDestination,
} from '@/features/auth/private-destinations';
import { catalogQuerySchema } from '@/features/catalog/data/schemas/catalog.schema';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (
    search
  ): ReturnType<typeof catalogQuerySchema.parse> & {
    redirect?: PrivateDestination;
    tab?: 'new';
  } => ({
    ...catalogQuerySchema.parse(search),
    limit: 9,
    tab: search.tab === 'new' && (!search.sort || search.sort === 'newest') ? 'new' : undefined,
    redirect: isPrivateDestination(search.redirect) ? search.redirect : undefined,
  }),
  component: lazyRouteComponent(
    () => import('@/features/catalog/components/catalog-view'),
    'CatalogView'
  ),
});
