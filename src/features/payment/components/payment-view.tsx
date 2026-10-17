import { AppForm } from '@/core/components/forms/app-form';
import { MarketplaceFooter } from '@/core/components/layout/marketplace-footer';
import { MarketplaceHeader } from '@/core/components/layout/marketplace-header';
import {
  MARKETPLACE_FULL_WIDTH_CLASS,
  MarketplacePageContainer,
} from '@/core/components/layout/marketplace-page-container';
import { Button } from '@/core/components/ui/button';
import { useMobileViewport } from '@/core/hooks/use-mobile-viewport.hook';
import { CartRequestState } from '@/features/cart/components/cart-request-state';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { usePaymentViewModel } from '../hooks/use-payment-view-model.hook';
import { PaymentCheckoutStatus } from './payment-checkout-status';
import { PaymentCollectorForm } from './payment-collector-form';
import { PaymentMobileView } from './payment-mobile-view';
import { PaymentOrderSummary } from './payment-order-summary';
import { PaymentSavedWallets } from './payment-saved-wallets';

export function PaymentView() {
  const cart = useCart();
  const isMobile = useMobileViewport();
  const viewModel = usePaymentViewModel();
  const [searchValue, setSearchValue] = useState('');

  if (cart.isLoading || cart.error)
    return (
      <main className='min-h-dvh bg-[#140D0A] text-[#F5F1EB]'>
        <CartRequestState />
      </main>
    );

  if (isMobile) return <PaymentMobileView viewModel={viewModel} />;

  return (
    <main className='min-h-dvh overflow-hidden bg-[#140D0A] text-[#F5F1EB]'>
      <MarketplacePageContainer className='gap-16 lg:gap-24'>
        <section
          className={`flex flex-col gap-8 ${MARKETPLACE_FULL_WIDTH_CLASS}`}
          aria-label='Pagamento'
        >
          <MarketplaceHeader
            activeItem='market'
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            cartItemCount={cart.items.length}
          />

          <div className='flex flex-col gap-8'>
            <nav aria-label='Trilha de navegação' className='text-sm font-bold'>
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
              <Link to='/cart' className='hover:text-[#E89B55]'>
                Carrinho
              </Link>
              <span aria-hidden='true' className='px-2 text-[#B39463]'>
                /
              </span>
              <span aria-current='page'>Pagamento</span>
            </nav>

            {viewModel.checkout.attempt.attempt ? (
              <PaymentCheckoutStatus checkout={viewModel.checkout} />
            ) : cart.items.length === 0 ? (
              <section className='flex min-h-72 flex-col items-center justify-center gap-4 rounded-md bg-[#241612] p-8 text-center'>
                <h1 className='text-2xl font-bold'>Seu carrinho está vazio</h1>
                <p className='text-sm text-[#CFB28C]'>
                  Adicione um NFT ao carrinho antes de iniciar o pagamento.
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
              <AppForm
                noValidate
                form={viewModel.form}
                onSubmit={viewModel.submitPayment}
                className='grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_25.3125rem]'
              >
                <div>
                  <PaymentSavedWallets
                    wallets={viewModel.savedWallets}
                    onSelect={viewModel.selectSavedWallet}
                  />
                  <PaymentCollectorForm form={viewModel.form} />
                </div>
                <PaymentOrderSummary
                  {...viewModel.preview}
                  control={viewModel.form.control}
                  checkout={viewModel.checkout}
                />
              </AppForm>
            )}
          </div>
        </section>

        <MarketplaceFooter />
      </MarketplacePageContainer>
    </main>
  );
}
