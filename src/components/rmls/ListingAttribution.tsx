'use client';

/**
 * RMLS compliance: display listing firm name immediately adjacent to property details.
 * Required per RMLS Internet Display Policies for IDX/VOW.
 */

export interface ListingAttributionProps {
  /** Listing firm / brokerage name (from MLS) */
  listingFirmName: string;
  /** Optional: listing agent name if displaying */
  listingAgentName?: string | null;
  /** Optional class name */
  className?: string;
}

export function ListingAttribution({
  listingFirmName,
  listingAgentName,
  className = '',
}: ListingAttributionProps) {
  return (
    <div className={`listing-attribution ${className}`.trim()} role="complementary" aria-label="Listing attribution">
      <p className="listing-attribution__firm">
        <span className="listing-attribution__label">Listing provided by </span>
        <strong>{listingFirmName}</strong>
      </p>
      {listingAgentName && (
        <p className="listing-attribution__agent">
          <span className="listing-attribution__label">Listing agent: </span>
          {listingAgentName}
        </p>
      )}
    </div>
  );
}
