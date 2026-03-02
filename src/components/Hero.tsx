'use client';

import { useState } from 'react';
import Image from 'next/image';

export type HeroVariant = 'fullscreen' | 'half' | 'short' | 'condo';

export interface HeroProps {
  title: string;
  lead?: string;
  variant?: HeroVariant;
  /** Optional background image */
  imageSrc?: string;
  /** Fallback image if imageSrc fails to load */
  imageFallbackSrc?: string;
  imageAlt?: string;
  imageSources?: Array<{ srcSet: string; media?: string }>;
  children?: React.ReactNode;
  priority?: boolean;
}

export function Hero({
  title,
  lead,
  variant = 'fullscreen',
  imageSrc,
  imageFallbackSrc,
  imageAlt = '',
  imageSources,
  children,
  priority = true,
}: HeroProps) {
  const [imgError, setImgError] = useState(false);
  const effectiveSrc = (imageSrc && !imgError ? imageSrc : imageFallbackSrc) || imageSrc;
  const heroClass = ['hero', `hero--${variant}`].filter(Boolean).join(' ');

  return (
    <section className={heroClass} aria-label="Hero">
      {effectiveSrc || (imageSources && imageSources.length > 0) ? (
        imageSources && imageSources.length > 0 ? (
          <picture className="hero-media">
            {imageSources.map((s, i) => (
              <source key={i} srcSet={s.srcSet} media={s.media} />
            ))}
            <img
              src={imageSrc ?? imageSources[imageSources.length - 1]?.srcSet.split(' ')[0] ?? ''}
              alt={imageAlt}
              fetchPriority={priority ? 'high' : undefined}
              loading={priority ? 'eager' : 'lazy'}
            />
            <span className="hero-overlay" aria-hidden />
          </picture>
        ) : effectiveSrc ? (
          <div className="hero-media">
            <Image
              src={effectiveSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority={priority}
              sizes="100vw"
              onError={() => imageFallbackSrc && setImgError(true)}
            />
            <span className="hero-overlay" aria-hidden />
          </div>
        ) : null
      ) : null}

      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title hero_header">{title}</h1>
          {lead && <p className="hero-lead tagline">{lead}</p>}
          {children && <div className="hero-actions">{children}</div>}
        </div>
      </div>
    </section>
  );
}
