import { useCallback, useEffect, useState } from 'react';

const SLIDE_INTERVAL_MS = 6000;

export function useCatalogHeroCarousel(slideCount: number) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (slideCount < 2 || isPaused || reducedMotion) return;

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % slideCount);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, reducedMotion, slideCount]);

  const goToSlide = useCallback(
    (slideIndex: number) => {
      setActiveSlide(((slideIndex % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  return {
    activeSlide,
    goToSlide,
    isPaused,
    setIsPaused,
  };
}
