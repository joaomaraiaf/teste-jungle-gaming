import { ArtworkImage } from '@/core/components/artwork-image';
import { Heart } from 'lucide-react';

interface NftGalleryProps {
  name: string;
  images: string[];
  selectedImage: number;
  isFavorite: boolean;
  onSelectImage: (index: number) => void;
  onToggleFavorite: () => void;
}

export function NftGallery({
  name,
  images,
  selectedImage,
  isFavorite,
  onSelectImage,
  onToggleFavorite,
}: NftGalleryProps) {
  const currentImage = images[selectedImage] ?? images[0];
  const thumbnails = currentImage
    ? Array.from({ length: 4 }, (_, index) => ({
        index,
        image: images.length > 1 ? (images[index] ?? currentImage) : currentImage,
      }))
    : [];

  return (
    <section
      className='flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-7 lg:w-[573px]'
      aria-label='Galeria do NFT'
    >
      {thumbnails.length > 0 && (
        <div className='order-2 flex w-full gap-3 overflow-x-auto sm:order-1 sm:w-[100px] sm:flex-col sm:overflow-visible'>
          {thumbnails.map(({ image, index }) => (
            <button
              key={index}
              type='button'
              onClick={() => onSelectImage(index)}
              aria-label={`Ver imagem ${index + 1} de ${thumbnails.length}`}
              aria-pressed={selectedImage === index}
              className={`size-[76px] shrink-0 overflow-hidden rounded-lg border bg-[#241612] p-1 transition sm:size-[100px] ${selectedImage === index ? 'border-[#D28A4C]' : 'border-transparent hover:border-[#55321F]'}`}
            >
              <ArtworkImage
                src={image}
                sizes='6.25rem'
                alt=''
                className='h-full w-full rounded-md object-cover'
              />
            </button>
          ))}
        </div>
      )}
      <div className='nft-art relative order-1 aspect-square w-full max-w-[444px] rounded-md bg-[#241612] sm:order-2'>
        <div className='absolute inset-4 overflow-hidden rounded-[24px]'>
          {currentImage ? (
            <ArtworkImage
              src={currentImage}
              loading='eager'
              fetchPriority='high'
              sizes='(max-width: 767px) 90vw, 28rem'
              alt={`${name}, arte digital colecionável`}
              className='size-full object-cover'
            />
          ) : (
            <div className='grid size-full place-items-center bg-[#2F1D15] text-sm text-[#B39463]'>
              {name}
            </div>
          )}
        </div>
        <button
          type='button'
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
          className='absolute right-7 top-7 grid size-[38px] place-items-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#F5F1EB] hover:text-[#E89B55]'
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </section>
  );
}
