import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
import { CatalogPriceRangeFilter } from './catalog-price-range-filter';

export type CatalogCollectionFilter = {
  label: string;
  value: NonNullable<CatalogQuery['category']>;
  count: number;
};

export type CatalogNetworkFilter = {
  label: string;
  value: NonNullable<CatalogQuery['network']>;
  count: number;
};

interface CatalogFiltersProps {
  search: CatalogQuery;
  collections: CatalogCollectionFilter[];
  networks: CatalogNetworkFilter[];
  updateFilters: (updates: Partial<CatalogQuery>) => void;
  setCategory: (category: CatalogQuery['category']) => void;
}

export function CatalogFilters({
  search,
  collections,
  networks,
  updateFilters,
  setCategory,
}: CatalogFiltersProps) {
  return (
    <div className='flex flex-col gap-10'>
      <fieldset className='flex flex-col gap-3'>
        <legend className='text-lg font-bold leading-4'>Coleções</legend>
        <div className='px-3'>
          {collections.map((collection) => {
            const active = search.category === collection.value;
            return (
              <button
                key={collection.label}
                type='button'
                onClick={() => setCategory(collection.value)}
                aria-pressed={active}
                className={`flex h-10 w-full items-center justify-between text-left text-sm transition ${active ? 'text-[#E89B55]' : 'text-[#CFB28C] hover:text-[#E89B55]'}`}
              >
                <span>{collection.label}</span>
                <span className='font-bold'>{`(${collection.count})`}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className='flex flex-col gap-3'>
        <legend className='text-lg font-bold leading-4'>Faixa de preço</legend>
        <CatalogPriceRangeFilter
          minPriceEth={search.minPriceEth}
          maxPriceEth={search.maxPriceEth}
          onApply={(range) => updateFilters(range)}
        />
      </fieldset>

      <fieldset className='flex flex-col gap-3'>
        <legend className='text-lg font-bold leading-4'>Rede</legend>
        <div className='pl-3'>
          {networks.map((network) => {
            const active = search.network === network.value;
            return (
              <button
                key={network.label}
                type='button'
                onClick={() => updateFilters({ network: active ? undefined : network.value })}
                aria-pressed={active}
                className={`flex h-10 w-full items-center justify-between text-left text-sm transition ${active ? 'text-[#E89B55]' : 'text-[#CFB28C] hover:text-[#E89B55]'}`}
              >
                <span>{network.label}</span>
                <span>{`(${network.count})`}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
