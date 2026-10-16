import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root';

export const nftDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/market/$nftId',
  component: lazyRouteComponent(
    () => import('@/features/market/components/nft-details-view'),
    'NftDetailsView'
  ),
});
