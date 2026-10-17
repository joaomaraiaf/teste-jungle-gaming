import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogHero } from './catalog-hero';

const slides = [
  { imageUrl: '/images/one.png', imageAlt: 'Arte um' },
  { imageUrl: '/images/two.png', imageAlt: 'Arte dois' },
  { imageUrl: '/images/three.png', imageAlt: 'Arte três' },
];

describe('CatalogHero', () => {
  afterEach(() => vi.useRealTimers());

  it('allows selecting a slide using only the centered dots', () => {
    render(<CatalogHero slides={slides} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar slide 2' }));
    expect(screen.getByRole('button', { name: 'Mostrar slide 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar slide 3' }));
    expect(screen.getByRole('button', { name: 'Mostrar slide 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    expect(screen.queryByRole('button', { name: 'Slide anterior' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próximo slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pausar slides' })).not.toBeInTheDocument();
  });

  it('advances automatically and pauses while the pointer is over the hero', () => {
    vi.useFakeTimers();
    render(<CatalogHero slides={slides} />);

    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('button', { name: 'Mostrar slide 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    const hero = screen.getByRole('region');
    fireEvent.mouseEnter(hero);
    act(() => vi.advanceTimersByTime(12000));
    expect(screen.getByRole('button', { name: 'Mostrar slide 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.mouseLeave(hero);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('button', { name: 'Mostrar slide 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
