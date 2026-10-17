import { navigateTabList } from '@/core/lib/tab-keyboard';
import type { NftDetails } from '../domain/entities/market-nft.entity';

interface NftDescriptionProps {
  details: NftDetails;
  name: string;
  collection: string;
  network: string;
  activeTab: 'details' | 'reviews';
  onChangeTab: (tab: 'details' | 'reviews') => void;
}

export function NftDescription({
  details,
  name,
  collection,
  network,
  activeTab,
  onChangeTab,
}: NftDescriptionProps) {
  return (
    <section aria-label='Descrição e avaliações' className='flex flex-col gap-5'>
      <div
        className='flex flex-wrap gap-x-8 gap-y-4 border-b border-[#D28A4C]/70'
        role='tablist'
        onKeyDown={navigateTabList}
        aria-label='Informações do NFT'
      >
        <button
          type='button'
          role='tab'
          tabIndex={activeTab === 'details' ? 0 : -1}
          aria-selected={activeTab === 'details'}
          onClick={() => onChangeTab('details')}
          className={`border-b-2 px-0 pb-3 text-left text-base sm:text-[17px] ${activeTab === 'details' ? 'border-[#D28A4C] font-bold text-[#E89B55]' : 'border-transparent text-[#F5F1EB]'}`}
        >
          Detalhes do NFT
        </button>
        <button
          type='button'
          role='tab'
          tabIndex={activeTab === 'reviews' ? 0 : -1}
          aria-selected={activeTab === 'reviews'}
          onClick={() => onChangeTab('reviews')}
          className={`border-b-2 px-0 pb-3 text-left text-base sm:text-[17px] ${activeTab === 'reviews' ? 'border-[#D28A4C] font-bold text-[#E89B55]' : 'border-transparent text-[#F5F1EB]'}`}
        >
          Avaliações de colecionadores ({details.reviewsCount})
        </button>
      </div>
      {activeTab === 'details' ? (
        <div role='tabpanel' className='flex flex-col gap-3 text-sm leading-6 text-[#CFB28C]'>
          <p>
            {name} é uma obra digital finalizada à mão da coleção {collection}.{' '}
            {details.description} {details.royalty}
          </p>
          <p>
            <strong className='text-[#F5F1EB]'>Rede:</strong>
            <br />
            Cunhado na rede {network} com procedência imutável e metadados armazenados no IPFS.
          </p>
          <p>
            <strong className='text-[#F5F1EB]'>Contrato:</strong>
            <br />
            {details.contract} · Contrato inteligente ERC-721 verificado.
          </p>
          <p>
            <strong className='text-[#F5F1EB]'>Direitos autorais:</strong>
            <br />
            {details.royaltyDescription}
          </p>
        </div>
      ) : (
        <div role='tabpanel' className='grid gap-4 md:grid-cols-2'>
          {details.reviews.map((review) => (
            <article key={review.id} className='border border-[#3F2319] bg-[#241612] p-5 text-sm'>
              <div className='flex items-center gap-3'>
                <span
                  aria-hidden='true'
                  className='grid size-10 place-items-center rounded-full bg-[#D28A4C] font-bold text-[#140D0A]'
                >
                  {review.initials}
                </span>
                <div>
                  <h3 className='font-bold text-[#F5F1EB]'>{review.author}</h3>
                  <p className='text-xs text-[#B39463]'>{review.date}</p>
                </div>
                <span
                  role='img'
                  className='ml-auto tracking-widest text-[#D28A4C]'
                  aria-label={`${review.rating} de 5 estrelas`}
                >
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <p className='mt-4 leading-6 text-[#CFB28C]'>{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
