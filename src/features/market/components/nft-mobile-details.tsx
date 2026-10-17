import { Link } from '@tanstack/react-router';
import { ChevronLeft, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ArtworkImage } from '@/core/components/artwork-image';
import { BackgroundRequestStatus } from '@/core/components/background-request-status';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import type { useMarketView } from '../hooks/use-market-view.hook';

interface NftMobileDetailsProps {
  view: ReturnType<typeof useMarketView>;
  onBuy: () => void;
  onAddToCart: () => void;
}

export function NftMobileDetails({ view, onBuy, onAddToCart }: NftMobileDetailsProps) {
  const nft = view.nftQuery.data;
  const edition = view.selectedEdition;
  const unavailable = !edition || edition.available === 0;
  return (
    <div className='flex min-h-dvh flex-col bg-[#241612]'>
      <div className='bg-[linear-gradient(143deg,#241612_-12%,#2F1D15_107%)] px-7 pt-[1.4375rem]'>
        <div className='mb-2 flex items-center justify-between'>
          <Button
            asChild
            className='size-[2.1875rem] rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-[#CFB28C] hover:bg-[#38220F]'
          >
            <Link
              to='/'
              search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
              aria-label='Voltar ao catálogo'
            >
              <ChevronLeft aria-hidden='true' className='size-5' />
            </Link>
          </Button>
          <Button
            type='button'
            aria-label={view.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={view.isFavorite}
            onClick={view.toggleFavorite}
            className='size-[2.1875rem] rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-[#E89B55] hover:bg-[#38220F]'
          >
            <Heart
              aria-hidden='true'
              className='size-4'
              fill={view.isFavorite ? 'currentColor' : 'none'}
            />
          </Button>
        </div>
        {view.nftQuery.isPending ? (
          <Skeleton className='aspect-[361/356] w-full rounded-3xl' />
        ) : nft?.imageUrl ? (
          <ArtworkImage
            src={nft.imageUrl}
            loading='eager'
            fetchPriority='high'
            alt={`${nft.name}, arte digital colecionável`}
            className='aspect-[361/356] w-full rounded-3xl object-cover'
          />
        ) : (
          <div className='grid aspect-[361/356] place-items-center rounded-3xl bg-[#2F1D15] text-[#B39463]'>
            {nft?.name ?? 'NFT'}
          </div>
        )}
      </div>
      <BackgroundRequestStatus
        resource='NFT'
        refreshing={view.nftQuery.isFetching && !view.nftQuery.isPending}
        failed={view.nftQuery.isError && Boolean(nft)}
        retry={() => void view.nftQuery.refetch()}
      />
      {view.nftQuery.isPending ? (
        <Skeleton className='m-6 h-64' />
      ) : !nft ? (
        <section role='alert' className='space-y-4 p-6'>
          <h1 className='text-xl font-bold'>
            {view.nftQuery.isError ? 'Não foi possível carregar este NFT' : 'NFT não encontrado'}
          </h1>
          {view.nftQuery.isError && (
            <Button onClick={() => void view.nftQuery.refetch()}>Tentar novamente</Button>
          )}
        </section>
      ) : (
        <>
          <section
            aria-label='Informações e compra do NFT'
            className='relative -mt-8 flex flex-1 flex-col gap-3 rounded-t-[1.9375rem] bg-[#241612] px-6 pb-8 pt-8'
          >
            <div className='flex items-center justify-between gap-3'>
              <h1 className='min-w-0 text-xl font-bold leading-tight'>{nft.name}</h1>
              <p
                role='img'
                aria-label={`Avaliação ${nft.details.rating} de 5, ${nft.details.reviewsCount} avaliações`}
                className='flex shrink-0 items-center gap-1 rounded-full border border-[#D28A4C] px-1.5 py-1 text-sm leading-4'
              >
                <Star aria-hidden='true' className='size-3 fill-[#E3A44E] text-[#E3A44E]' />
                {nft.details.rating}
                <span className='text-[#CFB28C]'>({nft.details.reviewsCount})</span>
              </p>
            </div>
            <p className='text-sm leading-6 text-[#CFB28C]'>
              Um colecionável digital {edition?.name.toLowerCase()} finalizado à mão da coleção{' '}
              {nft.collection}, verificado na {nft.network}.
            </p>
            <div role='group' aria-label='Edição' className='space-y-2'>
              <h2 className='text-[0.9375rem] font-bold leading-4'>Edição:</h2>
              <div className='flex flex-wrap gap-3'>
                {nft.editions.map((option) => (
                  <button
                    key={option.id}
                    type='button'
                    aria-pressed={option.id === view.selectedEditionId}
                    disabled={option.available === 0}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      view.setSelectedEditionId(option.id);
                      view.setQuantity(1);
                    }}
                    className={`h-7 rounded-full border px-1.5 text-sm transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#D28A4C] ${option.id === view.selectedEditionId ? 'border-[#D28A4C] text-[#E89B55]' : 'border-[#3F2319] text-[#CFB28C] hover:border-[#D28A4C]'}`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <div className='space-y-3 text-[0.9375rem] leading-5 text-[#B39463]'>
              <p>ID do token: #{nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id}</p>
              <p>Coleção: {nft.collection}</p>
              <p>Atributos: {nft.details.attributes.join(', ')}</p>
            </div>
          </section>
          <section
            aria-label='Comprar NFT'
            className='sticky bottom-0 z-10 flex flex-col gap-5 rounded-t-[2.5rem] bg-[#241612] px-6 pb-[max(2.25rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_0_1.25rem_rgba(10,6,4,0.45)]'
          >
            <div className='flex items-center justify-between gap-3'>
              <div role='group' aria-label='Quantidade' className='flex items-center gap-3'>
                <span className='text-[0.9375rem] text-[#CFB28C]'>Qtd.</span>
                <Button
                  type='button'
                  aria-label='Diminuir quantidade'
                  disabled={view.quantity <= 1}
                  onClick={() => view.setQuantity(Math.max(1, view.quantity - 1))}
                  className='h-[1.875rem] w-5 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55] disabled:opacity-100'
                >
                  <Minus aria-hidden='true' className='size-4' />
                </Button>
                <span className='text-lg font-medium'>{view.quantity}</span>
                <Button
                  type='button'
                  aria-label='Aumentar quantidade'
                  disabled={unavailable || view.quantity >= (edition?.available ?? 0)}
                  onClick={() =>
                    view.setQuantity(Math.min(edition?.available ?? 0, view.quantity + 1))
                  }
                  className='h-[1.875rem] w-5 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55]'
                >
                  <Plus aria-hidden='true' className='size-4' />
                </Button>
              </div>
              <p className='text-xl font-bold text-[#E89B55]'>{edition?.priceEth ?? '—'} ETH</p>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                type='button'
                aria-label='Comprar'
                disabled={unavailable}
                onClick={onBuy}
                className='h-[3.75rem] w-[12.25rem] max-w-[calc(100%-4.5rem)] rounded-full bg-gradient-to-r from-[#D28A4C] to-[#B77842] font-bold text-[#140D0A] hover:brightness-110'
              >
                Comprar NFT
              </Button>
              <Button
                type='button'
                aria-label='Adicionar ao carrinho'
                disabled={unavailable}
                onClick={() => {
                  onAddToCart();
                  toast.success('NFT adicionado ao carrinho.');
                }}
                className='size-[3.75rem] shrink-0 rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-[#B39463] hover:bg-[#38220F]'
              >
                <ShoppingCart aria-hidden='true' className='size-5' />
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
