import { ScrollReveal } from '@/core/components/scroll-reveal';
import { type JournalArticle, JournalArticleCard } from './journal-article-card';

interface CatalogJournalProps {
  articles: JournalArticle[];
}

export function CatalogJournal({ articles }: CatalogJournalProps) {
  return (
    <section
      id='criadores'
      className='flex flex-col gap-12 py-12'
      aria-labelledby='journal-heading'
    >
      <header className='flex flex-col gap-2 text-center'>
        <h2 id='journal-heading' className='text-[28px] font-bold leading-[37px]'>
          Diário da Cunhagem
        </h2>
        <p className='text-sm leading-[18px] text-[#CFB28C]'>
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <div className='grid gap-12 sm:grid-cols-2 xl:grid-cols-4'>
        {articles.map((article, index) => (
          <ScrollReveal key={article.title} className='h-full' delayMs={index * 100}>
            <JournalArticleCard article={article} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
