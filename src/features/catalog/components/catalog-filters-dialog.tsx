import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/core/components/ui/dialog';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
import {
  type CatalogCollectionFilter,
  CatalogFilters,
  type CatalogNetworkFilter,
} from './catalog-filters';

interface CatalogFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: CatalogQuery;
  collections: CatalogCollectionFilter[];
  networks: CatalogNetworkFilter[];
  updateFilters: (updates: Partial<CatalogQuery>) => void;
  setCategory: (category: CatalogQuery['category']) => void;
}

export function CatalogFiltersDialog({
  open,
  onOpenChange,
  search,
  collections,
  networks,
  updateFilters,
  setCategory,
}: CatalogFiltersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto border-[#3F2319] bg-[#241612] text-[#F5F1EB] lg:hidden'>
        <div className='flex flex-col gap-2 pr-6'>
          <DialogTitle className='text-left text-lg font-bold text-[#E89B55]'>
            Filtros do catálogo
          </DialogTitle>
          <DialogDescription className='text-left text-sm text-[#CFB28C]'>
            Refine os NFTs por coleção, faixa de preço e rede.
          </DialogDescription>
        </div>
        <CatalogFilters
          search={search}
          collections={collections}
          networks={networks}
          updateFilters={updateFilters}
          setCategory={setCategory}
        />
      </DialogContent>
    </Dialog>
  );
}
