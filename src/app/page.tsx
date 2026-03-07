import { Hero } from '@/components/Hero';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { LazyYouTube } from '@/components/LazyYouTube';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { SITE_URL, buildPageMetadata } from '@/config/site';
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

export const metadata: Metadata = buildPageMetadata({
  title: 'Pacific Northwest Real Estate',
  description:
    'Fiercely independent, strategically driven. Luxury and residential real estate across Oregon and Washington—Portland metro, SW Washington, coast & Mt. Hood. Connect with a local BCRE broker.',
  path: '/',
  ogImageAlt: 'Pacific Northwest real estate – Oregon and Washington',
});

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
              We&apos;re rolling out a new website. Thanks for your patience.
            </p>
          </div>
        </div>

        <section className="section featured-listing" aria-labelledby="ridgefield-video-heading">
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <p className="section-tag">Featured</p>
              <h2 id="ridgefield-video-heading" className="section-title">
                Ridgefield, Washington
              </h2>
              <p className="section-lead mx-auto">
                Clark County is the fastest-growing county in Washington. This video spotlights Ridgefield—one of its most sought-after communities—from small-town character and strong schools to easy access to Portland and Vancouver.
              </p>
            </header>
            <RevealSection>
              <div className="stack--lg featured-listing__content-wrap">
                <div className="featured-listing__video-wrap">
                <LazyYouTube
                  videoId="fNqcEYtUDBg"
                  title="Ridgefield, Washington – fastest-growing county in Washington"
                />
              </div>
              <p className="text-center">
                <Button href="/markets/washington/clark/ridgefield" variant="outline">
                  Explore Ridgefield real estate
                </Button>
              </p>
              </div>
            </RevealSection>
          </div>
        </section>

        <section className="section section--alt" aria-labelledby="who-we-are-heading">
          <div className="container container-tight stack--md text-center mx-auto">
            <p className="section-tag">Who we are</p>
            <h2 id="who-we-are-heading" className="section-title">
              Local, family & independently owned
            </h2>
            <p className="section-lead">
              We&apos;re real people with a community focus—not stock-market owned. We promise safe, quality service for all walks of life and circumstances.
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
              <Button href="/premium/portland-condo-guide" variant="outline">
                View the 2026 Portland Condo Guide
              </Button>
            </RevealSection>
          </div>
        </section>

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
            <p className="text-center markets-cta-wrap">
              <Button href="/markets" variant="outline">
                All markets
              </Button>
            </p>
          </div>
        </section>

        <section className="section section--cta" aria-label="Get in touch">
          <div className="container text-center stack--md cta-section-inner">
            <h2 className="section-title cta-section-title">
              Ready to find your place?
            </h2>
            <p className="section-lead mx-auto cta-section-lead">
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
