'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export interface CondoMapSectionProps {
  address: string;
  buildingName: string;
}

function buildFullAddress(address: string): string {
  return `${address}, Portland, OR`;
}

export function CondoMapSection({ address, buildingName }: CondoMapSectionProps) {
  const fullAddress = buildFullAddress(address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const osmUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress)}`;
  const googleEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const [embedError, setEmbedError] = useState(false);
  const showEmbed = googleEmbedKey && !embedError;
  const pathname = usePathname();

  return (
    <section className="condo-map-section" aria-labelledby="condo-map-heading">
      <h2 id="condo-map-heading" className="condo-detail-block-title">
        Location & map
      </h2>
      <p className="condo-map-address">
        <strong>{address}</strong>
        <br />
        <span className="condo-map-city">Portland, Oregon</span>
      </p>
      <div className="condo-map-actions">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="condo-map-btn condo-map-btn--primary"
          onClick={() =>
            trackEvent('map_click', {
              provider: 'google_maps',
              address: fullAddress,
              building_name: buildingName,
              path: pathname,
            })
          }
        >
          View on Google Maps
        </a>
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="condo-map-btn condo-map-btn--secondary"
          onClick={() =>
            trackEvent('map_click', {
              provider: 'openstreetmap',
              address: fullAddress,
              building_name: buildingName,
              path: pathname,
            })
          }
        >
          View on OpenStreetMap
        </a>
      </div>
      {showEmbed ? (
        <div className="condo-map-embed-wrap">
          <iframe
            title={`Map of ${buildingName}`}
            src={`https://www.google.com/maps/embed/v1/place?key=${googleEmbedKey}&q=${encodeURIComponent(fullAddress)}`}
            className="condo-map-embed"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setEmbedError(true)}
          />
        </div>
      ) : (
        <div className="condo-map-placeholder">
          <p>
            An interactive map isn&apos;t available in your browser right now, but you can open{' '}
            {buildingName} on Google Maps or OpenStreetMap using the buttons above.
          </p>
        </div>
      )}
    </section>
  );
}
