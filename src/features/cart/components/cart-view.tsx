import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { BackgroundRequestStatus } from '@/core/components/background-request-status';
import { MarketplaceFooter } from '@/core/components/layout/marketplace-footer';
import { MarketplaceHeader } from '@/core/components/layout/marketplace-header';
import {
  MARKETPLACE_FULL_WIDTH_CLASS,
  MarketplacePageContainer,
} from '@/core/components/layout/marketplace-page-container';
import { Button } from '@/core/components/ui/button';
import { useCart } from '../hooks/use-cart.hook';
import { CartItemRow } from './cart-item-row';
import { CartMobileHeader } from './cart-mobile-header';
import { CartMobileItem } from './cart-mobile-item';
import { CartRecommendations } from './cart-recommendations';
import { CartRequestState } from './cart-request-state';
import { CartSummary } from './cart-summary';

export function CartView() {
  const cart = useCart();
  const [searchValue, setSearchValue] = useState('');

  return (
    <main className='min-h-dvh overflow-x-hidden bg-[#140D0A] text-[#F5F1EB]'>
      <MarketplacePageContainer className='gap-16 pb-28 lg:gap-24'>
        <section
          className={`flex flex-col gap-4 px-2 md:gap-8 md:px-0 ${MARKETPLACE_FULL_WIDTH_CLASS}`}
          aria-label='Carrinho'
        >
          <MarketplaceHeader
            activeItem='market'
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            cartItemCount={cart.items.length}
            hideHeaderOnMobile
            hideBottomNavigation
          />
          <CartMobileHeader />

          <div className='flex flex-col gap-3'>
            <nav aria-label='Trilha de navegação' className='hidden text-sm font-bold md:block'>
              <Link
                to='/'
                search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
                className='hover:text-[#E89B55]'
              >
                Início
              </Link>
              <span aria-hidden='true' className='px-2 text-[#B39463]'>
                /
              </span>
              <Link
                to='/'
                search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
                hash='catalogo'
                className='hover:text-[#E89B55]'
              >
                Mercado
              </Link>
              <span aria-hidden='true' className='px-2 text-[#B39463]'>
                /
              </span>
              <span aria-current='page'>Carrinho</span>
            </nav>

            <BackgroundRequestStatus
              resource='carrinho'
              refreshing={cart.isRefreshing}
              failed={Boolean(cart.refreshError)}
              retry={cart.retry}
            />
            {cart.priceNotice && (
              <p role='status' className='border border-[#D28A4C] p-3 text-sm text-[#E89B55]'>
                {cart.priceNotice}
              </p>
            )}
            {cart.stockNotice && (
              <p role='alert' className='border border-[#D28A4C] p-3 text-sm text-[#E89B55]'>
                {cart.stockNotice}
              </p>
            )}
            {cart.isLoading || cart.error ? (
              <CartRequestState />
            ) : cart.items.length === 0 ? (
              <section className='flex min-h-72 flex-col items-center justify-center gap-4 rounded-md bg-[#241612] p-8 text-center'>
                <h1 className='text-2xl font-bold'>Seu carrinho está vazio</h1>
                <p className='text-sm text-[#CFB28C]'>
                  Explore o catálogo e escolha NFTs para sua coleção.
                </p>
                <Button
                  asChild
                  className='bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]'
                >
                  <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
                    Explorar NFTs
                  </Link>
                </Button>
              </section>
            ) : (
              <>
                <h1 className='hidden text-xl font-bold md:block'>Carrinho de NFTs</h1>
                <div className='grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_25rem]'>
                  <div className='relative hidden min-w-0 overflow-x-auto md:block'>
                    <table className='w-full min-w-[48rem] border-separate border-spacing-y-3 text-left'>
                      <thead>
                        <tr className='text-sm'>
                          <th scope='col' className='px-3 pb-2 font-bold sm:px-4'>
                            NFTs
                          </th>
                          <th scope='col' className='px-3 pb-2 font-medium'>
                            Preço
                          </th>
                          <th scope='col' className='px-3 pb-2 font-bold'>
                            Edições
                          </th>
                          <th scope='col' className='px-3 pb-2 font-medium'>
                            Total
                          </th>
                          <th scope='col' className='px-2 pb-2'>
                            <span className='sr-only'>Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.items.map((item) => (
                          <CartItemRow
                            key={`${item.nftId}:${item.editionId}`}
                            item={item}
                            onUpdateQuantity={cart.updateQuantity}
                            onRemove={cart.removeItem}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className='flex flex-col gap-3 md:hidden'>
                    {cart.items.map((item) => (
                      <CartMobileItem
                        key={`${item.nftId}:${item.editionId}`}
                        item={item}
                        onUpdateQuantity={cart.updateQuantity}
                        onRemove={cart.removeItem}
                      />
                    ))}
                  </div>
                  <CartSummary
                    itemCount={cart.totalQuantity}
                    subtotalWei={cart.subtotalWei}
                    estimatedFeeWei={cart.estimatedFeeWei}
                    totalWei={cart.totalWei}
                    discountWei={cart.discountWei}
                    hasItems={cart.items.length > 0 && !cart.hasUnavailable}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <div className='hidden md:block'>
          <CartRecommendations />
        </div>
        <div className='hidden md:block'>
          <MarketplaceFooter />
        </div>
      </MarketplacePageContainer>
    </main>
  );
}
