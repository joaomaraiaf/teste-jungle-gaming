import { BackgroundRequestStatus } from '@/core/components/background-request-status';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { navigateTabList } from '@/core/lib/tab-keyboard';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
import type { useCatalog } from '../hooks/use-catalog.hook';
import { NftCard } from './nft-card';

interface CatalogTab {
  label: string;
  sort: CatalogQuery['sort'];
}

interface CatalogListingProps {
  search: CatalogQuery;
  activeTab: string;
  tabs: CatalogTab[];
  catalog: ReturnType<typeof useCatalog>;
  setActiveTab: (tab: string) => void;
  updateFilters: (updates: Partial<CatalogQuery>) => void;
  clearFilters: () => void;
  goToPage: (page: number) => void;
}

export function CatalogListing({
  search,
  activeTab,
  tabs,
  catalog,
  setActiveTab,
  updateFilters,
  clearFilters,
  goToPage,
}: CatalogListingProps) {
  return (
    <div className='flex w-full min-w-0 flex-1 flex-col gap-6' aria-busy={catalog.isFetching}>
      <h2 className='sr-only'>NFTs disponíveis</h2>
      <BackgroundRequestStatus
        resource='catálogo'
        refreshing={catalog.isFetching && !catalog.isPending}
        failed={catalog.isError && Boolean(catalog.data)}
        retry={() => void catalog.refetch()}
      />
      <div className='flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between'>
        <div
          className='flex flex-nowrap gap-x-4 overflow-x-auto whitespace-nowrap lg:gap-x-5'
          role='tablist'
          onKeyDown={navigateTabList}
          aria-label='Tipo de NFT'
        >
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type='button'
              role='tab'
              aria-selected={activeTab === tab.label}
              onClick={() => {
                setActiveTab(tab.label);
              }}
              className={`relative pb-2 text-sm font-medium ${activeTab === tab.label ? 'text-[#E89B55]' : 'text-[#F5F1EB]'}`}
            >
              {tab.label}
              {activeTab === tab.label && (
                <span className='absolute inset-x-0 bottom-0 h-0.5 bg-[#D28A4C]' />
              )}
            </button>
          ))}
        </div>
        <label className='flex items-center gap-2 text-sm text-[#F5F1EB]'>
          <span>Ordenar por:</span>
          <span className='relative flex shrink-0 items-center'>
            <select
              value={search.sort}
              aria-label='Ordenar por'
              onChange={(event) =>
                updateFilters({ sort: event.target.value as CatalogQuery['sort'] })
              }
              className='w-[13rem] appearance-none bg-transparent outline-none'
            >
              <option value='newest' className='bg-[#241612]'>
                Listados recentemente
              </option>
              <option value='price-asc' className='bg-[#241612]'>
                Menor preço
              </option>
              <option value='price-desc' className='bg-[#241612]'>
                Maior preço
              </option>
              <option value='name-asc' className='bg-[#241612]'>
                Nome A–Z
              </option>
            </select>
            <ChevronDown size={16} className='pointer-events-none absolute right-0' />
          </span>
        </label>
      </div>

      {catalog.isPending ? (
        <div className='grid grid-cols-2 items-start gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-18'>
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className={`space-y-3 ${index % 2 === 1 ? 'mt-8 lg:mt-0' : ''}`}>
              <Skeleton className='aspect-[0.86]' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-4 w-1/3' />
            </div>
          ))}
        </div>
      ) : catalog.isError && !catalog.data ? (
        <div className='border border-[#55321F] bg-[#241612] px-6 py-12 text-center' role='alert'>
          <h2 className='text-lg font-bold'>Não foi possível carregar o catálogo</h2>
          <p className='mt-2 text-sm text-[#CFB28C]'>Verifique a conexão e tente novamente.</p>
          <Button
            onClick={() => void catalog.refetch()}
            className='mt-5 bg-[#D28A4C] text-[#140D0A] hover:bg-[#E89B55]'
          >
            Tentar novamente
          </Button>
        </div>
      ) : catalog.data?.data.length ? (
        <>
          <div className='grid grid-cols-2 items-start gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-18'>
            {catalog.data.data.map((nft, index) => (
              <div key={nft.id} className={index % 2 === 1 ? 'mt-8 lg:mt-0' : ''}>
                <NftCard nft={nft} priority={index < 2} />
              </div>
            ))}
          </div>
          <div className='mt-auto flex justify-end'>
            <nav aria-label='Paginação' className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                aria-label='Página anterior'
                disabled={search.page <= 1}
                onClick={() => goToPage(search.page - 1)}
                className='size-9 rounded-sm border-[#3F2319] bg-transparent text-[#F5F1EB] hover:bg-[#241612]'
              >
                <ChevronLeft size={17} />
              </Button>
              {Array.from({ length: Math.min(catalog.data.lastPage, 4) }, (_, index) => {
                const page = index + 1;
                return (
                  <Button
                    key={page}
                    variant='outline'
                    aria-label={`Página ${page}`}
                    aria-current={search.page === page ? 'page' : undefined}
                    onClick={() => goToPage(page)}
                    className={`size-9 rounded-sm border-[#3F2319] p-0 text-lg ${search.page === page ? 'bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]' : 'bg-transparent text-[#F5F1EB] hover:bg-[#241612]'}`}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant='outline'
                size='icon'
                aria-label='Próxima página'
                disabled={search.page >= catalog.data.lastPage}
                onClick={() => goToPage(search.page + 1)}
                className='size-9 rounded-sm border-[#3F2319] bg-transparent text-[#F5F1EB] hover:bg-[#241612]'
              >
                <ChevronRight size={17} />
              </Button>
            </nav>
          </div>
        </>
      ) : (
        <div className='border border-[#3F2319] bg-[#241612] px-6 py-16 text-center'>
          <p className='text-sm text-[#CFB28C]'>Nenhum NFT encontrado com esses filtros.</p>
          <Button variant='link' onClick={clearFilters} className='mt-2 text-[#E89B55]'>
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
