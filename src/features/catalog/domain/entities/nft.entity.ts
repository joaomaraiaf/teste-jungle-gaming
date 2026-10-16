export interface Nft {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  artist: string;
  collection: string;
  category: 'art' | 'photography' | 'gaming';
  network: 'ethereum' | 'polygon' | 'solana';
  editions: Array<{
    id: string;
    name: string;
    priceEth: string;
    available: number;
  }>;
  version: number;
  updatedAt: string;
}
