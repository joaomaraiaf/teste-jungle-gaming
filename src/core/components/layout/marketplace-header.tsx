import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { Link } from '@tanstack/react-router';
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { MarketplaceBottomNavigation } from './marketplace-bottom-navigation';

type MenuItem = 'home' | 'market' | 'creators' | 'learn';

interface MarketplaceHeaderProps {
  activeItem: MenuItem;
  searchValue: string;
  onSearchChange: (value: string) => void;
  cartItemCount: number;
  mobileCatalogSearch?: boolean;
  onOpenFilters?: () => void;
  hideHeaderOnMobile?: boolean;
  hideBottomNavigation?: boolean;
}

const menuItems: { id: MenuItem; label: string; href: string }[] = [
  { id: 'home', label: 'Início', href: '/' },
  { id: 'market', label: 'Mercado', href: '#catalogo' },
  { id: 'creators', label: 'Criadores', href: '#criadores' },
  { id: 'learn', label: 'Aprenda', href: '#aprenda' },
];

export function MarketplaceHeader({
  activeItem,
  searchValue,
  onSearchChange,
  cartItemCount,
  mobileCatalogSearch = false,
  onOpenFilters,
  hideHeaderOnMobile = false,
  hideBottomNavigation = false,
}: MarketplaceHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className='flex flex-col gap-0'>
        <div
          className={`${hideHeaderOnMobile ? 'hidden md:flex' : mobileCatalogSearch ? 'hidden lg:flex' : 'flex'} min-h-[2.8125rem] items-start justify-between gap-5`}
        >
          <Link
            to='/'
            search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
            aria-label='Kurio, início'
            className='flex h-[35px] w-40 items-center text-sm font-bold tracking-[0.1em] text-[#F5F1EB]'
          >
            KURIO
          </Link>
          <nav
            aria-label='Navegação principal'
            className='hidden h-[45px] items-start gap-10 md:flex'
          >
            {menuItems.map((item) => {
              const isActive = item.id === activeItem;
              const className = `relative flex h-[45px] items-start text-base leading-[21px] transition ${isActive ? 'font-bold text-[#E89B55]' : 'text-[#F5F1EB] hover:text-[#E89B55]'}`;
              const indicator = isActive && (
                <span
                  aria-hidden='true'
                  className='absolute inset-x-0 bottom-0 h-[3px] bg-[#D28A4C]'
                />
              );

              if (item.id === 'home' || item.id === 'market') {
                return (
                  <Link
                    key={item.id}
                    to='/'
                    search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
                    hash={item.id === 'market' ? 'catalogo' : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={className}
                  >
                    {item.label}
                    {indicator}
                  </Link>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={className}
                >
                  {item.label}
                  {indicator}
                </a>
              );
            })}
          </nav>
          <div className='flex h-[35px] items-center gap-5 sm:gap-7'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
              aria-expanded={searchOpen}
              className='size-5 text-[#F5F1EB] hover:bg-transparent hover:text-[#E89B55]'
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search size={20} />
            </Button>
            {searchOpen && (
              <Input
                id='catalog-search'
                autoFocus
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setSearchOpen(false);
                }}
                placeholder='Buscar NFTs'
                aria-label='Buscar NFTs por nome ou artista'
                className='h-[35px] w-40 border-[#55321F] bg-[#241612] text-xs text-[#F5F1EB] placeholder:text-[#CFB28C] focus-visible:ring-[#D28A4C] sm:w-52'
              />
            )}
            <Link
              to='/cart'
              aria-label={`Carrinho, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}`}
              className='relative hidden size-7 place-items-center text-[#F5F1EB] hover:text-[#E89B55] md:grid'
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className='absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-[#140D0A] bg-[#D28A4C] text-[10px] font-medium text-[#140D0A]'>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <div className='hidden md:block'>
              <AccountMenu />
            </div>
          </div>
        </div>
        {mobileCatalogSearch && (
          <div className='flex items-center gap-2 lg:hidden'>
            <label
              htmlFor='mobile-catalog-search'
              className='flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#241612] px-4 text-[#B39463]'
            >
              <Search aria-hidden='true' className='size-6 shrink-0' />
              <Input
                id='mobile-catalog-search'
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder='Explorar coleções'
                aria-label='Buscar NFTs por nome ou artista'
                className='h-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-[#F5F1EB] shadow-none placeholder:text-[#B39463] focus-visible:ring-0'
              />
            </label>
            <Button
              type='button'
              aria-label='Filtros do catálogo'
              onClick={onOpenFilters}
              className='size-12 shrink-0 rounded-xl bg-gradient-to-br from-[#D28A4C]/60 to-[#D28A4C] p-0 text-[#140D0A] hover:brightness-110'
            >
              <SlidersHorizontal aria-hidden='true' className='size-6' />
            </Button>
          </div>
        )}
        <div
          className={`${hideHeaderOnMobile ? 'hidden md:block' : mobileCatalogSearch ? 'hidden lg:block' : ''} mx-auto h-px w-[calc(100%-16px)] bg-[#D28A4C]/70`}
        />
      </header>
      {!hideBottomNavigation && (
        <MarketplaceBottomNavigation
          cartItemCount={cartItemCount}
          includeTablet={mobileCatalogSearch}
        />
      )}
    </>
  );
}
