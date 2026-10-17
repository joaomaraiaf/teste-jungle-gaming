import { ArtworkImage } from '@/core/components/artwork-image';
export interface JournalArticle {
  date: string;
  readingTime: string;
  title: string;
  summary: string;
  imageUrl: string;
}

interface JournalArticleCardProps {
  article: JournalArticle;
}

export function JournalArticleCard({ article }: JournalArticleCardProps) {
  return (
    <article className='overflow-hidden rounded-lg bg-[#241612]'>
      <ArtworkImage
        src={article.imageUrl}
        alt={`Imagem do artigo: ${article.title}`}
        className='h-[195px] w-full object-cover'
      />
      <div className='flex min-h-[174px] flex-col items-start gap-2 px-4 pb-4 pt-3'>
        <p className='min-h-8 text-xs font-medium leading-4 text-[#CFB28C]'>
          {article.date} <span className='px-1'>|</span> {article.readingTime}
        </p>
        <h3 className='min-h-[42px] text-base font-bold leading-[21px] text-[#F5F1EB]'>
          {article.title}
        </h3>
        <p className='min-h-8 text-xs font-medium leading-4 text-[#CFB28C]'>{article.summary}</p>
        <a
          href='#criadores'
          className='inline-flex items-center gap-1 text-xs font-bold leading-[14px] text-[#E89B55] hover:text-[#F5F1EB]'
        >
          Ler mais <span aria-hidden='true'>→</span>
        </a>
      </div>
    </article>
  );
}
