'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface FeaturedListingCardProps {
  mlsId: string;
  href: string;
  imageSrc: string;
  imageAlt?: string;
  location: string;
  address: string;
  tagline?: string;
  details?: string;
  /** Lazy load image when not above the fold */
  priority?: boolean;
}

export function FeaturedListingCard({
  mlsId,
  href,
  imageSrc,
  imageAlt = '',
  location,
  address,
  tagline,
  details,
  priority = false,
}: FeaturedListingCardProps) {
  return (
    <article className="featured-listing-block property-card">
      <Link href={href} className="listing-image-wrap" aria-label={`Explore listing ${address}`}>
        <Image
          src={imageSrc}
          alt={imageAlt || address}
          width={640}
          height={480}
          sizes="(max-width: 768px) 100vw, 320px"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          className="listing-image"
        />
        <span className="listing-explore-overlay">
          <span className="button button--white">Explore Listing</span>
        </span>
      </Link>
      <div className="listing-info">
        <span className="listing-location">MLS #{mlsId}</span>
        <h2 className="listing-address listing-tagline">
          <Link href={href}>{address}</Link>
        </h2>
        {tagline && <p className="listing-tagline">{tagline}</p>}
        {details && <p className="listing-specs listing-details">{details}</p>}
      </div>
    </article>
  );
}
