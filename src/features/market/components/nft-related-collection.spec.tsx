import type { Nft } from '@/features/catalog/domain/entities/nft.entity';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NftRelatedCollection } from './nft-related-collection';

const { useMarketCollectionMock } = vi.hoisted(() => ({ useMarketCollectionMock: vi.fn() }));

vi.mock('../hooks/use-market-collection.hook', () => ({
  useMarketCollection: useMarketCollectionMock,
}));
vi.mock('./market-collection-card', () => ({
  MarketCollectionCard: ({ nft }: { nft: Nft }) => <article>{nft.name}</article>,
}));

const currentNft: Nft = {
  id: 'nft-001',
  name: 'NFT atual',
  description: '',
  imageUrl: null,
  artist: 'Artista',
  collection: 'Kurio Apes',
  category: 'art',
  network: 'ethereum',
  editions: [],
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('NftRelatedCollection', () => {
  beforeEach(() => {
    useMarketCollectionMock.mockReturnValue({
      data: Array.from({ length: 11 }, (_, index) => ({
        ...currentNft,
        id: `nft-${String(index + 1).padStart(3, '0')}`,
        name: `NFT ${index + 1}`,
      })),
      isPending: false,
    });
  });

  it('shows dots to browse other NFTs in the collection', () => {
    render(<NftRelatedCollection nft={currentNft} />);

    expect(screen.getByText('NFT 2')).toBeInTheDocument();
    expect(screen.queryByText('NFT 7')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar itens da coleção da página 2' }));

    expect(screen.queryByText('NFT 2')).not.toBeInTheDocument();
    expect(screen.getByText('NFT 7')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mostrar itens da coleção da página 2' })
    ).toHaveAttribute('aria-current', 'page');
  });
});
