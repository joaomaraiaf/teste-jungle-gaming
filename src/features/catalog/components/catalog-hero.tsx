import { ChevronRight } from 'lucide-react';
import { ArtworkImage } from '@/core/components/artwork-image';
import { ScrollReveal } from '@/core/components/scroll-reveal';
import { useCatalogHeroCarousel } from '../hooks/use-catalog-hero-carousel.hook';

export interface CatalogHeroSlide {
  imageAlt: string;
  imageUrl: string;
}

interface CatalogHeroProps {
  slides: CatalogHeroSlide[];
}

export function CatalogHero({ slides }: CatalogHeroProps) {
  const { activeSlide, goToSlide, setIsPaused } = useCatalogHeroCarousel(slides.length);

  const currentSlide = slides[activeSlide];
  const nextSlide = slides[(activeSlide + 1) % slides.length];
  if (!currentSlide) return null;

  return (
    <section
      id='inicio'
      className='relative isolate flex min-h-[12rem] flex-col items-center justify-center overflow-hidden rounded-[1.875rem] bg-[linear-gradient(130deg,#754a27_0%,#3c281b_56%,#241612_100%)] px-4 pb-8 pt-4 lg:min-h-[28.125rem] lg:rounded-none lg:bg-transparent lg:bg-none lg:px-0 lg:py-10'
      aria-labelledby='hero-title'
      aria-roledescription='carrossel'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className='relative z-10 flex w-full flex-row items-center justify-between gap-2 lg:gap-10'>
        <div className='flex min-w-0 flex-[1.15] flex-col items-start gap-2 lg:max-w-[37.5rem] lg:gap-8'>
          <div className='flex flex-col gap-1.5 lg:gap-2'>
            <p className='text-xs font-medium text-[#F5F1EB] lg:text-sm lg:uppercase lg:tracking-[0.1em]'>
              Bem-vindo à Kurio
            </p>
            <h1
              id='hero-title'
              className='text-[1.0625rem] font-bold leading-[1.55] text-[#F5F1EB] lg:text-[2.6875rem] lg:leading-[1.63]'
            >
              <span className='lg:hidden'>SEJA DONO DA CULTURA DIGITAL</span>
              <span className='hidden lg:inline'>
                OWN THE FUTURE OF
                <br />
                DIGITAL ART
              </span>
            </h1>
            <p className='max-w-[34.8125rem] text-xs leading-[1.45] text-[#CFB28C] lg:text-sm lg:leading-6'>
              <span className='lg:hidden'>
                Descubra NFTs selecionados de criadores do mundo todo.
              </span>
              <span className='hidden lg:inline'>
                Discover curated NFTs from emerging and established creators. Collect rare digital
                pieces that speak to you.
              </span>
            </p>
          </div>
          <a
            href='#catalogo'
            className='inline-flex items-center justify-center gap-2 text-xs font-bold text-[#E89B55] transition-colors duration-200 hover:text-[#F5B26D] motion-reduce:transition-none lg:h-10 lg:rounded-md lg:bg-[#D28A4C] lg:px-7 lg:text-base lg:text-[#140D0A] lg:hover:bg-[#E89B55] lg:hover:text-[#140D0A]'
          >
            EXPLORAR <ChevronRight aria-hidden='true' className='size-4 lg:size-[1.0625rem]' />
          </a>
        </div>
        <ScrollReveal className='hero-art relative mt-0 aspect-square w-[40%] max-w-[12rem] shrink-0 overflow-visible rounded-[1rem] bg-[#241612] lg:mt-0 lg:size-[min(31vw,28.125rem)] lg:w-[min(31vw,28.125rem)] lg:min-h-[18.75rem] lg:max-w-[28.125rem] lg:overflow-hidden lg:rounded-[1.5rem]'>
          {slides.map((slide, index) => (
            <ArtworkImage
              key={slide.imageUrl}
              src={slide.imageUrl}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              alt={slide.imageAlt}
              sizes='(max-width: 1023px) 40vw, min(31vw, 28.125rem)'
              aria-hidden={activeSlide !== index}
              className={`absolute inset-0 h-full w-full rounded-[1rem] object-cover transition-[opacity,transform] duration-700 ease-in-out motion-reduce:transition-none lg:rounded-none ${
                activeSlide === index ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
              }`}
            />
          ))}
          {nextSlide && (
            <div className='absolute -bottom-2 -left-3 z-10 size-[4.5rem] overflow-hidden rounded-[1rem] border-2 border-[#F5F1EB] bg-[#241612] lg:hidden'>
              <ArtworkImage
                src={nextSlide.imageUrl}
                alt=''
                aria-hidden='true'
                className='size-full object-cover'
              />
            </div>
          )}
        </ScrollReveal>
      </div>
      <div
        role='group'
        className='absolute bottom-3 left-0 z-10 flex w-full justify-center gap-2 lg:relative lg:bottom-auto lg:left-auto lg:mt-8'
        aria-label={`Slide ${activeSlide + 1} de ${slides.length}`}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.imageUrl}
            type='button'
            aria-label={`Mostrar slide ${index + 1}`}
            aria-pressed={activeSlide === index}
            onClick={() => goToSlide(index)}
            className='grid h-6 min-w-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E89B55]'
          >
            <span
              aria-hidden='true'
              className={`block h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${activeSlide === index ? 'w-6 bg-[#D28A4C]' : 'w-2 bg-[#D28A4C]/40'}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
