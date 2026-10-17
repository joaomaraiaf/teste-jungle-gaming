import { useLayoutEffect, useRef, useState } from 'react';

export function useReceiptViewport(hasReceipt: boolean) {
  const viewportRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    if (!viewport || !scene) return;

    const resize = () => {
      const margin = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 2;
      // Reserve headroom for the paper to clear the stationary envelope.
      setScale(Math.min(1, (viewport.clientHeight - margin) / (scene.offsetHeight * 1.28)));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    observer.observe(scene);
    resize();
    return () => observer.disconnect();
  }, [hasReceipt]);

  return { viewportRef, sceneRef, scale };
}
