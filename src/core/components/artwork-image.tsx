import type { ImgHTMLAttributes } from 'react';

/** Responsive derivatives exist only for the four bundled artworks; uploaded avatars stay intact. */
export function ArtworkImage({
  src,
  alt = '',
  sizes = '(max-width: 767px) 90vw, (max-width: 1023px) 60vw, 36rem',
  loading = 'lazy',
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const responsive = src && /^\/images\/[a-f0-9]{40}\.webp$/.test(src);
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      srcSet={
        responsive
          ? `${src.replace('.webp', '-256.webp')} 256w, ${src.replace('.webp', '-512.webp')} 512w, ${src} 1024w`
          : undefined
      }
      sizes={responsive ? sizes : undefined}
      loading={loading}
      decoding='async'
    />
  );
}
