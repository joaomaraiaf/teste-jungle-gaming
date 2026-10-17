import { ArtworkImage } from '@/core/components/artwork-image';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
import {
  type CatalogCollectionFilter,
  CatalogFilters,
  type CatalogNetworkFilter,
} from './catalog-filters';

interface CatalogSidebarProps {
  search: CatalogQuery;
  collections: CatalogCollectionFilter[];
  networks: CatalogNetworkFilter[];
  featuredImageUrl: string;
  updateFilters: (updates: Partial<CatalogQuery>) => void;
  setCategory: (category: CatalogQuery['category']) => void;
}

export function CatalogSidebar({
  search,
  collections,
  networks,
  featuredImageUrl,
  updateFilters,
  setCategory,
}: CatalogSidebarProps) {
  return (
    <aside className='hidden w-full shrink-0 flex-col gap-6 lg:flex lg:w-[19.375rem]'>
      <div className='rounded-sm bg-[#241612] p-5'>
        <CatalogFilters
          search={search}
          collections={collections}
          networks={networks}
          updateFilters={updateFilters}
          setCategory={setCategory}
        />
      </div>
      <div className='relative flex min-h-[29.375rem] flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(210,138,76,.1),rgba(210,138,76,.03))] px-5 pb-4 pt-6'>
        <div className='relative z-10 flex flex-col items-center gap-4'>
          <h2 className='text-center text-2xl font-bold leading-8 text-[#E89B55]'>
            NFT EM DESTAQUE
          </h2>
          <p className='text-center text-[18px] font-bold leading-4'>OFERTA LIMITADA</p>
          <div className='nft-featured-art relative h-[23rem] w-full overflow-hidden rounded-[1.375rem] bg-[#241612]'>
            <ArtworkImage
              src={featuredImageUrl}
              alt='Macaco colecionável usando blazer claro'
              className='h-full w-full object-cover'
            />
          </div>
          <div className='w-full space-y-1'>
            <p className='text-base'>Emerald Ape #042</p>
            <p className='text-lg font-bold text-[#E89B55]'>1.19 ETH</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
