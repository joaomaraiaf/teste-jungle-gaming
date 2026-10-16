import { ScrollReveal } from '@/core/components/scroll-reveal';
import { type CatalogPromotion, CatalogPromotionCard } from './catalog-promotion-card';

interface CatalogPromotionsProps {
  promotions: CatalogPromotion[];
}

export function CatalogPromotions({ promotions }: CatalogPromotionsProps) {
  return (
    <section aria-label='Destaques do marketplace' className='grid gap-12 pt-12 md:grid-cols-2'>
      {promotions.map((promotion, index) => (
        <ScrollReveal key={promotion.title} className='h-full' delayMs={index * 100}>
          <CatalogPromotionCard promotion={promotion} />
        </ScrollReveal>
      ))}
    </section>
  );
}
