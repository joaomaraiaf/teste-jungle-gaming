export interface CartItem {
  nftId: string;
  name: string;
  imageUrl: string | null;
  collection: string;
  tokenId: string;
  editionId: string;
  editionName: string;
  unitPriceEth: string;
  quantity: number;
  available: number;
}

export function getCartItemKey(item: Pick<CartItem, 'nftId' | 'editionId'>) {
  return `${item.nftId}:${item.editionId}`;
}
