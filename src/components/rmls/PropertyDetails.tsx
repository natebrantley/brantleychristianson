'use client';

/**
 * RMLS-compliant property details layout for a single listing.
 * Renders listing_firm_name (ListingAttribution) at top of details and RMLSDisclaimer at bottom.
 * Use on any page that displays full MLS listing data (IDX/VOW).
 */

import { ListingAttribution } from './ListingAttribution';
import { RMLSDisclaimer } from './RMLSDisclaimer';

export interface PropertyDetailsListing {
  listingFirmName: string;
  listingAgentName?: string | null;
}

export interface PropertyDetailsProps {
  /** Listing attribution (required for RMLS) */
  listing: PropertyDetailsListing;
  /** Brokerage name for disclaimer (e.g. Brantley Christianson Real Estate) */
  brokerageName?: string;
  children: React.ReactNode;
  className?: string;
}

export function PropertyDetails({
  listing,
  brokerageName,
  children,
  className = '',
}: PropertyDetailsProps) {
  return (
    <div className={`property-details property-details--idx ${className}`.trim()}>
      {/* RMLS: listing firm name immediately adjacent to property details */}
      <ListingAttribution
        listingFirmName={listing.listingFirmName}
        listingAgentName={listing.listingAgentName}
      />
      <div className="property-details__content">
        {children}
      </div>
      {/* RMLS: disclaimer at bottom of property details page */}
      <RMLSDisclaimer brokerageName={brokerageName} />
    </div>
  );
}
