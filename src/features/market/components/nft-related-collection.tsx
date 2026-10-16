import { Skeleton } from '@/core/components/ui/skeleton';
import type { Nft } from '@/features/catalog/domain/entities/nft.entity';
import { useState } from 'react';
import { useMarketCollection } from '../hooks/use-market-collection.hook';
import { MarketCollectionCard } from './market-collection-card';

const ITEMS_PER_PAGE = 5;

interface NftRelatedCollectionProps {
  nft: Nft;
}

export function NftRelatedCollection({ nft }: NftRelatedCollectionProps) {
  const [page, setPage] = useState(1);
  const related = useMarketCollection(nft.collection);
  const items = related.data?.filter((item) => item.id !== nft.id) ?? [];
  const pageCount = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pageItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <section className='flex flex-col gap-7' aria-labelledby='related-heading'>
      <div className='flex flex-col gap-3 border-b border-[#D28A4C]/70 pb-3'>
        <h2 id='related-heading' className='text-[17px] font-bold text-[#E89B55]'>
          Mais desta coleção
        </h2>
      </div>
      {related.isPending ? (
        <div
          className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5'
          aria-label='Carregando itens relacionados'
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className='aspect-square' />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className='grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-5'>
            {pageItems.map((item) => (
              <MarketCollectionCard key={item.id} nft={item} />
            ))}
          </div>
          {pageCount > 1 && (
            <nav
              aria-label='Paginação de itens da coleção'
              className='flex w-full justify-center gap-2'
            >
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = page === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type='button'
                    aria-label={`Mostrar itens da coleção da página ${pageNumber}`}
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
        </>
      ) : (
        <p className='text-sm text-[#CFB28C]'>
          Ainda não há outros itens disponíveis nesta coleção.
        </p>
      )}
    </section>
  );
}
