import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { MarketLayout } from '@/components/markets/MarketLayout';
import { ListingsCta } from '@/components/markets/ListingsCta';
import { oregonMarket } from '@/data/markets';
import { oregonRegions } from '@/data/oregon-regions';
import { buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const KEY_CITIES = [
  { name: 'Portland', href: '/markets/oregon/multnomah/portland', cityParam: 'Portland' },
  { name: 'Eugene', href: '/markets/oregon/lane/eugene', cityParam: 'Eugene' },
  { name: 'Bend', href: '/markets/oregon/deschutes/bend', cityParam: 'Bend' },
  { name: 'Salem', href: '/markets/oregon/marion/salem', cityParam: 'Salem' },
] as const;

const title = 'Oregon Real Estate';
const description =
  'BCRE serves Portland metro, Willamette Valley, Oregon coast, Central and Eastern Oregon. Explore regions and cities; connect with a local broker.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/markets/oregon',
  ogImageAlt: 'Oregon real estate – BCRE',
});

export default function OregonMarketsPage() {
  const breadcrumb = (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li><Link href="/markets">Markets</Link></li>
        <li aria-current="page">Oregon</li>
      </ol>
    </nav>
  );

  return (
    <MarketLayout
      breadcrumb={breadcrumb}
      ctaStrip={
        <div className="stack--md text-center">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in Oregon?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1rem', maxWidth: '36ch' }}>
            Connect with a BCRE broker in your region or browse active listings.
          </p>
          <div className="market-layout-cta-actions">
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
            <ListingsCta areaName="Oregon" variant="white" />
          </div>
        </div>
      }
    >
      <Hero
        title="Oregon"
        lead="From Portland metro to the coast, valley, and high desert. Explore by region and find your community."
        variant="short"
        imageSrc={oregonMarket.imageSrc}
        imageAlt={oregonMarket.imageAlt}
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/markets" variant="white">
          All markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="about-oregon-heading">
        <div className="container container-narrow">
          <h2 id="about-oregon-heading" className="section-title text-center">
            About Oregon markets
          </h2>
          <p className="section-lead text-center">
            We serve Portland metro, the Willamette Valley, the coast, Central Oregon, and Eastern Oregon. From urban condos to rural acreage, our brokers help buyers and sellers navigate each region with local knowledge and a strategic approach.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="regions-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Explore by region</p>
            <h2 id="regions-heading" className="section-title">
              Explore Oregon
            </h2>
            <p className="section-lead mx-auto">
              Click a region to see its counties and cities. We serve communities across the state.
            </p>
          </header>
          <RevealSection>
            <ul className="city-stack" role="list">
              {oregonRegions.map((region) => (
                <li key={region.slug} className="city-stack__item">
                  <Link
                    href={`/markets/oregon/region/${region.slug}`}
                    className="city-stack__link"
                  >
                    <span className="city-stack__media">
                      <Image
                        src={region.imageSrc}
                        alt={region.imageAlt}
                        fill
                        sizes="(min-width: 768px) 380px, 100vw"
                        className="city-stack__img"
                      />
                      <span className="city-stack__overlay" aria-hidden />
                    </span>
                    <span className="city-stack__content">
                      <span className="city-stack__title">{region.name}</span>
                      <span className="city-stack__tagline">{region.description}</span>
                      <span className="city-stack__cta" aria-hidden>Explore region →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </RevealSection>
        </div>
      </section>

      <section className="section" aria-labelledby="key-cities-heading">
        <div className="container stack--lg">
          <h2 id="key-cities-heading" className="section-title text-center">
            Key cities
          </h2>
          <ul className="popular-markets-list" role="list" style={{ maxWidth: '48rem', margin: '0 auto' }}>
            {KEY_CITIES.map((c) => (
              <li key={c.name} className="popular-markets-list__item">
                <Link href={c.href} className="popular-markets-list__link">
                  {c.name}
                </Link>
                <ListingsCta areaName={c.name} city={c.cityParam} variant="outline" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="condo-guide-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="condo-guide-heading" className="section-title">
              Market guides
            </h2>
            <p className="section-lead mx-auto">
              Data-driven and regional guides to help you explore Oregon markets.
            </p>
          </header>
          <div className="text-center stack--md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Button href="/resources/portland-condo-guide" variant="outline">
              2026 Portland Condo Guide
            </Button>
            <Button href="/resources/oregon-coast-guide" variant="outline">
              Oregon Coast Guide
            </Button>
          </div>
        </div>
      </section>
    </MarketLayout>
  );
}
