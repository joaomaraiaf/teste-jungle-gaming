import { ArtworkImage } from '@/core/components/artwork-image';
import { useFavorite } from '@/features/favorites/hooks/use-favorite.hook';
import { Link } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import type { Nft } from '../domain/entities/nft.entity';

interface NftCardProps {
  nft: Nft;
  priority?: boolean;
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const { isFavorite, toggleFavorite, isPending } = useFavorite(nft.id);
  const edition = nft.editions[0];

  return (
    <article className='group relative flex w-full min-w-0 flex-col gap-3 transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none'>
      <Link
        to='/market/$nftId'
        params={{ nftId: nft.id }}
        className='flex flex-col gap-3'
        aria-label={`Ver ${nft.name} ${edition?.priceEth ?? '—'} ETH`}
      >
        <div className='nft-art relative aspect-square w-full rounded-[24px] bg-[#241612] p-3 lg:aspect-[1.25]'>
          <div className='h-full w-full overflow-hidden rounded-[16px]'>
            {nft.imageUrl ? (
              <ArtworkImage
                src={nft.imageUrl}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                sizes='(max-width: 1023px) 40vw, 25vw'
                alt={`${nft.name}, da coleção ${nft.collection}`}
                className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]'
              />
            ) : (
              <div className='nft-art-placeholder flex h-full items-end p-4' aria-hidden='true'>
                <span className='text-xs uppercase tracking-[0.2em] text-[#E89B55]/80'>
                  {nft.collection}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <h3 className='truncate text-sm font-normal leading-4 text-[#F5F1EB]'>{nft.name}</h3>
          <p className='text-base font-bold leading-5 text-[#E89B55]'>
            {edition?.priceEth ?? '—'} ETH
          </p>
        </div>
      </Link>
      <button
        type='button'
        aria-label={
          isFavorite ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`
        }
        aria-pressed={isFavorite}
        onClick={toggleFavorite}
        disabled={isPending}
        className='absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-[#140D0A]/55 text-[#F5F1EB] opacity-100 transition hover:text-[#E89B55] focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
