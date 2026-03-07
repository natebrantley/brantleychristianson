import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { RevealSection } from '@/components/RevealSection';
import { MarketLayout } from '@/components/markets/MarketLayout';
import { ListingsCta } from '@/components/markets/ListingsCta';
import { assetPaths } from '@/config/theme';
import { allMarkets } from '@/data/markets';
import { buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const hubItems = allMarkets.map((m) => ({
  title: m.name,
  description: m.description,
  href: m.href,
  imageSrc: m.imageSrc,
  imageAlt: m.imageAlt,
}));

/** Popular markets for quick links: city slug, display name, and listings city param */
const POPULAR_MARKETS = [
  { name: 'Portland', citySlug: 'portland', stateSlug: 'oregon', countySlug: 'multnomah', cityParam: 'Portland' },
  { name: 'Vancouver', citySlug: 'vancouver', stateSlug: 'washington', countySlug: 'clark', cityParam: 'Vancouver' },
  { name: 'Lake Oswego', citySlug: 'lake-oswego', stateSlug: 'oregon', countySlug: 'clackamas', cityParam: 'Lake Oswego' },
  { name: 'Beaverton', citySlug: 'beaverton', stateSlug: 'oregon', countySlug: 'washington', cityParam: 'Beaverton' },
  { name: 'Camas', citySlug: 'camas', stateSlug: 'washington', countySlug: 'clark', cityParam: 'Camas' },
  { name: 'Gresham', citySlug: 'gresham', stateSlug: 'oregon', countySlug: 'multnomah', cityParam: 'Gresham' },
] as const;

const title = 'Our Markets';
const description =
  'BCRE serves Oregon and Washington: Portland metro (Multnomah, Washington, Clackamas), SW Washington (Clark, Cowlitz), coast & beyond. Explore cities and connect with a local broker.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/markets',
  ogImageAlt: 'BCRE markets – Oregon and Washington',
});

export default function MarketsIndexPage() {
  return (
    <MarketLayout
      ctaStrip={
        <div className="stack--md text-center">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1rem', maxWidth: '36ch' }}>
            Connect with a BCRE broker in your market or browse active listings.
          </p>
          <div className="market-layout-cta-actions">
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
            <ListingsCta areaName="Oregon & Washington" variant="white" />
          </div>
        </div>
      }
    >
      <Hero
        title="Learn the markets we serve."
        lead="Oregon and Washington metro areas where we live and work. Start here to understand neighborhoods, counties, and real estate opportunities across our service area."
        variant="short"
        imageSrc={`${assetPaths.markets}/pdx_skyline_2.jpeg`}
        imageAlt="Portland skyline and Oregon and Washington markets"
        priority
      >
        <Button href="/markets/oregon" variant="white">
          Explore Oregon markets
        </Button>
        <Button href="/markets/washington" variant="outline">
          Explore Washington markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="why-heading">
        <div className="container container-narrow">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">What we cover</p>
            <h2 id="why-heading" className="section-title">
              Why these markets
            </h2>
            <p className="section-lead mx-auto">
              From Portland metro and the Willamette Valley to Southwest Washington and the Oregon coast, we serve buyers and sellers where they live. Whether you&apos;re looking in the urban core, suburbs, or Mt. Hood gateway communities, our brokers bring local expertise and a fiercely independent approach to every transaction.
            </p>
          </header>
        </div>
      </section>

      <section className="section" aria-labelledby="states-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Explore</p>
            <h2 id="states-heading" className="section-title">
              Oregon & Washington
            </h2>
            <p className="section-lead mx-auto">
              Select a state to see the counties we serve and learn more about each market.
            </p>
          </header>
          <RevealSection>
            <IntelligenceHubs hubs={hubItems} />
          </RevealSection>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="popular-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Quick links</p>
            <h2 id="popular-heading" className="section-title">
              Popular markets
            </h2>
            <p className="section-lead mx-auto">
              Jump to a city page or browse active listings in that area.
            </p>
          </header>
          <ul className="popular-markets-list" role="list">
            {POPULAR_MARKETS.map((m) => (
              <li key={m.citySlug} className="popular-markets-list__item">
                <Link href={`/markets/${m.stateSlug}/${m.countySlug}/${m.citySlug}`} className="popular-markets-list__link">
                  {m.name}
                </Link>
                <ListingsCta areaName={m.name} city={m.cityParam} variant="outline" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketLayout>
  );
}
