'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface PropertyCardProps {
  name: string;
  href: string;
  imageSrc: string;
  imageAlt?: string;
}

export function PropertyCard({ name, href, imageSrc, imageAlt }: PropertyCardProps) {
  return (
    <Link href={href} className="property-card property-card--condo" aria-label={`View ${name}`}>
      <span className="property-card-image-wrap">
        <Image
          src={imageSrc}
          alt={imageAlt ?? name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
        />
      </span>
      <span className="property-card-title">{name}</span>
    </Link>
  );
}
