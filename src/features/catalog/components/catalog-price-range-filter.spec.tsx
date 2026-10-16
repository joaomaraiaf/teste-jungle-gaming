import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogPriceRangeFilter } from './catalog-price-range-filter';

describe('CatalogPriceRangeFilter', () => {
  it('applies the selected ETH range and leaves default boundaries unfiltered', () => {
    const onApply = vi.fn();
    render(<CatalogPriceRangeFilter onApply={onApply} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Preço mínimo em ETH' }), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Preço máximo em ETH' }), {
      target: { value: '30' },
    });

    expect(screen.getByText('0,25 - 0,30 ETH')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith({ minPriceEth: '0.25', maxPriceEth: '0.30' });
  });

  it('does not add query filters when the full price range is selected', () => {
    const onApply = vi.fn();
    render(<CatalogPriceRangeFilter onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith({ minPriceEth: undefined, maxPriceEth: undefined });
  });
});
