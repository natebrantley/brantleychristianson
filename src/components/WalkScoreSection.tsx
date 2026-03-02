'use client';

import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export interface WalkScoreSectionProps {
  address: string;
  buildingName: string;
}

function buildFullAddress(address: string): string {
  return `${address}, Portland, OR`;
}

/** Walk Score search URL – user can search for the address on their site. */
const WALKSCORE_SEARCH = 'https://www.walkscore.com/';

export function WalkScoreSection({ address, buildingName }: WalkScoreSectionProps) {
  const fullAddress = buildFullAddress(address);
  const searchUrl = `${WALKSCORE_SEARCH}?address=${encodeURIComponent(fullAddress)}`;
  const pathname = usePathname();

  return (
    <section className="condo-walkscore-section" aria-labelledby="condo-walkscore-heading">
      <h2 id="condo-walkscore-heading" className="condo-detail-block-title">
        Walkability & transit
      </h2>
      <p className="condo-walkscore-intro">
        See how {buildingName} scores for walking, transit, and biking. Walk Score (0–100) helps you evaluate how easily you can run errands, commute, and enjoy the neighborhood without a car.
      </p>
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="condo-walkscore-cta"
        onClick={() =>
          trackEvent('walkscore_click', {
            address: fullAddress,
            building_name: buildingName,
            path: pathname,
          })
        }
      >
        <span className="condo-walkscore-cta-label">Check Walk Score for this address</span>
        <span className="condo-walkscore-cta-address" aria-hidden>{fullAddress}</span>
      </a>
    </section>
  );
}
