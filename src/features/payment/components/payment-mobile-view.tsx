import { Link } from '@tanstack/react-router';
import { ChevronLeft, MoreVertical, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { AppForm } from '@/core/components/forms/app-form';
import { Button } from '@/core/components/ui/button';
import { formatWeiAsEth } from '@/features/cart/domain/entities/cart-totals';
import { useCart } from '@/features/cart/hooks/use-cart.hook';
import type { WalletSlot } from '@/features/wallets/domain/entities/saved-wallet.entity';
import type { usePaymentViewModel } from '../hooks/use-payment-view-model.hook';
import { PaymentCheckoutStatus } from './payment-checkout-status';
import { PaymentCollectorForm } from './payment-collector-form';

interface PaymentMobileViewProps {
  viewModel: ReturnType<typeof usePaymentViewModel>;
}
const networks = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
  solana: 'Rede Solana',
};
const providers = [
  { value: 'walletconnect', label: 'WalletConnect', initial: 'W' },
  { value: 'metamask', label: 'MetaMask', initial: 'M' },
  { value: 'coinbase', label: 'Coinbase Wallet', initial: null },
] as const;

export function PaymentMobileView({ viewModel }: PaymentMobileViewProps) {
  const cart = useCart();
  const [selectedSlot, setSelectedSlot] = useState<WalletSlot | null>(() =>
    viewModel.hasSavedDraft
      ? viewModel.form.getValues('useSecondaryWallet')
        ? 'secondary'
        : 'primary'
      : null
  );
  const [editing, setEditing] = useState(viewModel.hasSavedDraft);
  const wallets = viewModel.savedWallets;
  const hasWallet = Boolean(wallets?.primary);
  const activeSlot = selectedSlot ?? (hasWallet ? 'primary' : null);
  const { selectSavedWallet } = viewModel;
  useEffect(() => {
    if (hasWallet && !selectedSlot) {
      selectSavedWallet('primary');
      setSelectedSlot('primary');
    }
  }, [hasWallet, selectedSlot, selectSavedWallet]);
  const showForm = editing || !hasWallet || Object.keys(viewModel.form.formState.errors).length > 0;
  const pickWallet = (slot: WalletSlot) => {
    setSelectedSlot(slot);
    viewModel.selectSavedWallet(slot);
    setEditing(false);
  };
  return (
    <main className='min-h-dvh bg-[#140D0A] px-7 py-8 text-[#F5F1EB]'>
      <header className='mb-4 flex min-h-11 items-start gap-6'>
        <Button
          asChild
          className='size-[2.1875rem] shrink-0 rounded-full border border-[#3F2319] bg-[#2F1D15] p-0 text-[#B39463] hover:bg-[#38220F]'
        >
          <Link to='/cart' aria-label='Voltar ao carrinho'>
            <ChevronLeft aria-hidden='true' className='size-5' />
          </Link>
        </Button>
        <h1 className='pt-1 text-xl font-bold leading-7'>Pagamento com carteira</h1>
      </header>
      {viewModel.checkout.attempt.attempt ? (
        <PaymentCheckoutStatus checkout={viewModel.checkout} />
      ) : cart.items.length === 0 ? (
        <section className='space-y-4 py-8'>
          <h2 className='text-xl font-bold'>Seu carrinho está vazio</h2>
          <Button asChild>
            <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
              Explorar NFTs
            </Link>
          </Button>
        </section>
      ) : (
        <AppForm
          noValidate
          form={viewModel.form}
          onSubmit={async (values) => {
            await viewModel.submitPayment(values);
          }}
          className='flex min-h-[calc(100dvh-7.75rem)] flex-col justify-between gap-8'
        >
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='text-base font-bold leading-4'>Carteira conectada</h2>
              <button
                type='button'
                onClick={() => setEditing((value) => !value)}
                className='text-right text-sm font-bold text-[#E89B55] hover:underline focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
              >
                {editing ? 'Fechar' : hasWallet ? 'Trocar carteira' : 'Adicionar carteira'}
              </button>
            </div>
            {hasWallet && (
              <div role='radiogroup' aria-label='Carteiras salvas' className='space-y-5'>
                {(['secondary', 'primary'] as const).map((slot) => {
                  const wallet = wallets?.[slot];
                  if (!wallet || (slot === 'secondary' && wallets?.secondarySameAsPrimary))
                    return null;
                  const address = wallet.ensName
                    ? `${wallet.ensName}.eth`
                    : `${wallet.walletAddress.slice(0, 6)}…${wallet.walletAddress.slice(-4)}`;
                  return (
                    <div
                      key={slot}
                      className='flex min-h-[5.8125rem] items-center rounded-[0.875rem] bg-[#241612] pl-5 pr-2'
                    >
                      <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-5 py-3'>
                        <input
                          type='radio'
                          name='saved-wallet'
                          checked={activeSlot === slot}
                          onChange={() => pickWallet(slot)}
                          className='size-4 shrink-0 appearance-none rounded-full border border-[#55321F] bg-transparent checked:border-[#D28A4C] checked:bg-[#D28A4C] checked:shadow-[inset_0_0_0_0.1875rem_#241612] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D28A4C]'
                          aria-label={`${slot === 'primary' ? 'Principal' : 'Secundária'} · ${wallet.walletAlias}`}
                        />
                        <span className='min-w-0 space-y-1'>
                          <span className='block truncate text-base font-bold'>
                            {wallet.walletAlias || (slot === 'primary' ? 'Principal' : 'Reserva')}
                          </span>
                          <span
                            className='block truncate text-sm text-[#CFB28C]'
                            title={wallet.walletAddress}
                          >
                            {address}
                          </span>
                          <span className='block text-sm text-[#CFB28C]'>
                            {networks[wallet.network]}
                          </span>
                        </span>
                      </label>
                      <Button
                        type='button'
                        variant='ghost'
                        aria-label={`Editar carteira ${wallet.walletAlias}`}
                        onClick={() => {
                          pickWallet(slot);
                          setEditing(true);
                        }}
                        className='size-10 shrink-0 p-0 text-[#B39463]'
                      >
                        <MoreVertical aria-hidden='true' className='size-5' />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {showForm && (
              <div className='space-y-6 rounded-[0.875rem] border border-[#3F2319] p-4'>
                {hasWallet && <p className='text-xs text-[#B39463]'>Dados usados nesta compra.</p>}
                <PaymentCollectorForm form={viewModel.form} />
                {!hasWallet && (
                  <section className='space-y-2' aria-label='Resumo do pedido'>
                    <h2 className='font-bold'>Seus NFTs</h2>
                    {cart.items.map((item) => (
                      <p key={`${item.nftId}:${item.editionId}`} className='text-sm text-[#CFB28C]'>
                        {item.name} · {item.editionName} · x{item.quantity}
                      </p>
                    ))}
                  </section>
                )}
              </div>
            )}
            <section aria-labelledby='mobile-wallet-heading' className='space-y-4'>
              <h2 id='mobile-wallet-heading' className='text-base font-bold leading-4'>
                Carteira e rede
              </h2>
              <Controller
                name='walletProvider'
                control={viewModel.form.control}
                render={({ field }) => (
                  <div role='radiogroup' aria-label='Carteira para pagamento' className='space-y-4'>
                    {providers.map((provider) => (
                      <label
                        key={provider.value}
                        className='flex min-h-[4.0625rem] cursor-pointer items-center gap-3 rounded-[0.9375rem] bg-[#241612] px-3.5 py-3 hover:bg-[#2F1D15]'
                      >
                        <span
                          aria-hidden='true'
                          className='grid size-10 shrink-0 place-items-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-sm text-[#D28A4C]'
                        >
                          {provider.initial ?? <Wallet className='size-5' />}
                        </span>
                        <span className='flex-1 text-sm'>{provider.label}</span>
                        <input
                          ref={field.ref}
                          type='radio'
                          name={field.name}
                          value={provider.value}
                          checked={field.value === provider.value}
                          onChange={() => field.onChange(provider.value)}
                          onBlur={field.onBlur}
                          className='size-4 shrink-0 appearance-none rounded-full border border-[#55321F] bg-transparent checked:border-[#D28A4C] checked:bg-[#D28A4C] checked:shadow-[inset_0_0_0_0.1875rem_#241612] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D28A4C]'
                        />
                      </label>
                    ))}
                  </div>
                )}
              />
            </section>
            <PaymentCheckoutStatus checkout={viewModel.checkout} />
            <div
              role='group'
              aria-label='Valores do pedido'
              className='flex justify-end gap-7 font-bold'
            >
              <span>Total:</span>
              <span className='text-lg text-[#E89B55]'>
                {formatWeiAsEth(viewModel.preview.totalWei)} ETH
              </span>
            </div>
          </div>
          <Button
            type='submit'
            disabled={
              viewModel.form.formState.isSubmitting ||
              cart.isPending ||
              cart.isLoading ||
              viewModel.checkout.blocked ||
              Boolean(viewModel.checkout.quote && viewModel.checkout.quote.status !== 'valid')
            }
            className='h-[3.75rem] w-full shrink-0 rounded-full bg-gradient-to-r from-[#D28A4C] to-[#B77842] text-[0.9375rem] font-bold text-[#140D0A] hover:brightness-110'
          >
            {viewModel.form.formState.isSubmitting ? 'Salvando compra…' : 'Confirmar compra'}
          </Button>
        </AppForm>
      )}
    </main>
  );
}
