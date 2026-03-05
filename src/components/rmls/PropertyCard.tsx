'use client';

/**
 * RMLS-compliant property card for IDX/VOW listing grids.
 * Displays listing_firm_name immediately adjacent to property details per RMLS policy.
 */

import Link from 'next/link';
import { ListingAttribution } from './ListingAttribution';

export interface PropertyCardListing {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  status: string;
  listingFirmName: string;
  listingAgentName?: string | null;
  imageUrl?: string | null;
  detailUrl: string;
}

export interface PropertyCardProps {
  listing: PropertyCardListing;
  className?: string;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
}

export function PropertyCard({ listing, className = '' }: PropertyCardProps) {
  const location = [listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(', ');

  return (
    <article className={`property-card property-card--idx ${className}`.trim()}>
      {listing.imageUrl && (
        <Link href={listing.detailUrl} className="property-card__image-link">
          <img
            src={listing.imageUrl}
            alt=""
            width={400}
            height={260}
            className="property-card__image"
          />
        </Link>
      )}
      <div className="property-card__body">
        {listing.price != null && (
          <p className="property-card__price">{formatPrice(listing.price)}</p>
        )}
        <p className="property-card__address">{location || listing.address}</p>
        <dl className="property-card__specs">
          {listing.beds != null && (
            <>
              <dt>Beds</dt>
              <dd>{listing.beds}</dd>
            </>
          )}
          {listing.baths != null && (
            <>
              <dt>Baths</dt>
              <dd>{listing.baths}</dd>
            </>
          )}
          {listing.sqft != null && (
            <>
              <dt>Sq ft</dt>
              <dd>{listing.sqft.toLocaleString()}</dd>
            </>
          )}
        </dl>
        {/* RMLS: listing firm name immediately adjacent to property details */}
        <ListingAttribution
          listingFirmName={listing.listingFirmName}
          listingAgentName={listing.listingAgentName}
          className="property-card__attribution"
        />
        <Link href={listing.detailUrl} className="button button--outline property-card__link">
          View details
        </Link>
      </div>
    </article>
  );
}
