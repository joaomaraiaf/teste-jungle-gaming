import { Link } from '@tanstack/react-router';
import { Check, ShoppingBag } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { formatWeiAsEth, parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { AccountPage } from '@/features/profile/components/account-page';
import type { PurchaseActivity } from '../domain/entities/purchase-activity.entity';
import { useActivity } from '../hooks/use-activity.hook';

export function ActivityView() {
  const { query, activities, isGuest, totalQuantity, totalWei } = useActivity();
  return (
    <AccountPage activeItem='activity'>
      <section className='flex min-w-0 flex-col gap-6' aria-labelledby='activity-heading'>
        <header className='space-y-2'>
          <h1 id='activity-heading' className='text-lg font-bold'>
            Atividade
          </h1>
          <p className='text-sm text-[#B39463]'>
            {isGuest
              ? 'Suas compras demonstrativas neste navegador.'
              : 'Acompanhe o histórico de compras da sua conta.'}
          </p>
        </header>
        {query.isPending ? (
          <Skeleton className='h-60 w-full' />
        ) : query.isError ? (
          <div role='alert' className='space-y-4 border border-[#3F2319] p-6'>
            <p>Não foi possível carregar suas atividades.</p>
            <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
          </div>
        ) : activities.length === 0 ? (
          <div className='flex flex-col items-center gap-5 border border-[#3F2319] bg-[#241612] px-6 py-14 text-center'>
            <ShoppingBag aria-hidden='true' className='size-10 text-[#D28A4C]' />
            <h2 className='font-bold'>Você ainda não tem atividades</h2>
            <p className='max-w-md text-sm text-[#B39463]'>
              Quando concluir uma compra, seus NFTs e os detalhes do pedido aparecerão aqui.
            </p>
            <Button asChild>
              <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
                Explorar NFTs
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <dl className='grid gap-4 sm:grid-cols-3'>
              {[
                ['Compras', activities.length],
                ['NFTs adquiridos', totalQuantity],
                ['Total em compras', `${formatWeiAsEth(totalWei)} ETH`],
              ].map(([label, value]) => (
                <div key={label} className='min-w-0 border border-[#3F2319] bg-[#241612] p-4'>
                  <dt className='text-xs text-[#B39463]'>{label}</dt>
                  <dd className='mt-2 break-words font-bold text-[#E89B55]'>{value}</dd>
                </div>
              ))}
            </dl>
            <div className='flex flex-col gap-5'>
              {activities.map((activity) => (
                <PurchaseCard key={activity.id} activity={activity} />
              ))}
            </div>
          </>
        )}
      </section>
    </AccountPage>
  );
}

function PurchaseCard({ activity }: { activity: PurchaseActivity }) {
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(activity.createdAt));
  return (
    <article
      className='min-w-0 border border-[#3F2319] bg-[#241612]'
      aria-label={`Compra de ${date}`}
    >
      <header className='flex flex-wrap items-center justify-between gap-3 border-b border-[#3F2319] p-4'>
        <div className='space-y-1'>
          <h2 className='text-sm font-bold'>Compra concluída</h2>
          <time dateTime={activity.createdAt} className='text-xs text-[#B39463]'>
            {date}
          </time>
        </div>
      </header>
      <ul className='divide-y divide-[#3F2319] px-4'>
        {activity.items.map((item) => (
          <li key={`${item.nftId}:${item.editionId}`} className='flex items-center gap-3 py-4'>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt='' className='size-14 shrink-0 rounded object-cover' />
            ) : (
              <div
                aria-hidden='true'
                className='grid size-14 shrink-0 place-items-center bg-[#38220F] text-xs'
              >
                NFT
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <Link
                to='/market/$nftId'
                params={{ nftId: item.nftId }}
                className='text-sm font-bold hover:text-[#E89B55]'
              >
                {item.name}
              </Link>
              <p className='mt-1 text-xs text-[#B39463]'>
                {item.editionName} · Quantidade: {item.quantity}
              </p>
              <p className='mt-1 text-xs text-[#CFB28C]'>
                {formatWeiAsEth(parseEthToWei(item.unitPriceEth) * BigInt(item.quantity))} ETH
              </p>
            </div>
          </li>
        ))}
      </ul>
      <dl className='grid gap-4 border-t border-[#3F2319] p-4 text-xs sm:grid-cols-2 xl:grid-cols-4'>
        <div>
          <dt className='text-[#B39463]'>ID da transação</dt>
          <dd className='mt-1' title={activity.transactionHash}>
            {activity.transactionHash.slice(0, 6)}…{activity.transactionHash.slice(-4)}
          </dd>
        </div>
        <div>
          <dt className='text-[#B39463]'>Carteira</dt>
          <dd className='mt-1'>{activity.walletName}</dd>
        </div>
        <div>
          <dt className='text-[#B39463]'>Taxa de rede estimada</dt>
          <dd className='mt-1'>{activity.estimatedFeeEth} ETH</dd>
        </div>
        <div>
          <dt className='text-[#B39463]'>Total do pedido</dt>
          <dd className='mt-1 font-bold text-[#E89B55]'>{activity.totalEth} ETH</dd>
        </div>
      </dl>
    </article>
  );
}
