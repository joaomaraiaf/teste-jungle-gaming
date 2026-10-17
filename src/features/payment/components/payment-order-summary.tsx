import { ArtworkImage } from '@/core/components/artwork-image';
import { Button } from '@/core/components/ui/button';
import { CartCouponField } from '@/features/cart/components/cart-coupon-field';
import type { CartItem } from '@/features/cart/domain/entities/cart-item.entity';
import { formatWeiAsEth, parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import { type Control, Controller, useFormState } from 'react-hook-form';
import type { PaymentFormValues } from '../data/schemas/payment-form.schema';
import type { usePaymentViewModel } from '../hooks/use-payment-view-model.hook';
import { PaymentCheckoutStatus } from './payment-checkout-status';

interface PaymentOrderSummaryProps {
  items: CartItem[];
  subtotalWei: bigint;
  estimatedFeeWei: bigint;
  totalWei: bigint;
  discountWei: bigint;
  control: Control<PaymentFormValues>;
  checkout: ReturnType<typeof usePaymentViewModel>['checkout'];
}

const walletOptions = [
  { label: 'MetaMask', value: 'metamask' },
  { label: 'Coinbase Wallet', value: 'coinbase' },
  { label: 'WalletConnect', value: 'walletconnect' },
] as const;

export function PaymentOrderSummary({
  items,
  subtotalWei,
  estimatedFeeWei,
  totalWei,
  discountWei,
  control,
  checkout,
}: PaymentOrderSummaryProps) {
  const cart = useCart();
  const { isSubmitting } = useFormState({ control });
  return (
    <aside className='flex flex-col gap-8' aria-label='Resumo do pagamento'>
      <section className='flex flex-col gap-3' aria-labelledby='payment-nfts-heading'>
        <div className='flex items-center justify-between border-b border-[#D28A4C] pb-3'>
          <h2 id='payment-nfts-heading' className='font-bold'>
            Seus NFTs
          </h2>
          <span className='text-sm text-[#CFB28C]'>Subtotal</span>
        </div>
        <div className='flex max-h-72 flex-col gap-3 overflow-y-auto'>
          {items.map((item) => {
            const lineTotalWei = parseEthToWei(item.unitPriceEth) * BigInt(item.quantity);

            return (
              <article
                key={`${item.nftId}:${item.editionId}`}
                className='flex min-h-[4.5rem] items-center gap-3 bg-[#241612] p-2'
              >
                {item.imageUrl ? (
                  <ArtworkImage
                    src={item.imageUrl}
                    alt={item.name}
                    className='size-[4.25rem] shrink-0 rounded-md object-cover'
                  />
                ) : (
                  <div
                    aria-hidden='true'
                    className='grid size-[4.25rem] shrink-0 place-items-center rounded-md bg-[#38220F] text-xs text-[#CFB28C]'
                  >
                    NFT
                  </div>
                )}
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <h3 className='truncate text-sm font-bold'>{item.name}</h3>
                  <p className='text-xs text-[#B39463]'>ID do token: #{item.tokenId}</p>
                  <div className='flex flex-wrap justify-between gap-1 text-xs'>
                    <span className='text-[#CFB28C]'>
                      {item.editionName} · x{item.quantity}
                    </span>
                    <span className='font-bold text-[#E89B55]'>
                      {formatWeiAsEth(lineTotalWei)} ETH
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className='flex flex-col gap-3' aria-label='Valores do pedido'>
        <CartCouponField payment />

        <div className='flex flex-col gap-3 border-b border-[#D28A4C] py-3 text-sm'>
          <SummaryLine label='Subtotal' value={`${formatWeiAsEth(subtotalWei)} ETH`} />
          <SummaryLine
            label='Desconto do lançamento'
            value={`${formatWeiAsEth(discountWei)} ETH`}
          />
          <div>
            <SummaryLine label='Taxa de rede' value={`${formatWeiAsEth(estimatedFeeWei)} ETH`} />
            <p className='mt-1 text-right text-xs text-[#E89B55]'>Taxa estimada</p>
          </div>
        </div>
        <div className='flex justify-between text-base font-bold'>
          <span>Total</span>
          <span className='text-[#E89B55]'>{formatWeiAsEth(totalWei)} ETH</span>
        </div>
      </section>

      <section className='flex flex-col gap-4' aria-labelledby='payment-wallet-heading'>
        <h2 id='payment-wallet-heading' className='font-bold'>
          Carteira e rede
        </h2>
        <p className='text-xs text-[#B39463]'>
          Carteiras compatíveis: MetaMask · Coinbase Wallet · WalletConnect
        </p>
        <Controller
          name='walletProvider'
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <div
                role='radiogroup'
                aria-label='Carteira para pagamento'
                aria-invalid={fieldState.invalid}
              >
                <div className='flex flex-col gap-3'>
                  {walletOptions.map((wallet) => (
                    <label
                      key={wallet.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-3 text-sm ${field.value === wallet.value ? 'border-[#D28A4C]' : 'border-[#3F2319]'}`}
                    >
                      <input
                        ref={field.ref}
                        type='radio'
                        name={field.name}
                        value={wallet.value}
                        checked={field.value === wallet.value}
                        onChange={() => field.onChange(wallet.value)}
                        onBlur={field.onBlur}
                        className='size-4 accent-[#D28A4C]'
                      />
                      {wallet.label}
                    </label>
                  ))}
                </div>
              </div>
              {fieldState.error && (
                <p role='alert' className='mt-2 text-xs text-[#F0805F]'>
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <PaymentCheckoutStatus checkout={checkout} />
        <Button
          type='submit'
          disabled={
            isSubmitting ||
            cart.isPending ||
            cart.isLoading ||
            checkout.blocked ||
            Boolean(checkout.quote && checkout.quote.status !== 'valid')
          }
          className='h-12 w-full rounded-md bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]'
        >
          {isSubmitting ? 'Salvando compra…' : 'Confirmar compra'}
        </Button>
        <p className='text-center text-xs text-[#B39463]'>
          Compra demonstrativa: nenhum valor será cobrado e nenhum NFT será transferido.
        </p>
      </section>
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
