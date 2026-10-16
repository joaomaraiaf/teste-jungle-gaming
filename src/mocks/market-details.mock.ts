import type { NftDetails } from '@/features/market/domain/entities/market-nft.entity';
export const NFT_DETAIL_PRESENTATION = {
  rating: '5.0',
  reviewsCount: 19,
  description:
    'Cada atributo fica armazenado nos metadados do token. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras. A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede.',
  contract: '0x7A42...19E8',
  royalty: 'O artista recebe 5% de direitos autorais nas vendas secundárias.',
  attributes: ['Óculos', 'Esmeralda', 'Raro'],
} as const;

export const NFT_DETAIL_REVIEWS = [
  {
    id: 'review-1',
    author: 'Marina Costa',
    date: '15 de setembro',
    rating: 5,
    comment: 'Uma peça incrível. Os detalhes e as cores ficam ainda melhores em alta resolução.',
    initials: 'MC',
  },
  {
    id: 'review-2',
    author: 'Rafael Lima',
    date: '12 de setembro',
    rating: 5,
    comment: 'A arte chegou com procedência verificada e o processo de compra foi simples.',
    initials: 'RL',
  },
  {
    id: 'review-3',
    author: 'Bianca Alves',
    date: '8 de setembro',
    rating: 4,
    comment: 'Ótimo trabalho do artista e uma coleção muito bem construída.',
    initials: 'BA',
  },
] as const;

export function createNftDetails(): NftDetails {
  return {
    ...NFT_DETAIL_PRESENTATION,
    attributes: [...NFT_DETAIL_PRESENTATION.attributes],
    royaltyDescription:
      'Creator royalty: 5% on secondary sales, paid automatically by supported marketplaces.',
    reviews: NFT_DETAIL_REVIEWS.map((review) => ({ ...review })),
  };
}
