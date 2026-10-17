import { useId, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { useCart } from '../hooks/use-cart.hook';
export function CartCouponField({ payment = false }: { payment?: boolean }) {
  const cart = useCart();
  const id = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const apply = async () => {
    setError(false);
    const saved = await cart.applyCoupon(code);
    if (saved) setCode('');
    else setError(true);
  };
  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={id} className={payment ? 'text-sm' : 'hidden text-sm font-bold md:block'}>
        {payment ? 'Tem um código promocional? Aplique aqui' : 'Código promocional'}
      </label>
      <div
        className={`flex h-10 overflow-hidden border ${payment ? 'rounded-sm border-[#3F2319]' : 'rounded-full border-[#3F2319] shadow-[0_0.375rem_1.25rem_rgba(10,6,4,0.3)] md:rounded-sm md:border-[#D28A4C] md:shadow-none'}`}
      >
        <Input
          id={id}
          aria-label='Código promocional'
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(false);
          }}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder='Digite o código promocional...'
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (code.trim() && !cart.isPending) void apply();
            }
          }}
          className='h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 text-xs placeholder:text-[#B39463] focus-visible:ring-0'
        />
        <Button
          type='button'
          disabled={cart.isPending || !code.trim()}
          onClick={() => void apply()}
          className={`h-full bg-[#D28A4C] px-4 text-sm font-bold text-[#140D0A] hover:bg-[#E89B55] ${payment ? 'rounded-none' : 'rounded-full md:rounded-none'}`}
        >
          Aplicar
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role='alert' className='text-xs text-[#F0805F]'>
          Não foi possível aplicar o cupom. Confira o código e tente novamente.
        </p>
      )}
      {cart.couponCode && (
        <div
          role='status'
          className='flex items-center justify-between gap-3 text-xs text-[#E89B55]'
        >
          <span>Cupom {cart.couponCode} aplicado</span>
          <button
            type='button'
            disabled={cart.isPending}
            onClick={() => void cart.removeCoupon()}
            className='underline hover:text-[#F5F1EB]'
          >
            Remover cupom
          </button>
        </div>
      )}
    </div>
  );
}
