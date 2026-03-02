'use client';

import Image from 'next/image';

export type HeroVariant = 'fullscreen' | 'half' | 'short' | 'condo';

export interface HeroProps {
  title: string;
  lead?: string;
  variant?: HeroVariant;
  /** Optional background image – use native <picture> for art direction or Next Image for optimization */
  imageSrc?: string;
  imageAlt?: string;
  /** For picture: multiple sources e.g. [{ srcSet: '/media/img/hero-mobile.jpg', media: '(max-width: 768px)' }, { srcSet: '/media/img/hero.jpg' }] */
  imageSources?: Array<{ srcSet: string; media?: string }>;
  children?: React.ReactNode;
  priority?: boolean;
}

export function Hero({
  title,
  lead,
  variant = 'fullscreen',
  imageSrc,
  imageAlt = '',
  imageSources,
  children,
  priority = true,
}: HeroProps) {
  const heroClass = ['hero', `hero--${variant}`].filter(Boolean).join(' ');

  return (
    <section className={heroClass} aria-label="Hero">
      {imageSrc || (imageSources && imageSources.length > 0) ? (
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
        ) : imageSrc ? (
          <div className="hero-media">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority={priority}
              sizes="100vw"
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
