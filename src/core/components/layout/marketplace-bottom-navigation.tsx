import { AccountMenu } from '@/features/auth/components/account-menu';
import { Link, useLocation } from '@tanstack/react-router';
import { Heart, House, ScanLine, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface MarketplaceBottomNavigationProps {
  cartItemCount: number;
  includeTablet?: boolean;
}

const homeSearch = { page: 1, limit: 9, search: '', sort: 'newest' } as const;

export function MarketplaceBottomNavigation({
  cartItemCount,
  includeTablet = false,
}: MarketplaceBottomNavigationProps) {
  const { pathname } = useLocation();
  const activeSection =
    pathname === '/'
      ? 'home'
      : pathname.startsWith('/profile') || pathname.startsWith('/wallets')
        ? 'account'
        : pathname === '/cart' || pathname.startsWith('/payment')
          ? 'cart'
          : 'explore';

  return (
    <nav
      aria-label='Navegação inferior'
      className={`fixed inset-x-0 bottom-0 z-50 h-32 pb-[env(safe-area-inset-bottom)] ${includeTablet ? 'lg:hidden' : 'md:hidden'}`}
    >
      <svg
        aria-hidden='true'
        className='absolute inset-0 h-full w-full drop-shadow-[0_-0.625rem_1.875rem_rgba(10,6,4,0.45)]'
        viewBox='0 0 414 126'
        preserveAspectRatio='none'
        focusable='false'
      >
        <path
          d='M56 31H148C177 31 177 48 190 67C197 77 201 82 207 82C213 82 217 77 224 67C237 48 237 31 266 31H358C380 31 398 49 398 71V86C398 108 380 126 358 126H56C34 126 16 108 16 86V71C16 49 34 31 56 31Z'
          fill='#241612'
          stroke='#3F2319'
        />
      </svg>
      <div className='absolute inset-x-8 top-12 mx-auto grid h-12 max-w-[32rem] grid-cols-5 items-center'>
        <Link
          to='/'
          search={homeSearch}
          aria-label='Início'
          aria-current={activeSection === 'home' ? 'page' : undefined}
          className={`grid h-full place-items-center ${activeSection === 'home' ? 'text-[#E89B55]' : 'text-[#CFB28C]'}`}
        >
          <House aria-hidden='true' className='size-5 fill-current' />
        </Link>

        <button
          type='button'
          aria-label='Favoritos'
          onClick={() => toast.info('Lista de interesse: esta seção ainda não está disponível.')}
          className='grid h-full place-items-center text-[#CFB28C] transition hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
        >
          <Heart aria-hidden='true' className='size-5 fill-current' />
        </button>

        <Link
          to='/'
          search={homeSearch}
          hash='catalogo'
          aria-label='Explorar NFTs'
          aria-current={activeSection === 'explore' ? 'page' : undefined}
          className={`absolute left-1/2 top-0 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#D28A4C]/80 text-[#F5F1EB] shadow-[0_0_0_0.625rem_#140D0A,0_0.25rem_0.75rem_rgba(0,0,0,0.4)] transition hover:brightness-110 ${activeSection === 'explore' ? 'ring-2 ring-[#E89B55]' : ''}`}
        >
          <ScanLine aria-hidden='true' className='size-7' strokeWidth={1.8} />
        </Link>

        <span aria-hidden='true' />

        <Link
          to='/cart'
          aria-label={`Carrinho, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}`}
          aria-current={activeSection === 'cart' ? 'page' : undefined}
          className={`relative grid h-full place-items-center ${activeSection === 'cart' ? 'text-[#E89B55]' : 'text-[#CFB28C]'}`}
        >
          <ShoppingCart aria-hidden='true' className='size-5' />
          {cartItemCount > 0 && (
            <span className='absolute right-[calc(50%-0.875rem)] top-4 grid size-4 place-items-center rounded-full bg-[#D28A4C] text-[0.625rem] font-bold text-[#140D0A]'>
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </Link>

        <div className='grid h-full place-items-center [&_button]:text-[#CFB28C] [&_button:hover]:text-[#E89B55]'>
          <AccountMenu compact />
        </div>
      </div>
    </nav>
  );
}
