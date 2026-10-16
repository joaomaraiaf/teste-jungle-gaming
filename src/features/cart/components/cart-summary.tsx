import { Button } from '@/core/components/ui/button';
import { Link } from '@tanstack/react-router';
import { formatWeiAsEth } from '../domain/entities/cart-totals';
import { CartCouponField } from './cart-coupon-field';

interface CartSummaryProps {
  itemCount: number;
  subtotalWei: bigint;
  estimatedFeeWei: bigint;
  totalWei: bigint;
  discountWei: bigint;
  hasItems: boolean;
}

export function CartSummary({
  itemCount,
  subtotalWei,
  estimatedFeeWei,
  totalWei,
  discountWei,
  hasItems,
}: CartSummaryProps) {
  return (
    <aside className='-mx-7 flex w-[calc(100%+3.5rem)] flex-col gap-3 rounded-t-[2.5rem] bg-[#241612] px-6 pb-8 pt-4 md:mx-0 md:w-full md:gap-6 md:rounded-none md:p-6 lg:max-w-[25rem]'>
      <div className='hidden flex-col gap-3 border-b border-[#D28A4C] pb-3 md:flex'>
        <h2 className='text-lg font-bold'>Resumo da carteira</h2>
      </div>

      <CartCouponField />

      <div className='flex flex-col gap-2 text-xs md:gap-3 md:text-sm'>
        <SummaryLine label='Subtotal' value={`${formatWeiAsEth(subtotalWei)} ETH`} />
        <SummaryLine label='Desconto do lançamento' value={`${formatWeiAsEth(discountWei)} ETH`} />
        <div className='flex flex-col gap-1'>
          <SummaryLine label='Taxa de rede' value={`${formatWeiAsEth(estimatedFeeWei)} ETH`} />
          <p className='text-right text-xs text-[#E89B55]'>Taxa estimada</p>
        </div>
        <div className='flex justify-between pt-1 text-sm font-bold md:border-t md:border-[#3F2319] md:pt-3 md:text-base'>
          <span>Total</span>
          <span className='text-[#E89B55]'>{formatWeiAsEth(totalWei)} ETH</span>
        </div>
      </div>

      <div className='flex flex-col items-center gap-3'>
        {hasItems ? (
          <Button
            asChild
            className='h-[3.75rem] w-full rounded-full bg-gradient-to-r from-[#D28A4C] to-[#D28A4C]/80 text-sm font-bold text-[#140D0A] hover:brightness-110 md:h-10 md:rounded-sm md:bg-[#D28A4C] md:hover:bg-[#E89B55]'
          >
            <Link to='/payment'>Conectar e finalizar</Link>
          </Button>
        ) : (
          <Button
            type='button'
            disabled
            className='h-[3.75rem] w-full rounded-full bg-gradient-to-r from-[#D28A4C] to-[#D28A4C]/80 text-sm font-bold text-[#140D0A] hover:brightness-110 md:h-10 md:rounded-sm md:bg-[#D28A4C] md:hover:bg-[#E89B55]'
          >
            Conectar e finalizar
          </Button>
        )}
        <Link
          to='/'
          search={{ page: 1, limit: 9, search: '', sort: 'newest' }}
          className='hidden text-sm text-[#E89B55] hover:text-[#F5F1EB] md:block'
        >
          Continuar explorando
        </Link>
        <p className='sr-only' aria-live='polite'>
          {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
        </p>
      </div>
    </aside>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <span>{label}</span>
      <span className='shrink-0 text-right'>{value}</span>
    </div>
  );
}
