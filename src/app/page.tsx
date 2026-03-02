import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { FeaturedListingCard } from '@/components/FeaturedListingCard';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { Stack } from '@/layout/Stack';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';

const FEATURED_LISTING = {
  mlsId: '622083132',
  href: '/listings/622083132',
  imageSrc: `${assetPaths.listings}/listing-622083132.jpg`,
  imageAlt: 'Featured property',
  location: 'Portland, OR',
  address: '1234 Luxury Lane',
  tagline: 'Pacific Northwest estate with mountain views',
  details: '4 bed · 5 bath · 3,200 sq ft',
};

const HUBS: Array<{ title: string; description?: string; href: string; imageSrc: string; imageAlt?: string }> = [
  {
    title: 'Oregon',
    description: 'Explore Oregon luxury properties',
    href: '/regions/oregon',
    imageSrc: `${assetPaths.hubs}/oregon-hub.jpg`,
    imageAlt: 'Oregon region',
  },
  {
    title: 'Washington',
    description: 'Explore Washington luxury properties',
    href: '/regions/washington',
    imageSrc: `${assetPaths.hubs}/washington-hub.jpg`,
    imageAlt: 'Washington region',
  },
];

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Brantley Christianson Real Estate',
    description: 'Fiercely Independent, Strategically Driven. Luxury real estate in the Pacific Northwest.',
    url: 'https://brantleychristianson.com',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Hero
          title="Fiercely Independent, Strategically Driven."
          lead="Luxury real estate across the Pacific Northwest. Oregon and Washington's most distinctive properties."
          variant="fullscreen"
          priority
        >
          <Button href="/listings" variant="white">
            View Listings
          </Button>
          <Button href="/contact" variant="white">
            Contact
          </Button>
        </Hero>

        <section className="section" aria-labelledby="featured-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Featured</p>
              <h2 id="featured-heading" className="section-title">
                Featured Listing
              </h2>
              <p className="section-lead mx-auto">
                MLS #622083132 — exceptional Pacific Northwest living.
              </p>
            </header>
            <RevealSection className="featured-listing-grid">
              <FeaturedListingCard {...FEATURED_LISTING} priority />
            </RevealSection>
          </div>
        </section>

        <section className="section" aria-labelledby="hubs-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Regions</p>
              <h2 id="hubs-heading" className="section-title">
                Intelligence Hubs
              </h2>
              <p className="section-lead mx-auto">
                Oregon and Washington luxury markets.
              </p>
            </header>
            <RevealSection>
              <IntelligenceHubs hubs={HUBS} />
            </RevealSection>
          </div>
        </section>
      </main>
    </>
  );
}
