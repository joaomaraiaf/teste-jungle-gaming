import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartRecommendations } from './cart-recommendations';

const { useCatalogMock } = vi.hoisted(() => ({ useCatalogMock: vi.fn() }));

vi.mock('@/features/catalog/hooks/use-catalog.hook', () => ({ useCatalog: useCatalogMock }));
vi.mock('@/features/catalog/components/nft-card', () => ({
  NftCard: ({ nft }: { nft: { name: string } }) => <article>{nft.name}</article>,
}));

describe('CartRecommendations', () => {
  beforeEach(() => {
    useCatalogMock.mockImplementation(({ page }: { page: number }) => ({
      data: {
        data: [{ id: `nft-${page}`, name: `NFT recomendado da página ${page}` }],
        lastPage: 3,
      },
      isPending: false,
    }));
  });

  it('fills its available width and pages through other recommendations with dots', () => {
    render(<CartRecommendations />);

    const section = screen.getByRole('region', { name: 'Colecionadores também viram' });
    expect(section).toHaveClass('w-full');
    expect(section).toHaveClass('lg:-mx-[7.5rem]');
    expect(section).toHaveClass('lg:w-[calc(100%+15rem)]');
    expect(screen.getByText('NFT recomendado da página 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar recomendações da página 2' }));

    expect(useCatalogMock).toHaveBeenLastCalledWith({
      page: 2,
      limit: 5,
      search: '',
      sort: 'price-desc',
    });
    expect(screen.getByText('NFT recomendado da página 2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mostrar recomendações da página 2' })
    ).toHaveAttribute('aria-current', 'page');
  });
});
