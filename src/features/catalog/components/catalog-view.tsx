import { MarketplaceFooter } from '@/core/components/layout/marketplace-footer';
import { MarketplaceHeader } from '@/core/components/layout/marketplace-header';
import {
  MARKETPLACE_FULL_WIDTH_CLASS,
  MarketplacePageContainer,
} from '@/core/components/layout/marketplace-page-container';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { Suspense, lazy, useState } from 'react';
import {
  CATALOG_FEATURED_IMAGE,
  CATALOG_HERO_SLIDES,
  CATALOG_PROMOTIONS,
  CATALOG_TABS,
  JOURNAL_ARTICLES,
} from '../content/catalog-content';
import { useCatalogView } from '../hooks/use-catalog-view.hook';
const CatalogFiltersDialog = lazy(() =>
  import('./catalog-filters-dialog').then((module) => ({ default: module.CatalogFiltersDialog }))
);
import { CatalogHero } from './catalog-hero';
import { CatalogJournal } from './catalog-journal';
import { CatalogListing } from './catalog-listing';
import { CatalogPromotions } from './catalog-promotions';
import { CatalogSidebar } from './catalog-sidebar';

export function CatalogView() {
  const cart = useCart();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    search,
    searchValue,
    setSearchValue,
    activeTab,
    setActiveTab,
    catalog,
    facets,
    updateFilters,
    setCategory,
    clearFilters,
    goToPage,
  } = useCatalogView();

  return (
    <main className='min-h-dvh overflow-hidden bg-[#140D0A] text-[#F5F1EB]'>
      <MarketplacePageContainer className='gap-8 lg:gap-24'>
        <section
          className={`flex flex-col gap-6 lg:gap-8 ${MARKETPLACE_FULL_WIDTH_CLASS}`}
          aria-label='Início'
        >
          <MarketplaceHeader
            activeItem='home'
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            cartItemCount={cart.items.length}
            mobileCatalogSearch
            onOpenFilters={() => setFiltersOpen(true)}
          />

          <CatalogHero slides={CATALOG_HERO_SLIDES} />
          <Suspense fallback={<p role='status'>Abrindo filtros…</p>}>
            {filtersOpen && (
              <CatalogFiltersDialog
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                search={search}
                collections={facets.data?.collections ?? []}
                networks={facets.data?.networks ?? []}
                updateFilters={updateFilters}
                setCategory={setCategory}
              />
            )}
          </Suspense>
        </section>

        <section id='catalogo' className='flex flex-col gap-8' aria-label='Catálogo de NFTs'>
          {facets.isError && (
            <div
              role='alert'
              className='flex flex-wrap items-center justify-between gap-3 border border-[#55321F] bg-[#241612] p-4 text-sm text-[#CFB28C]'
            >
              <p>Não foi possível carregar os filtros do catálogo.</p>
              <button
                type='button'
                onClick={() => void facets.refetch()}
                className='text-[#E89B55] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
              >
                Tentar carregar os filtros novamente
              </button>
            </div>
          )}
          <div className={`flex flex-col gap-8 ${MARKETPLACE_FULL_WIDTH_CLASS}`}>
            <div className='flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12'>
              <CatalogSidebar
                search={search}
                collections={facets.data?.collections ?? []}
                networks={facets.data?.networks ?? []}
                featuredImageUrl={CATALOG_FEATURED_IMAGE}
                updateFilters={updateFilters}
                setCategory={setCategory}
              />
              <CatalogListing
                search={search}
                activeTab={activeTab}
                tabs={CATALOG_TABS}
                catalog={catalog}
                setActiveTab={setActiveTab}
                updateFilters={updateFilters}
                clearFilters={clearFilters}
                goToPage={goToPage}
              />
            </div>

            <CatalogPromotions promotions={CATALOG_PROMOTIONS} />
            <CatalogJournal articles={JOURNAL_ARTICLES} />
          </div>
          <MarketplaceFooter />
        </section>
      </MarketplacePageContainer>
    </main>
  );
}
