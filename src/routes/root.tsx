import { NotFoundPage } from '@/core/components/not-found-page';
import { AuthSessionProvider } from '@/features/auth/components/auth-session-provider';
import { LoginDialogProvider } from '@/features/auth/components/login-dialog-provider';
import { PrivateSessionGate } from '@/features/auth/components/private-session-gate';
import { CartProvider } from '@/features/cart/components/cart-provider';
import { MarketplaceRealtimeSync } from '@/features/market/components/marketplace-realtime-sync';
import { PaymentReceiptProvider } from '@/features/payment/components/payment-receipt-provider';
import { Outlet, createRootRoute } from '@tanstack/react-router';

export const rootRoute = createRootRoute({
  component: () => (
    <PaymentReceiptProvider>
      <AuthSessionProvider>
        <CartProvider>
          <MarketplaceRealtimeSync />
          <LoginDialogProvider>
            <PrivateSessionGate>
              <Outlet />
            </PrivateSessionGate>
          </LoginDialogProvider>
        </CartProvider>
      </AuthSessionProvider>
    </PaymentReceiptProvider>
  ),
  notFoundComponent: NotFoundPage,
});
