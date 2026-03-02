import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { PropertyCard } from '@/components/PropertyCard';
import { BrokerGrid } from '@/components/BrokerGrid';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { condos } from '@/data/condos';
import { agents } from '@/data/agents';

const MARKETS = [
  {
    title: 'Oregon',
    description: 'Portland metro, the coast & Mt. Hood',
    href: '/markets/oregon',
    imageSrc: `${assetPaths.markets}/pdx.jpeg`,
    imageAlt: 'Portland, Oregon',
  },
  {
    title: 'Washington',
    description: 'SW Washington, Vancouver & Clark County',
    href: '/markets/washington',
    imageSrc: `${assetPaths.markets}/camas_river.webp`,
    imageAlt: 'Southwest Washington',
  },
];

export const metadata = {
  title: 'Brantley Christianson Real Estate | Pacific Northwest',
  description:
    'Fiercely Independent, Strategically Driven. Luxury real estate across Oregon and Washington.',
};

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
          title="Condo intelligence for serious buyers and sellers."
          lead="Specialized Pacific Northwest brokerage helping you compare buildings, understand the market, and move with confidence."
          variant="short"
          imageSrc={`${assetPaths.stock}/kitchen.jpeg`}
          imageAlt=""
          priority
        >
          <Button href="/resources/portland-condo-guide" variant="white">
            Find the right condo
          </Button>
          <Button href="/contact" variant="outline">
            Talk to a broker
          </Button>
        </Hero>

        <section className="section" aria-labelledby="markets-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Explore</p>
              <h2 id="markets-heading" className="section-title">
                Our Markets
              </h2>
              <p className="section-lead mx-auto">
                Portland metro and Southwest Washington are at the heart of our service area. We also serve the Oregon coast and Mt. Hood.
              </p>
            </header>
            <RevealSection>
              <IntelligenceHubs hubs={MARKETS} />
            </RevealSection>
            <p className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
              <Button href="/markets" variant="outline">
                All markets
              </Button>
            </p>
          </div>
        </section>

        <section className="section section--alt" aria-labelledby="properties-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Distinctive properties</p>
              <h2 id="properties-heading" className="section-title">
                Featured Properties
              </h2>
              <p className="section-lead mx-auto">
                Condominiums and buildings we know well.
              </p>
            </header>
            <RevealSection className="property-grid property-grid--condos">
              {condos.map((condo) => (
                <PropertyCard
                  key={condo.slug}
                  name={condo.name}
                  href={condo.href}
                  imageSrc={condo.imageSrc}
                  imageAlt={condo.name}
                />
              ))}
            </RevealSection>
            <p className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
              <Button href="/markets" variant="outline">
                Explore properties
              </Button>
              <span style={{ marginLeft: 'var(--space-md)' }}>
                <Button href="/resources/portland-condo-guide" variant="text">
                  2026 Portland Condo Guide
                </Button>
              </span>
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="team-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">The team</p>
              <h2 id="team-heading" className="section-title">
                Our Brokers
              </h2>
              <p className="section-lead mx-auto">
                Licensed in Oregon and Washington. Local expertise, exceptional service.
              </p>
            </header>
            <RevealSection>
              <BrokerGrid agents={agents} maxItems={8} showAllHref="/brokers" />
            </RevealSection>
          </div>
        </section>

        <section className="section section--cta" aria-label="Get in touch">
          <div className="container text-center stack--md">
            <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
              Ready to find your place?
            </h2>
            <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
              Connect with a BCRE broker in your market.
            </p>
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
