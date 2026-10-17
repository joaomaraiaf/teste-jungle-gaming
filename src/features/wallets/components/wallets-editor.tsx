import { useRef, useState } from 'react';
import type { SavedWallets } from '../domain/entities/saved-wallet.entity';
import { useWalletActions } from '../hooks/use-wallets.hook';
import { WalletForm } from './wallet-form';

const actionClass =
  'text-sm text-[#E89B55] hover:underline focus-visible:outline-2 focus-visible:outline-[#D28A4C] disabled:opacity-50';

export function WalletsEditor({ wallets }: { wallets: SavedWallets }) {
  const { link } = useWalletActions();
  const [editingSecondary, setEditingSecondary] = useState(false);
  const [pendingLink, setPendingLink] = useState<boolean | null>(null);
  const primaryRef = useRef<HTMLElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  return (
    <div className='flex min-w-0 flex-col gap-8'>
      <section
        ref={primaryRef}
        aria-labelledby='primary-wallet-heading'
        className='flex flex-col gap-8'
      >
        <header className='flex flex-col gap-2'>
          <div className='flex items-start justify-between gap-4'>
            <h1 id='primary-wallet-heading' className='text-base font-bold'>
              Carteira principal
            </h1>
            <button
              type='button'
              className={actionClass}
              onClick={() => primaryRef.current?.querySelector('input')?.focus()}
            >
              {wallets.primary ? 'Editar' : 'Adicionar'}
            </button>
          </div>
          <p className='text-sm text-[#CFB28C]'>
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </header>
        <WalletForm slot='primary' wallet={wallets.primary} />
      </section>
      <section aria-labelledby='secondary-wallet-heading' className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='secondary-wallet-heading' className='text-base font-bold'>
            Carteira secundária
          </h2>
          <div className='flex flex-wrap items-center gap-3'>
            <label className='flex items-center gap-2 text-xs'>
              <input
                type='checkbox'
                checked={pendingLink ?? wallets.secondarySameAsPrimary}
                disabled={!wallets.primary || pendingLink !== null}
                aria-busy={pendingLink !== null}
                onChange={(event) => {
                  const next = event.currentTarget.checked;
                  setPendingLink(next);
                  link.mutate(next, {
                    onSuccess: () => setEditingSecondary(false),
                    onSettled: () => setPendingLink(null),
                  });
                }}
                className='size-4 appearance-none rounded-full border border-[#D28A4C] checked:bg-[#D28A4C] checked:shadow-[inset_0_0_0_0.1875rem_#140D0A] focus-visible:outline-2 focus-visible:outline-[#D28A4C] disabled:opacity-50'
              />
              Igual à carteira principal
            </label>
            <button
              type='button'
              disabled={!wallets.primary || wallets.secondarySameAsPrimary}
              className={actionClass}
              onClick={() => {
                setEditingSecondary(true);
                requestAnimationFrame(() => secondaryRef.current?.querySelector('input')?.focus());
              }}
            >
              {wallets.secondary && !wallets.secondarySameAsPrimary ? 'Editar' : 'Adicionar'}
            </button>
          </div>
        </div>
        {wallets.secondarySameAsPrimary ? (
          <p className='text-sm text-[#CFB28C]'>Usando a carteira principal como secundária.</p>
        ) : editingSecondary ? (
          <div ref={secondaryRef} className='pt-4'>
            <WalletForm
              slot='secondary'
              wallet={wallets.secondary}
              onSaved={() => setEditingSecondary(false)}
            />
          </div>
        ) : wallets.secondary ? (
          <div className='flex flex-col gap-1 border border-[#3F2319] p-4 text-sm'>
            <p className='font-bold'>{wallets.secondary.walletAlias}</p>
            <p className='break-all text-[#CFB28C]'>{wallets.secondary.walletAddress}</p>
            <p className='text-[#B39463]'>{wallets.secondary.network}</p>
          </div>
        ) : (
          <p className='text-sm text-[#CFB28C]'>
            Você ainda não adicionou uma carteira secundária.
          </p>
        )}
      </section>
    </div>
  );
}
