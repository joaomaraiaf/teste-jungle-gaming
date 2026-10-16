import { Button } from '@/core/components/ui/button';
import { formatWeiAsEth, parseEthToWei } from '@/features/cart/domain/entities/cart-totals';
import { Link } from '@tanstack/react-router';
import type { usePaymentViewModel } from '../hooks/use-payment-view-model.hook';
export function PaymentCheckoutStatus({
  checkout,
}: { checkout: ReturnType<typeof usePaymentViewModel>['checkout'] }) {
  const order = checkout.attempt.order;
  return (
    <section
      className='space-y-3 text-sm text-[#CFB28C]'
      aria-label='Estado do pagamento'
      aria-live='polite'
    >
      {checkout.attempt.attempt ? (
        <>
          {checkout.attempt.error ? (
            <div role='alert' className='space-y-3 border border-[#D28A4C] p-4'>
              <p>
                Não foi possível consultar o resultado. Sua tentativa está salva; recupere o pedido
                antes de iniciar outra compra.
              </p>
              <Button type='button' onClick={checkout.attempt.retry}>
                Recuperar pedido
              </Button>
            </div>
          ) : order?.status === 'rejected' ? (
            <div role='alert' className='space-y-3 border border-[#D28A4C] p-4'>
              <h2 className='font-bold'>Pedido recusado</h2>
              <p>{order.rejection.message}</p>
              <Button type='button' onClick={checkout.retryRejected}>
                Revisar e tentar novamente
              </Button>
            </div>
          ) : (
            <p role='status'>
              {order?.status === 'confirmed'
                ? 'Pedido confirmado. Abrindo comprovante…'
                : checkout.attempt.isRecovering
                  ? 'Verificando o resultado da tentativa salva…'
                  : 'Pedido pendente. Aguardando confirmação da carteira…'}
            </p>
          )}
        </>
      ) : (
        <>
          {checkout.quoteError && (
            <div role='alert' className='space-y-2'>
              <p>{checkout.quoteError.message}</p>
              <Button type='button' onClick={checkout.retryQuote}>
                Atualizar cotação
              </Button>
            </div>
          )}
          {checkout.quote && checkout.quote.status !== 'valid' && (
            <div role='alert' className='space-y-3 border border-[#D28A4C] p-4'>
              <h2 className='font-bold'>
                {checkout.quote.status === 'unavailable'
                  ? 'Edição indisponível'
                  : 'A cotação mudou'}
              </h2>
              <p>
                Confira os itens, a disponibilidade, os descontos e as taxas antes de continuar.
              </p>
              <ul className='space-y-1'>
                {checkout.quote.issues.map((issue, index) => (
                  <li key={`${issue.code}:${issue.nftId}:${issue.editionId}:${index}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
              <p>Novo total: {formatWeiAsEth(parseEthToWei(checkout.quote.totals.totalEth))} ETH</p>
              {checkout.quote.status === 'review-required' ? (
                <Button type='button' disabled={checkout.accepting} onClick={checkout.accept}>
                  Revisar e aceitar novos valores
                </Button>
              ) : (
                <Link to='/cart' className='text-[#E89B55] underline'>
                  Revisar carrinho
                </Link>
              )}
            </div>
          )}
          <div className='flex flex-wrap items-center gap-3'>
            <span>
              {checkout.connected
                ? 'Carteira conectada (simulação)'
                : checkout.connection?.status === 'refused'
                  ? 'Conexão recusada'
                  : 'Carteira desconectada'}
            </span>
            <button
              type='button'
              disabled={checkout.connectionPending}
              onClick={checkout.connected ? checkout.disconnect : checkout.connect}
              className='text-[#E89B55] underline hover:text-[#F5F1EB]'
            >
              {checkout.connected ? 'Desconectar carteira' : 'Conectar carteira'}
            </button>
            <Link to='/wallets' className='text-[#E89B55] underline hover:text-[#F5F1EB]'>
              Gerenciar carteiras
            </Link>
          </div>
        </>
      )}
      {checkout.notice && <p role='alert'>{checkout.notice}</p>}
    </section>
  );
}
