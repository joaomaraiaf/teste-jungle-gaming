import { Heart, Linkedin, Mail, Minus, Plus, ShoppingCart, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import type { MarketNft } from '../domain/entities/market-nft.entity';

interface NftPurchasePanelProps {
  nft: MarketNft;
  selectedEditionId: string;
  selectedEdition?: MarketNft['editions'][number];
  quantity: number;
  isFavorite: boolean;
  onSelectEdition: (id: string) => void;
  onSetQuantity: (quantity: number) => void;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
}

export function NftPurchasePanel({
  nft,
  selectedEditionId,
  selectedEdition,
  quantity,
  isFavorite,
  onSelectEdition,
  onSetQuantity,
  onToggleFavorite,
  onAddToCart,
}: NftPurchasePanelProps) {
  const [pageUrl, setPageUrl] = useState(`/market/${encodeURIComponent(nft.id)}`);
  useEffect(() => {
    setPageUrl(window.location.href);
  }, [nft.id]);
  const tokenId = nft.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id;
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(nft.name)}`;

  return (
    <section
      className='flex min-w-0 flex-1 flex-col gap-4'
      aria-label='Informações e compra do NFT'
    >
      <div className='flex flex-col gap-3'>
        <h1 className='text-2xl font-bold leading-tight text-[#F5F1EB] sm:text-[28px]'>
          {nft.name}
        </h1>
        <div className='grid min-h-8 grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 border-b border-[#3F2319] pb-3'>
          <p className='whitespace-nowrap text-[22px] font-bold text-[#E89B55]'>
            {selectedEdition?.priceEth ?? '—'} ETH
          </p>
          <p
            role='img'
            className='flex w-full min-w-0 flex-wrap items-center justify-end gap-2 text-right text-xs leading-4 text-[#CFB28C]'
            aria-label={`Avaliação ${nft.details.rating} de 5, ${nft.details.reviewsCount} avaliações`}
          >
            <span className='tracking-[0.08em] text-[#D28A4C]' aria-hidden='true'>
              ★★★★★
            </span>
            <span>{nft.details.reviewsCount} avaliações de colecionadores</span>
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <h2 className='text-[15px] font-bold'>Sobre este NFT:</h2>
        <p className='text-sm leading-5 text-[#CFB28C]'>
          Um colecionável digital finalizado à mão da coleção {nft.collection}, verificado na rede{' '}
          {nft.network}, com arte desbloqueável e acesso para colecionadores.
        </p>
      </div>

      <div role='group' aria-label='Edição' className='flex flex-col gap-2'>
        <p className='text-[15px] font-bold'>Edição:</p>
        <div className='flex min-h-8 flex-wrap items-center gap-2'>
          {nft.editions.map((edition) => (
            <button
              key={edition.id}
              type='button'
              aria-pressed={selectedEditionId === edition.id}
              disabled={edition.available === 0}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onSelectEdition(edition.id)}
              className={`h-8 whitespace-nowrap rounded-full border px-3 text-xs leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selectedEditionId === edition.id ? 'border-[#D28A4C] text-[#E89B55]' : 'border-[#3F2319] text-[#CFB28C] hover:border-[#D28A4C]'}`}
            >
              {edition.name}
            </button>
          ))}
        </div>
      </div>

      <div className='flex w-full flex-wrap items-center gap-4'>
        <div role='group' className='flex items-center gap-3' aria-label='Quantidade'>
          <Button
            type='button'
            aria-label='Diminuir quantidade'
            disabled={quantity <= 1}
            onClick={() => onSetQuantity(Math.max(1, quantity - 1))}
            className='size-9 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55]'
          >
            <Minus size={16} />
          </Button>
          <span className='min-w-4 text-center'>{quantity}</span>
          <Button
            type='button'
            aria-label='Aumentar quantidade'
            disabled={!selectedEdition || quantity >= selectedEdition.available}
            onClick={() =>
              onSetQuantity(Math.min(selectedEdition?.available ?? quantity, quantity + 1))
            }
            className='size-9 rounded-full bg-[#D28A4C] p-0 text-[#140D0A] hover:bg-[#E89B55]'
          >
            <Plus size={16} />
          </Button>
        </div>
        <div className='ml-auto flex flex-wrap justify-end gap-2'>
          <Button
            type='button'
            disabled={!selectedEdition || selectedEdition.available === 0}
            onClick={onAddToCart}
            className='h-10 w-40 shrink-0 bg-[#D28A4C] font-bold text-[#140D0A] hover:bg-[#E89B55]'
          >
            <ShoppingCart size={16} /> Comprar
          </Button>
          <Button
            type='button'
            variant='outline'
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
            className='h-10 w-40 shrink-0 border-[#D28A4C] bg-transparent text-[#E89B55] hover:bg-[#241612]'
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />{' '}
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-1.5 mt-4 text-sm leading-5 text-[#B39463]'>
        <p>ID do token: #{tokenId}</p>
        <p>Coleção: {nft.collection}</p>
        <p>Atributos: {nft.details.attributes.join(', ')}</p>
        <div className='flex flex-wrap items-center gap-3 text-[#F5F1EB]'>
          <span className='font-bold'>Compartilhar este NFT:</span>
          <a
            href={shareUrl}
            target='_blank'
            rel='noreferrer'
            aria-label='Compartilhar no LinkedIn'
            className='hover:text-[#E89B55]'
          >
            <Linkedin size={15} />
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(pageUrl)}`}
            aria-label='Compartilhar por e-mail'
            className='hover:text-[#E89B55]'
          >
            <Mail size={16} />
          </a>
          <a
            href={twitterUrl}
            target='_blank'
            rel='noreferrer'
            aria-label='Compartilhar no Twitter'
            className='hover:text-[#E89B55]'
          >
            <Twitter size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
