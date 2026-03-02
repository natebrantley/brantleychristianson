'use client';

import { useState } from 'react';
import Image from 'next/image';
import { assetPaths } from '@/config/theme';

const DEFAULT_FALLBACK = `${assetPaths.stock}/living.jpeg`;

export interface CondoImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function CondoImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
}: CondoImageWithFallbackProps) {
  const [useFallback, setUseFallback] = useState(false);
  const effectiveSrc = !src || useFallback ? fallbackSrc : src;
  const resolvedSizes = sizes ?? (fill ? '100vw' : undefined);

  if (fill) {
    return (
      <Image
        src={effectiveSrc}
        alt={alt}
        fill
        sizes={resolvedSizes}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      width={width ?? 400}
      height={height ?? 250}
      sizes={resolvedSizes}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      priority={priority}
      onError={() => setUseFallback(true)}
    />
  );
}
