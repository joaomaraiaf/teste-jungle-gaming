import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useCart } from '../hooks/use-cart.hook';
export function CartRequestState() {
  const cart = useCart();
  return (
    <section
      className='flex min-h-72 flex-col items-center justify-center gap-4 bg-[#241612] p-8 text-center'
      aria-live='polite'
    >
      {cart.error ? (
        <>
          <p role='alert'>Não foi possível carregar o carrinho.</p>
          <Button onClick={cart.retry}>Tentar novamente</Button>
        </>
      ) : (
        <div
          role='status'
          aria-label='Carregando carrinho'
          className='grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_25rem]'
        >
          <span className='sr-only'>Carregando carrinho…</span>
          <div className='space-y-3'>
            <Skeleton className='h-8 w-1/2' />
            <Skeleton className='h-28 w-full' />
          </div>
          <div role='group' aria-label='Resumo do carrinho' className='space-y-5'>
            <Skeleton className='h-8 w-2/3' />
            <Skeleton className='h-28 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        </div>
      )}
    </section>
  );
}
