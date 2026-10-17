import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export function CartMobileHeader() {
  return (
    <div className='relative flex h-11 items-center justify-center md:hidden'>
      <Link
        to='/'
        search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
        aria-label='Voltar para o início'
        className='absolute left-0 grid size-9 place-items-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#B39463] transition hover:text-[#F5F1EB] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
      >
        <ArrowLeft aria-hidden='true' className='size-4' />
      </Link>
      <h1 className='text-sm font-bold'>Carrinho de NFTs</h1>
    </div>
  );
}
