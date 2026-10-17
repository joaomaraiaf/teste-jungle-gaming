import { Link } from '@tanstack/react-router';
import { ArtworkImage } from '@/core/components/artwork-image';
import type { Nft } from '@/features/catalog/domain/entities/nft.entity';

interface MarketCollectionCardProps {
  nft: Nft;
}

export function MarketCollectionCard({ nft }: MarketCollectionCardProps) {
  return (
    <article className='group flex min-w-0 flex-col gap-3'>
      <Link
        to='/market/$nftId'
        params={{ nftId: nft.id }}
        aria-label={`Ver ${nft.name}`}
        className='flex flex-col gap-4'
      >
        <div className='nft-art aspect-square rounded-md bg-[#241612] p-2'>
          <div className='h-full w-full overflow-hidden rounded-md'>
            {nft.imageUrl ? (
              <ArtworkImage
                src={nft.imageUrl}
                alt={nft.name}
                className='size-full object-cover transition group-hover:scale-[1.03]'
              />
            ) : (
              <div className='grid size-full place-items-center text-sm text-[#B39463]'>
                {nft.collection}
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-col gap-1'>
          <h3 className='truncate text-sm text-[#F5F1EB]'>{nft.name}</h3>
          <p className='text-sm font-bold text-[#E89B55]'>{nft.editions[0]?.priceEth ?? '—'} ETH</p>
        </div>
      </Link>
    </article>
  );
}
