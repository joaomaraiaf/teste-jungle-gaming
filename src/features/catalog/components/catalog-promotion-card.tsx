import { ArtworkImage } from '@/core/components/artwork-image';
import { ChevronRight } from 'lucide-react';

export interface CatalogPromotion {
  title: string;
  description: string;
  action: string;
  imageUrl: string;
  imageAlt: string;
}

interface CatalogPromotionCardProps {
  promotion: CatalogPromotion;
}

export function CatalogPromotionCard({ promotion }: CatalogPromotionCardProps) {
  return (
    <article className='relative grid min-h-[22rem] grid-cols-2 items-center overflow-hidden rounded-[24px] bg-[#241612]'>
      <ArtworkImage
        src={promotion.imageUrl}
        alt={promotion.imageAlt}
        className='absolute inset-y-0 left-0 h-full rounded-r-[24px] w-1/2 object-cover'
      />
      <div className='col-start-2 flex flex-col items-end px-4 text-right sm:px-5'>
        <h2 className='text-base font-bold leading-5 sm:text-lg sm:leading-6'>{promotion.title}</h2>
        <p className='mt-2 text-xs leading-4 text-[#CFB28C] sm:text-sm sm:leading-5'>
          {promotion.description}
        </p>
        <a
          href='#catalogo'
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#D28A4C] px-7 text-base font-bold text-[#140D0A] transition-colors duration-200 hover:bg-[#E89B55] motion-reduce:transition-none'
        >
          EXPLORAR <ChevronRight size={17} />
        </a>
      </div>
    </article>
  );
}
