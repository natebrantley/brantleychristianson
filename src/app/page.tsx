import { Hero } from '@/components/Hero';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { SITE_URL, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'Pacific Northwest Real Estate',
  description:
    'Fiercely Independent, Strategically Driven. Luxury real estate across Oregon and Washington. Portland metro, SW Washington, coast & Mt. Hood.',
  openGraph: {
    url: '/',
    title: 'Brantley Christianson Real Estate | Pacific Northwest Real Estate',
    description: 'Fiercely Independent, Strategically Driven. Luxury real estate across Oregon and Washington.',
    images: [defaultOgImage('Pacific Northwest real estate – Oregon and Washington')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brantley Christianson Real Estate | Pacific Northwest Real Estate',
    description: 'Fiercely Independent, Strategically Driven. Luxury real estate across Oregon and Washington.',
    images: [defaultOgImage('Pacific Northwest real estate – Oregon and Washington').url],
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Brantley Christianson Real Estate',
    description: 'Fiercely Independent, Strategically Driven. Luxury real estate in the Pacific Northwest.',
    url: SITE_URL,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Hero
          title="Strategic real estate for serious buyers and sellers."
          lead="A fiercely independent Pacific Northwest brokerage helping you compare properties, understand the market, and move with confidence."
          variant="short"
          imageSrc={`${assetPaths.stock}/kitchen.jpeg`}
          imageAlt="Modern kitchen in a Pacific Northwest home"
          priority
        >
          <Button href="/markets" variant="white">
            Explore our markets
          </Button>
          <Button href="/contact" variant="outline">
            Talk to a broker
          </Button>
        </Hero>

        <div className="site-announcement" role="region" aria-label="Site announcement">
          <div className="container site-announcement__inner">
            <p className="site-announcement__text">
              We&apos;re rolling out a new website—full functionality is on the way. Thanks for your patience.
            </p>
          </div>
        </div>

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

        <section className="section section--alt" aria-labelledby="guide-heading">
          <div className="container stack--xl condo-guide-section">
            <div className="home-condo-guide-banner">
              <Image
                src={`${assetPaths.markets}/pdx_skyline_2.jpeg`}
                alt="Portland condo skyline"
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Resource</p>
              <h2 id="guide-heading" className="section-title">
                2026 Portland Condo Guide
              </h2>
              <p className="section-lead mx-auto">
                Building-by-building data and commentary for Portland&apos;s condo market—HOA, taxes, prices, and our take on each building, updated for 2026.
              </p>
            </header>
            <RevealSection className="text-center">
              <Button href="/resources/portland-condo-guide" variant="outline">
                View the 2026 Portland Condo Guide
              </Button>
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
