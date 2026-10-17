import { useState } from 'react';
import { MARKETPLACE_FULL_WIDTH_CLASS } from '@/core/components/layout/marketplace-page-container';
import { NftCard } from '@/features/catalog/components/nft-card';
import { useCatalog } from '@/features/catalog/hooks/use-catalog.hook';

export function CartRecommendations() {
  const [page, setPage] = useState(1);
  const catalog = useCatalog({ page, limit: 5, search: '', sort: 'price-desc' });
  const nfts = catalog.data?.data ?? [];
  const pageCount = catalog.data?.lastPage ?? 1;

  if (!catalog.isPending && nfts.length === 0) return null;

  return (
    <section
      className={`flex w-full flex-col gap-8 ${MARKETPLACE_FULL_WIDTH_CLASS}`}
      aria-labelledby='cart-recommendations-heading'
    >
      <div className='flex flex-col gap-3 border-b border-[#D28A4C] pb-3'>
        <h2 id='cart-recommendations-heading' className='text-lg font-bold text-[#E89B55]'>
          Colecionadores também viram
        </h2>
      </div>
      <div className='grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5'>
        {catalog.isPending
          ? Array.from({ length: 5 }, (_, index) => (
              <div key={index} className='flex flex-col gap-3'>
                <div className='aspect-square animate-pulse rounded-lg bg-[#241612]' />
                <div className='h-4 w-2/3 animate-pulse bg-[#241612]' />
              </div>
            ))
          : nfts.map((nft) => <NftCard key={nft.id} nft={nft} />)}
      </div>
      {pageCount > 1 && (
        <nav aria-label='Paginação de recomendações' className='flex w-full justify-center gap-2'>
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            const isCurrentPage = page === pageNumber;

            return (
              <button
                key={pageNumber}
                type='button'
                aria-label={`Mostrar recomendações da página ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                onClick={() => setPage(pageNumber)}
                className={`h-2 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                  isCurrentPage ? 'w-6 bg-[#D28A4C]' : 'w-2 bg-[#D28A4C]/40 hover:bg-[#D28A4C]'
                }`}
              />
            );
          })}
        </nav>
      )}
    </section>
  );
}
