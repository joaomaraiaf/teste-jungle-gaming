import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
import { useCatalog, useCatalogFacets } from './use-catalog.hook';

export function useCatalogView() {
  const search = useSearch({ from: '/' });
  const href = useLocation({ select: (location) => location.href });
  const navigate = useNavigate({ from: '/' });
  const [draft, setDraft] = useState<{ value: string; href: string } | null>(null);
  const previousHref = useRef(href);
  useLayoutEffect(() => {
    if (previousHref.current !== href) {
      previousHref.current = href;
      setDraft(null);
    }
  }, [href]);
  const searchValue = draft?.href === href ? draft.value : search.search;
  const { tab, redirect: _redirect, ...query } = search;
  const activeTab =
    tab === 'new'
      ? 'Novos lançamentos'
      : search.sort === 'price-desc'
        ? 'Em alta'
        : 'Todos os NFTs';
  const catalog = useCatalog(query);
  const facets = useCatalogFacets();

  // A navigation invalidates the pending edit. Never write a stale debounce over browser history.
  useEffect(() => {
    if (!draft || draft.href !== href || draft.value === search.search) return;
    const timer = window.setTimeout(() => {
      void navigate({
        search: (current) => ({ ...current, search: draft.value, page: 1 }),
        replace: true,
        resetScroll: false,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, href, search.search, navigate]);

  const updateFilters = (updates: Partial<CatalogQuery>) => {
    setDraft(null);
    void navigate({
      search: (current) => ({
        ...current,
        ...updates,
        page: 1,
        tab: updates.sort ? undefined : search.tab,
      }),
      resetScroll: false,
    });
  };
  const setActiveTab = (label: string) => {
    setDraft(null);
    void navigate({
      search: (current) => ({
        ...current,
        page: 1,
        sort: label === 'Em alta' ? 'price-desc' : 'newest',
        tab: label === 'Novos lançamentos' ? 'new' : undefined,
      }),
      resetScroll: false,
    });
  };
  const setCategory = (category: CatalogQuery['category']) =>
    updateFilters({ category: search.category === category ? undefined : category });
  const clearFilters = () => {
    setDraft(null);
    void navigate({
      search: { page: 1, limit: 9, search: '', sort: 'newest' },
      resetScroll: false,
    });
  };
  const goToPage = (page: number) => {
    setDraft(null);
    void navigate({ search: { ...search, page }, resetScroll: false });
  };
  return {
    search,
    searchValue,
    setSearchValue: (value: string) => setDraft({ value, href }),
    activeTab,
    setActiveTab,
    catalog,
    facets,
    updateFilters,
    setCategory,
    clearFilters,
    goToPage,
  };
}
