import type { Nft } from '@/features/catalog/domain/entities/nft.entity';

export interface NftReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  comment: string;
  initials: string;
}

export interface NftDetails {
  rating: string;
  reviewsCount: number;
  description: string;
  contract: string;
  royalty: string;
  royaltyDescription: string;
  attributes: string[];
  reviews: NftReview[];
}

export interface MarketNft extends Nft {
  details: NftDetails;
}
