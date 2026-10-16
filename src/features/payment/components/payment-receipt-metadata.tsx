import { formatWeiAsEth } from '@/features/cart/domain/entities/cart-totals';
import { Fragment } from 'react';
import type { PaymentReceipt } from '../domain/entities/payment-receipt.entity';

interface PaymentReceiptMetadataProps {
  receipt: PaymentReceipt;
}

export function PaymentReceiptMetadata({ receipt }: PaymentReceiptMetadataProps) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(new Date(receipt.createdAt));
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value.replace('.', '') ?? '';
  const year = parts.find((part) => part.type === 'year')?.value;
  const date = `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${year}`;
  const hash = receipt.transactionHash;
  const metadata = [
    { label: 'ID da transação', value: `${hash.slice(0, 6)}...${hash.slice(-4)}`, title: hash },
    { label: 'Data', value: date },
    { label: 'Total', value: `${formatWeiAsEth(receipt.totalWei)} ETH` },
    { label: 'Carteira', value: receipt.walletName },
  ];

  return (
    <dl className='grid grid-cols-[max-content_1fr_max-content] gap-x-3 gap-y-4 border-y border-[#D28A4C] px-6 py-4 text-xs text-[#CFB28C] sm:grid-cols-[max-content_1fr_max-content_1fr_max-content_1fr_max-content]'>
      {metadata.map(({ label, value, title }, index) => (
        <Fragment key={label}>
          <div className='flex flex-col gap-1 whitespace-nowrap'>
            <dt>{label}</dt>
            <dd title={title}>{value}</dd>
          </div>
          {index < metadata.length - 1 && (
            <span
              aria-hidden='true'
              className={`justify-self-center self-stretch border-l border-[#D28A4C]/50 ${index === 1 ? 'hidden sm:block' : ''}`}
            />
          )}
        </Fragment>
      ))}
    </dl>
  );
}
