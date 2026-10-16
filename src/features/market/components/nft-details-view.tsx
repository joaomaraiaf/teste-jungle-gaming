import { BackgroundRequestStatus } from '@/core/components/background-request-status';
import { MarketplaceFooter } from '@/core/components/layout/marketplace-footer';
import { MarketplaceHeader } from '@/core/components/layout/marketplace-header';
import {
  MARKETPLACE_FULL_WIDTH_CLASS,
  MarketplacePageContainer,
} from '@/core/components/layout/marketplace-page-container';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useMobileViewport } from '@/core/hooks/use-mobile-viewport.hook';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMarketView } from '../hooks/use-market-view.hook';
import { NftDescription } from './nft-description';
import { NftGallery } from './nft-gallery';
import { NftMobileDetails } from './nft-mobile-details';
import { NftPurchasePanel } from './nft-purchase-panel';
import { NftRelatedCollection } from './nft-related-collection';

export function NftDetailsView() {
  const view = useMarketView();
  const isMobile = useMobileViewport();
  const cart = useCart();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const addToCart = async (goToCart = true) => {
    const nft = view.nftQuery.data;
    const edition = view.selectedEdition;
    if (!nft || !edition) return;
    const saved = await cart.addItem({
      nftId: nft.id,
      name: nft.name,
      imageUrl: nft.imageUrl,
      collection: nft.collection,
      tokenId: nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id,
      editionId: edition.id,
      editionName: edition.name,
      unitPriceEth: edition.priceEth,
      quantity: view.quantity,
      available: edition.available,
    });
    if (saved && goToCart) void navigate({ to: '/cart' });
  };

  if (isMobile)
    return (
      <main className='min-h-dvh bg-[#140D0A] text-[#F5F1EB]'>
        <NftMobileDetails
          view={view}
          onBuy={() => addToCart()}
          onAddToCart={() => addToCart(false)}
        />
      </main>
    );

  return (
    <main className='min-h-dvh overflow-hidden bg-[#140D0A] text-[#F5F1EB]'>
      <MarketplacePageContainer className='gap-10 lg:gap-16'>
        <section className={`flex flex-col gap-8 ${MARKETPLACE_FULL_WIDTH_CLASS}`}>
          <MarketplaceHeader
            activeItem='market'
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            cartItemCount={cart.items.length}
          />
          <div className='flex flex-col gap-3'>
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
              <span aria-current='page'>Mercado</span>
            </nav>
            <BackgroundRequestStatus
              resource='NFT'
              refreshing={view.nftQuery.isFetching && !view.nftQuery.isPending}
              failed={view.nftQuery.isError && Boolean(view.nftQuery.data)}
              retry={() => void view.nftQuery.refetch()}
            />
            {view.nftQuery.isPending ? (
              <div
                className='grid gap-8 lg:grid-cols-[573px_minmax(0,1fr)]'
                aria-label='Carregando NFT'
              >
                <Skeleton className='aspect-square' />
                <Skeleton className='h-[28rem]' />
              </div>
            ) : !view.nftQuery.data ? (
              <div
                role='alert'
                className='flex min-h-[360px] flex-col items-start justify-center gap-4 border border-[#3F2319] bg-[#241612] px-6'
              >
                <h1 className='text-2xl font-bold'>
                  {view.nftQuery.isError
                    ? 'Não foi possível carregar este NFT'
                    : 'NFT não encontrado'}
                </h1>
                <p className='text-sm text-[#CFB28C]'>
                  {view.nftQuery.isError
                    ? 'Verifique a conexão e tente novamente.'
                    : 'Este item não está disponível no mercado.'}
                </p>
                {view.nftQuery.isError && (
                  <Button
                    type='button'
                    onClick={() => void view.nftQuery.refetch()}
                    className='bg-[#D28A4C] text-[#140D0A] hover:bg-[#E89B55]'
                  >
                    Tentar novamente
                  </Button>
                )}
                <Button
                  asChild
                  variant='outline'
                  className='border-[#D28A4C] bg-transparent text-[#E89B55] hover:bg-[#2F1D15]'
                >
                  <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
                    Voltar ao catálogo
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,573px)_minmax(0,1fr)]'>
                  <NftGallery
                    name={view.nftQuery.data.name}
                    images={view.images}
                    selectedImage={view.selectedImage}
                    isFavorite={view.isFavorite}
                    onSelectImage={view.setSelectedImage}
                    onToggleFavorite={view.toggleFavorite}
                  />
                  <NftPurchasePanel
                    nft={view.nftQuery.data}
                    selectedEditionId={view.selectedEditionId}
                    selectedEdition={view.selectedEdition}
                    quantity={view.quantity}
                    isFavorite={view.isFavorite}
                    onSelectEdition={(id) => {
                      view.setSelectedEditionId(id);
                      view.setQuantity(1);
                    }}
                    onSetQuantity={view.setQuantity}
                    onToggleFavorite={view.toggleFavorite}
                    onAddToCart={() => addToCart()}
                  />
                </div>
                <div className='mt-12 flex flex-col gap-16'>
                  <NftDescription
                    details={view.nftQuery.data.details}
                    name={view.nftQuery.data.name}
                    collection={view.nftQuery.data.collection}
                    network={view.nftQuery.data.network}
                    activeTab={view.activeTab}
                    onChangeTab={view.setActiveTab}
                  />
                  <NftRelatedCollection nft={view.nftQuery.data} />
                </div>
              </>
            )}
          </div>
        </section>
        <MarketplaceFooter />
      </MarketplacePageContainer>
    </main>
  );
}
