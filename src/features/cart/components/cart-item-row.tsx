import { ArtworkImage } from '@/core/components/artwork-image';
import { Button } from '@/core/components/ui/button';
import type { CartItem } from '../domain/entities/cart-item.entity';
import { getCartItemKey } from '../domain/entities/cart-item.entity';
import { formatWeiAsEth, parseEthToWei } from '../domain/entities/cart-totals';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const itemKey = getCartItemKey(item);
  const lineTotal = parseEthToWei(item.unitPriceEth) * BigInt(item.quantity);

  return (
    <tr className='border-t border-[#3F2319] bg-[#241612] text-sm'>
      <th scope='row' className='min-w-64 px-3 py-3 text-left font-normal sm:px-4'>
        <div className='flex items-center gap-3'>
          {item.imageUrl ? (
            <ArtworkImage
              src={item.imageUrl}
              alt=''
              className='size-16 shrink-0 rounded-md object-cover'
            />
          ) : (
            <div className='size-16 shrink-0 rounded-md bg-[#38220F]' aria-hidden='true' />
          )}
          <div className='min-w-0'>
            <p className='truncate font-bold text-[#F5F1EB]'>{item.name}</p>
            <p className='text-xs text-[#B39463]'>ID do token: #{item.tokenId}</p>
          </div>
        </div>
      </th>
      <td className='whitespace-nowrap px-3 py-3 text-[#CFB28C]'>{item.unitPriceEth} ETH</td>
      <td className='px-3 py-3'>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            aria-label={`Diminuir quantidade de ${item.name}`}
            disabled={item.quantity <= 1}
            onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
            className='size-7 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55]'
          >
            −
          </Button>
          <span className='min-w-4 text-center' aria-label='Quantidade'>
            {item.quantity}
          </span>
          <Button
            type='button'
            aria-label={`Aumentar quantidade de ${item.name}`}
            disabled={item.quantity >= item.available}
            onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
            className='size-7 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55]'
          >
            +
          </Button>
        </div>
        <p className='mt-1 text-xs text-[#B39463]'>{item.editionName}</p>
      </td>
      <td className='whitespace-nowrap px-3 py-3 font-bold text-[#E89B55]'>
        {formatWeiAsEth(lineTotal)} ETH
      </td>
      <td className='px-2 py-3'>
        <Button
          type='button'
          variant='ghost'
          aria-label={`Remover ${item.name} do carrinho`}
          onClick={() => onRemove(itemKey)}
          className='size-8 p-0 text-[#B39463] hover:bg-[#38220F] hover:text-[#E89B55]'
        >
          <span aria-hidden='true'>×</span>
        </Button>
      </td>
    </tr>
  );
}
