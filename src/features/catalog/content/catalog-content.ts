import type { CatalogHeroSlide } from '../components/catalog-hero';
import type { CatalogQuery } from '../domain/usecases/list-nfts.usecase';
const artwork = [
  '/images/2986a7cb16d09de8970824d2dd58bf0bb021702c.webp',
  '/images/87580f2def9af0ce13f4b6f6ce17bb2449bcfc16.webp',
  '/images/9df2ff42dd27ba657621c304557d1a855a4be6a5.webp',
  '/images/8459204731e6eba9d474cbc8ebc37071360d3ba5.webp',
] as const;
export const CATALOG_FEATURED_IMAGE = artwork[2];
export const CATALOG_TABS: { label: string; sort: CatalogQuery['sort'] }[] = [
  { label: 'Todos os NFTs', sort: 'newest' },
  { label: 'Novos lançamentos', sort: 'newest' },
  { label: 'Em alta', sort: 'price-desc' },
];

export const CATALOG_HERO_SLIDES: CatalogHeroSlide[] = [
  {
    imageUrl: artwork[3],
    imageAlt: 'Macaco colecionável usando óculos escuros e jaqueta verde',
  },
  {
    imageUrl: artwork[0],
    imageAlt: 'Macaco colecionável de barba usando blazer claro',
  },
  {
    imageUrl: artwork[1],
    imageAlt: 'Macaco colecionável ruivo usando fones de ouvido',
  },
  {
    imageUrl: artwork[2],
    imageAlt: 'Macaco colecionável usando chapéu e moletom roxo',
  },
];

export const CATALOG_PROMOTIONS = [
  {
    title: 'Limited-edition genesis drops',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    action: 'Explorar agora',
    imageUrl: artwork[2],
    imageAlt: 'Arte de um macaco colecionável com blazer claro',
  },
  {
    title: 'Discover emerging creators',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    action: 'Conhecer artistas',
    imageUrl: artwork[1],
    imageAlt: 'Arte de um macaco colecionável usando fones de ouvido',
  },
];

export const JOURNAL_ARTICLES = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    imageUrl: artwork[2],
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    imageUrl: artwork[3],
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    imageUrl: artwork[0],
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    imageUrl: artwork[1],
  },
];
