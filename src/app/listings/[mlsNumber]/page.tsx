import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/Button';
import { PropertyDetails } from '@/components/rmls/PropertyDetails';
import { SITE_NAME } from '@/config/site';
import { validateMlsNumber } from '@/lib/validate-mls-number';
import { repliersGetSingleListing } from '@/lib/repliers-client';
import { supabaseAdmin } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ mlsNumber: string }>;
}

async function getListing(mlsNumber: string) {
  const validation = validateMlsNumber(mlsNumber);
  if (!validation.valid) return null;
  let supabase: ReturnType<typeof supabaseAdmin> | undefined;
  try {
    supabase = supabaseAdmin();
  } catch {
    supabase = undefined;
  }
  const result = await repliersGetSingleListing({
    mlsNumber: validation.mlsNumber,
    supabaseFallback: supabase,
  });
  if ('error' in result) return null;
  const listing = result.listing as Record<string, unknown>;
  const { seller_contact, showing_instructions, ...publicListing } = listing;
  void seller_contact;
  void showing_instructions;
  return {
    listing: publicListing,
    source: result.source,
    comparables: 'comparables' in result ? result.comparables : undefined,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mlsNumber } = await params;
  const data = await getListing(mlsNumber);
  const listing = data?.listing;
  if (!listing) return { title: 'Listing not found' };
  const address = (listing.address as string) ?? (listing as Record<string, unknown>).address;
  const city = (listing.city as string) ?? (listing as Record<string, unknown>).city;
  const title = [address, city].filter(Boolean).join(', ') || `Listing ${mlsNumber}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description: `Property listing ${mlsNumber}. ${SITE_NAME}.`,
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { mlsNumber } = await params;
  const data = await getListing(mlsNumber);
  if (!data?.listing) notFound();

  const listing = data.listing as Record<string, unknown>;
  const office = listing.office as Record<string, unknown> | undefined;
  const brokerageName = (office?.brokerageName ?? listing.listing_firm_name) as string;
  const agents = listing.agents as Array<{ name?: string | null }> | undefined;
  const agentName = agents?.[0]?.name ?? listing.listing_agent_name;

  const listPrice = listing.listPrice ?? listing.price;
  const price =
    typeof listPrice === 'number' ? listPrice : typeof listPrice === 'string' ? parseFloat(listPrice) : null;
  const details = listing.details as Record<string, unknown> | undefined;
  const beds = (details?.numBedrooms ?? listing.beds) as number | null | undefined;
  const baths = (details?.numBathrooms ?? listing.baths) as number | null | undefined;
  const sqft = (details?.sqft ?? listing.sqft) as number | null | undefined;
  const address = listing.address as string | Record<string, unknown> | undefined;
  const addressStr =
    typeof address === 'string'
      ? address
      : address && typeof address === 'object'
        ? [address.streetNumber, address.streetName, address.unitNumber].filter(Boolean).join(' ')
        : '';
  const city = (listing.city as string) ?? (address as Record<string, unknown>)?.city;
  const state = (listing.state as string) ?? (address as Record<string, unknown>)?.state;
  const zip = (listing.zip as string) ?? (address as Record<string, unknown>)?.zip;

  const images = (listing.images as string[] | undefined) ?? [];
  const firstImage = images[0] ?? listing.image_url;
  const imageBase = 'https://cdn.repliers.io';
  const imageUrl = (url: unknown) =>
    typeof url === 'string' ? (url.startsWith('http') ? url : `${imageBase}/${url.replace(/^\//, '')}`) : null;

  return (
    <main className="listing-detail-page">
      <nav className="listing-detail-page__breadcrumb" aria-label="Breadcrumb">
        <Link href="/listings">Listings</Link>
        <span aria-hidden>/</span>
        <span>Listing {mlsNumber}</span>
      </nav>
      <PropertyDetails
        listing={{
          listingFirmName: brokerageName ?? 'Unknown',
          listingAgentName: agentName as string | null | undefined,
        }}
        brokerageName={SITE_NAME}
      >
        <div className="listing-detail-page__content">
          {firstImage && (
            <div className="listing-detail-page__hero">
              <img
                src={imageUrl(firstImage) ?? ''}
                alt=""
                width={1200}
                height={630}
                className="listing-detail-page__hero-img"
              />
            </div>
          )}
          <div className="listing-detail-page__info">
            {price != null && (
              <p className="listing-detail-page__price">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)}
              </p>
            )}
            <p className="listing-detail-page__address">
              {[addressStr, city, state, zip].filter(Boolean).join(', ')}
            </p>
            <dl className="listing-detail-page__specs">
              {beds != null && (
                <>
                  <dt>Beds</dt>
                  <dd>{beds}</dd>
                </>
              )}
              {baths != null && (
                <>
                  <dt>Baths</dt>
                  <dd>{baths}</dd>
                </>
              )}
              {sqft != null && (
                <>
                  <dt>Sq ft</dt>
                  <dd>{sqft.toLocaleString()}</dd>
                </>
              )}
            </dl>
          </div>
          {images.length > 1 && (
            <div className="listing-detail-page__gallery">
              <h2>Photos</h2>
              <ul className="listing-detail-page__gallery-list">
                {images.slice(0, 12).map((src, i) => (
                  <li key={i}>
                    <img
                      src={imageUrl(src) ?? ''}
                      alt=""
                      width={200}
                      height={140}
                      className="listing-detail-page__gallery-img"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PropertyDetails>
      <div className="listing-detail-page__back">
        <Button href="/listings" variant="outline">
          Back to search
        </Button>
      </div>
    </main>
  );
}
