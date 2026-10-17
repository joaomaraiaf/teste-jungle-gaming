import type { ReactNode } from 'react';
import { useState } from 'react';
import { MarketplaceHeader } from '@/core/components/layout/marketplace-header';
import { MarketplacePageContainer } from '@/core/components/layout/marketplace-page-container';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session.hook';
import { useLoginDialog } from '@/features/auth/hooks/use-login-dialog.hook';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { ProfileSidebar } from './profile-sidebar';

interface AccountPageProps {
  activeItem: 'profile' | 'wallets' | 'activity';
  children: ReactNode;
  allowGuest?: boolean;
}

export function AccountPage({ activeItem, children, allowGuest = false }: AccountPageProps) {
  const { session, isLoading, logout } = useAuthSession();
  const { openLogin } = useLoginDialog();
  const cart = useCart();
  const [searchValue, setSearchValue] = useState('');

  return (
    <main className='min-h-dvh overflow-x-clip bg-[#140D0A] text-[#F5F1EB]'>
      <MarketplacePageContainer className='gap-8 pb-28 lg:pb-6'>
        <MarketplaceHeader
          activeItem='home'
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          cartItemCount={cart.items.length}
        />
        {isLoading ? (
          <Skeleton className='h-[40rem] w-full' />
        ) : !session && !allowGuest ? (
          <section className='flex flex-col items-start gap-4 py-8'>
            <h1 className='text-xl font-bold'>Entre para acessar seu perfil</h1>
            <Button onClick={(event) => openLogin(event.currentTarget)}>Entrar</Button>
          </section>
        ) : (
          <div className='grid min-w-0 items-start gap-7 lg:grid-cols-[19.375rem_minmax(0,1fr)]'>
            <ProfileSidebar
              activeItem={activeItem}
              showLogout={Boolean(session)}
              isLoggingOut={logout.isPending}
              onLogout={() => logout.mutate()}
            />
            {children}
          </div>
        )}
      </MarketplacePageContainer>
    </main>
  );
}
