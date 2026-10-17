import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { useConfirmation } from '../hooks/use-confirmation.hook';
import { useReceiptViewport } from '../hooks/use-receipt-viewport.hook';
import { PaymentReceiptDetails } from './payment-receipt-details';
import { PaymentReceiptMetadata } from './payment-receipt-metadata';
import './payment-confirmation.css';

function BackToHome() {
  return (
    <Button
      asChild
      variant='outline'
      className='h-12 border-[#D28A4C] bg-transparent px-4 font-bold text-[#E89B55] hover:bg-[#38220F]'
    >
      <Link to='/' search={{ page: 1, limit: 9, search: '', sort: 'newest' }}>
        Voltar para o início
      </Link>
    </Button>
  );
}

export function PaymentConfirmationView() {
  const { receipt, isLoading, error, retry } = useConfirmation();
  const { viewportRef, sceneRef, scale } = useReceiptViewport(Boolean(receipt));

  if (isLoading || error)
    return (
      <main className='grid h-dvh w-dvw place-items-center bg-[#140D0A] p-6 text-[#F5F1EB]'>
        <section className='space-y-4 text-center' aria-live='polite'>
          {error ? (
            <>
              <p role='alert'>Não foi possível carregar o comprovante confirmado.</p>
              <Button onClick={retry}>Tentar novamente</Button>
              <BackToHome />
            </>
          ) : (
            <p role='status'>Carregando comprovante…</p>
          )}
        </section>
      </main>
    );

  if (!receipt) {
    return (
      <main className='grid h-dvh w-dvw place-items-center overflow-hidden bg-[#140D0A] p-6 text-[#F5F1EB]'>
        <section className='flex w-full max-w-[36.125rem] flex-col items-center gap-6 border-b-[0.625rem] border-[#D28A4C] bg-[#241612] p-8 text-center'>
          <h1 className='text-lg font-bold'>Nenhum pedido para exibir</h1>
          <p className='text-sm text-[#CFB28C]'>
            O resumo fica disponível após a confirmação de um pedido.
          </p>
          <BackToHome />
        </section>
      </main>
    );
  }

  return (
    <main
      ref={viewportRef}
      className='relative h-dvh w-dvw overflow-hidden bg-[#140D0A] text-[#F5F1EB]'
    >
      <div
        ref={sceneRef}
        className='receipt-scene'
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className='receipt-reveal'>
          <div aria-hidden='true' className='receipt-envelope receipt-envelope-rear'>
            <div className='receipt-envelope-back' />
          </div>
          <div aria-hidden='true' className='receipt-envelope receipt-envelope-cover'>
            <div className='receipt-envelope-flap' />
            <div className='receipt-envelope-front' />
            <div className='receipt-envelope-seal'>K</div>
          </div>
          <div className='receipt-paper-window'>
            <article
              aria-labelledby='confirmation-heading'
              className='receipt-paper w-full border-b-[0.625rem] border-[#D28A4C] bg-[#241612]'
            >
              <header className='flex min-h-40 flex-col items-center justify-center gap-4 px-6 py-6 text-center'>
                <img
                  src='/images/payment-thank-you.png'
                  alt='Thank you'
                  className='receipt-check size-20 object-contain'
                />
                <h1 id='confirmation-heading' className='text-base font-bold text-[#CFB28C]'>
                  Seus NFTs agora estão na sua carteira
                </h1>
              </header>

              <PaymentReceiptMetadata receipt={receipt} />

              <div className='flex flex-col gap-6 px-6 pb-10 pt-5 sm:px-11 sm:pb-12'>
                <PaymentReceiptDetails receipt={receipt} />
                <div className='flex flex-col items-center gap-6 border-t border-[#D28A4C] pt-6 text-center'>
                  <p id='etherscan-note' className='text-sm leading-relaxed text-[#CFB28C]'>
                    Compra confirmada na simulação. Nenhum valor foi cobrado e nenhum NFT foi
                    transferido.
                  </p>
                  <div className='flex w-full flex-col justify-center gap-3 sm:flex-row'>
                    <Button
                      type='button'
                      onClick={() =>
                        toast.info(
                          'O hash deste pedido é demonstrativo. A consulta no Etherscan estará disponível com uma transação real.'
                        )
                      }
                      aria-describedby='etherscan-note'
                      className='h-12 bg-[#D28A4C] px-4 font-bold text-[#140D0A] transition-colors hover:bg-[#E89B55]'
                    >
                      Ver no Etherscan
                    </Button>
                    <BackToHome />
                  </div>
                  <Link
                    to='/activity'
                    className='text-sm text-[#E89B55] underline underline-offset-4 hover:text-[#CFB28C]'
                  >
                    Ver atividades
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
