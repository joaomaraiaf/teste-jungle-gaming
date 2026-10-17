import { ArtworkImage } from '@/core/components/artwork-image';
import { getCartItemKey } from '@/features/cart/domain/entities/cart-item.entity';
import { formatWeiAsEth, parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import type { PaymentReceipt } from '../domain/entities/payment-receipt.entity';

interface PaymentReceiptDetailsProps {
  receipt: PaymentReceipt;
}

export function PaymentReceiptDetails({ receipt }: PaymentReceiptDetailsProps) {
  return (
    <section className='flex flex-col gap-2' aria-labelledby='receipt-details-heading'>
      <h2 id='receipt-details-heading' className='text-sm font-bold'>
        Detalhes da transação
      </h2>
      <table className='w-full table-fixed text-left' aria-labelledby='receipt-details-heading'>
        <thead className='border-b border-[#D28A4C]/50 text-xs text-[#CFB28C]'>
          <tr>
            <th scope='col' className='w-1/2 pb-3 text-sm font-bold text-[#F5F1EB]'>
              NFTs
            </th>
            <th scope='col' className='w-[22%] pb-3 text-center text-sm font-bold text-[#F5F1EB]'>
              Edições
            </th>
            <th scope='col' className='w-[28%] pb-3 text-right text-sm font-bold text-[#F5F1EB]'>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={getCartItemKey(item)}>
              <td className='py-3 pr-2 align-middle'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                  {item.imageUrl ? (
                    <ArtworkImage
                      src={item.imageUrl}
                      alt={item.name}
                      className='size-12 shrink-0 rounded-lg object-cover sm:size-16'
                    />
                  ) : (
                    <div
                      aria-hidden='true'
                      className='size-12 shrink-0 rounded-lg bg-[#38220F] sm:size-16'
                    />
                  )}
                  <div className='min-w-0'>
                    <h3 className='break-words text-sm font-bold'>{item.name}</h3>
                    <p className='mt-1 break-words text-xs text-[#B39463]'>
                      ID do token: #{item.tokenId}
                    </p>
                  </div>
                </div>
              </td>
              <td className='px-1 py-3 text-center align-middle text-xs text-[#CFB28C]'>
                <p className='mt-1'>(x {item.quantity})</p>
              </td>
              <td className='break-words py-3 pl-2 text-right align-middle text-sm font-bold text-[#E89B55]'>
                {formatWeiAsEth(parseEthToWei(item.unitPriceEth) * BigInt(item.quantity))} ETH
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className='ml-auto flex w-full max-w-80 flex-col gap-3 text-sm'>
        {Boolean(receipt.discountWei) && (
          <div className='flex justify-between gap-4'>
            <dt>Desconto</dt>
            <dd>{formatWeiAsEth(receipt.discountWei ?? 0n)} ETH</dd>
          </div>
        )}
        <div className='flex justify-between gap-4'>
          <dt>Taxa de rede</dt>
          <dd>{formatWeiAsEth(receipt.estimatedFeeWei)} ETH</dd>
        </div>
        <div className='flex justify-between gap-4 font-bold'>
          <dt>Total</dt>
          <dd className='text-base text-[#E89B55]'>{formatWeiAsEth(receipt.totalWei)} ETH</dd>
        </div>
      </dl>
    </section>
  );
}
