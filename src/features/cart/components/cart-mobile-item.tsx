import { ArtworkImage } from '@/core/components/artwork-image';
import { Button } from '@/core/components/ui/button';
import { type CartItem, getCartItemKey } from '../domain/entities/cart-item.entity';

interface CartMobileItemProps {
  item: CartItem;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export function CartMobileItem({ item, onUpdateQuantity, onRemove }: CartMobileItemProps) {
  const itemKey = getCartItemKey(item);

  return (
    <article className='flex min-h-[5.5rem] overflow-hidden rounded-[0.875rem] bg-[#241612] shadow-[0_0.375rem_1.25rem_rgba(10,6,4,0.3)]'>
      {item.imageUrl ? (
        <ArtworkImage
          src={item.imageUrl}
          alt=''
          className='w-16 shrink-0 self-stretch object-cover'
        />
      ) : (
        <div className='w-16 shrink-0 self-stretch bg-[#38220F]' aria-hidden='true' />
      )}
      <div className='flex min-w-0 flex-1 items-center justify-between gap-2 px-2'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate text-[0.6875rem] font-bold text-[#F5F1EB]'>{item.name}</p>
          <p className='truncate text-[0.625rem] text-[#CFB28C]'>Edição: {item.editionName}</p>
          <p className='mt-1 text-xs font-bold text-[#E89B55]'>{item.unitPriceEth} ETH</p>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1'>
          <div className='flex items-center gap-1' role='group' aria-label='Quantidade'>
            <Button
              type='button'
              aria-label={`Diminuir quantidade de ${item.name}`}
              disabled={item.quantity <= 1}
              onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
              className='size-5 rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-xs text-[#B39463] hover:bg-[#38220F]'
            >
              −
            </Button>
            <span className='min-w-3 text-center text-[0.625rem]'>{item.quantity}</span>
            <Button
              type='button'
              aria-label={`Aumentar quantidade de ${item.name}`}
              disabled={item.quantity >= item.available}
              onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
              className='size-5 rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-xs text-[#F5F1EB] hover:bg-[#38220F]'
            >
              +
            </Button>
          </div>
          <Button
            type='button'
            variant='ghost'
            aria-label={`Remover ${item.name} do carrinho`}
            onClick={() => onRemove(itemKey)}
            className='h-4 px-1 text-[0.625rem] text-[#B39463] hover:bg-transparent hover:text-[#E89B55]'
          >
            Remover
          </Button>
        </div>
      </div>
    </article>
  );
}
