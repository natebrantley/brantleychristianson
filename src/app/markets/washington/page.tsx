import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { MarketLayout } from '@/components/markets/MarketLayout';
import { ListingsCta } from '@/components/markets/ListingsCta';
import { washingtonMarket } from '@/data/markets';
import { SITE_NAME, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

const KEY_CITIES = [
  { name: 'Vancouver', href: '/markets/washington/clark/vancouver', cityParam: 'Vancouver' },
  { name: 'Camas', href: '/markets/washington/clark/camas', cityParam: 'Camas' },
  { name: 'Longview', href: '/markets/washington/cowlitz/longview', cityParam: 'Longview' },
  { name: 'Kelso', href: '/markets/washington/cowlitz/kelso', cityParam: 'Kelso' },
] as const;

const title = 'Washington Real Estate';
const description =
  'BCRE serves Clark and Cowlitz counties—Vancouver, Camas, Longview, Kelso, and Southwest Washington. Local expertise across the Portland-Vancouver metro.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/markets/washington',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Washington real estate – BCRE')],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Washington real estate – BCRE').url],
  },
};

export default function WashingtonMarketsPage() {
  const counties = [...washingtonMarket.counties].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const breadcrumb = (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li><Link href="/markets">Markets</Link></li>
        <li aria-current="page">Washington</li>
      </ol>
    </nav>
  );

  return (
    <MarketLayout
      breadcrumb={breadcrumb}
      ctaStrip={
        <div className="stack--md text-center">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in Washington?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1rem', maxWidth: '36ch' }}>
            Connect with a BCRE broker in your county or browse active listings.
          </p>
          <div className="market-layout-cta-actions">
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
            <ListingsCta areaName="Washington" variant="white" />
          </div>
        </div>
      }
    >
      <Hero
        title="Washington"
        lead="Southwest Washington. We serve Clark and Cowlitz counties—Vancouver, Camas, Longview, Kelso, and the Lower Columbia."
        variant="short"
        imageSrc={washingtonMarket.imageSrc}
        imageAlt={washingtonMarket.imageAlt}
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/markets" variant="white">
          All markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="about-washington-heading">
        <div className="container container-narrow">
          <h2 id="about-washington-heading" className="section-title text-center">
            About Southwest Washington
          </h2>
          <p className="section-lead text-center">
            Clark and Cowlitz counties are part of the Portland-Vancouver metro. We help buyers and sellers in Vancouver, Camas, Battle Ground, Longview, Kelso, and the Lower Columbia with local expertise and clear guidance.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="counties-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Counties we serve</p>
            <h2 id="counties-heading" className="section-title">
              {counties.length} {counties.length === 1 ? 'county' : 'counties'} in Washington
            </h2>
            <p className="section-lead mx-auto">
              From Vancouver and Camas to Longview and Kelso. Click a county to see its cities and connect with a broker who knows the area.
            </p>
          </header>
          <RevealSection>
            <ul className="city-stack" role="list">
              {counties.map((county) => (
                <li key={county.slug} className="city-stack__item">
                  <Link
                    href={`/markets/washington/${county.slug}`}
                    className="city-stack__link"
                  >
                    <span className="city-stack__media">
                      <Image
                        src={county.imageSrc}
                        alt={county.imageAlt}
                        fill
                        sizes="(min-width: 768px) 380px, 100vw"
                        className="city-stack__img"
                      />
                      <span className="city-stack__overlay" aria-hidden />
                    </span>
                    <span className="city-stack__content">
                      <span className="city-stack__title">{county.name}</span>
                      <span className="city-stack__tagline">{county.description}</span>
                      <span className="city-stack__cta" aria-hidden>View cities →</span>
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
    </MarketLayout>
  );
}
