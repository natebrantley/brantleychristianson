import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { MarketLayout } from '@/components/markets/MarketLayout';
import { ListingsCta } from '@/components/markets/ListingsCta';
import {
  getCountyBySlug,
  getStateBySlug,
  getAllCountyPaths,
} from '@/data/markets';
import { getWhatToKnow } from '@/data/market-copy';
import { SITE_NAME, SITE_URL, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ state: string; county: string }>;
}

export async function generateStaticParams() {
  return getAllCountyPaths();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state, county } = await params;
  const stateMarket = getStateBySlug(state);
  const countyData = getCountyBySlug(state, county);
  if (!stateMarket || !countyData) {
    return { title: `Market | ${SITE_NAME}` };
  }
  const title = `${countyData.name} Real Estate | ${stateMarket.name}`;
  const description = `BCRE serves ${countyData.name}. Explore cities: ${countyData.cities.map((c) => c.name).join(', ')}. Connect with a local broker.`;
  const path = `/markets/${state}/${county}`;
  const canonical = `${SITE_URL}${path}`;
  const socialTitle = `${title} | ${SITE_NAME}`;
  const image = defaultOgImage(`${countyData.name} real estate`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [image.url] },
  };
}

export default async function CountyPage({ params }: PageProps) {
  const { state, county } = await params;
  const stateMarket = getStateBySlug(state);
  const countyData = getCountyBySlug(state, county);

  if (!stateMarket || !countyData) notFound();

  const stateHref = `/markets/${state}`;
  const canonicalUrl = `https://brantleychristianson.com/markets/${state}/${county}`;
  const cities = [...countyData.cities].sort((a, b) => a.name.localeCompare(b.name));

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Markets',
        item: 'https://brantleychristianson.com/markets',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: stateMarket.name,
        item: `https://brantleychristianson.com${stateHref}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: countyData.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <MarketLayout
      breadcrumb={
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li><Link href="/markets">Markets</Link></li>
            <li><Link href={stateHref}>{stateMarket.name}</Link></li>
            <li aria-current="page">{countyData.name}</li>
          </ol>
        </nav>
      }
      ctaStrip={
        <div className="stack--md text-center">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1rem', maxWidth: '36ch' }}>
            Connect with a BCRE broker in {countyData.name} or browse active listings.
          </p>
          <div className="market-layout-cta-actions">
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
            <ListingsCta areaName={countyData.name} variant="white" />
          </div>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Hero
        title={countyData.name}
        lead={`Every city we serve in ${countyData.name}. Find your community and connect with a local BCRE broker.`}
        variant="short"
        imageSrc={countyData.imageSrc}
        imageAlt={countyData.imageAlt}
        priority
      >
        <Button href={stateHref} variant="white">
          Back to {stateMarket.name}
        </Button>
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
      </Hero>

      <section className="section" aria-labelledby="about-county-heading">
        <div className="container container-narrow">
          <h2 id="about-county-heading" className="section-title text-center">
            About {countyData.name}
          </h2>
          <p className="section-lead text-center">
            {countyData.description} We serve {cities.length} {cities.length === 1 ? 'city' : 'cities'} here—click any city below to learn more and connect with a broker who knows the area.
          </p>
          {getWhatToKnow(countyData.slug) && (
            <p className="section-lead text-center" style={{ marginTop: 'var(--space-md)' }}>
              {getWhatToKnow(countyData.slug)}
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="cities-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Cities & communities</p>
            <h2 id="cities-heading" className="section-title">
              {cities.length} {cities.length === 1 ? 'city' : 'cities'} in {countyData.name}
            </h2>
            <p className="section-lead mx-auto">
              Click a city to learn more and connect with a broker who knows the area.
            </p>
          </header>
          <RevealSection>
            <ul className="city-stack" role="list">
              {cities.map((city) => (
                <li key={city.slug} className="city-stack__item">
                  <Link
                    href={`/markets/${state}/${county}/${city.slug}`}
                    className="city-stack__link"
                  >
                    <span className="city-stack__media">
                      <Image
                        src={city.imageSrc}
                        alt={city.imageAlt}
                        fill
                        sizes="(min-width: 768px) 380px, 100vw"
                        className="city-stack__img"
                      />
                      <span className="city-stack__overlay" aria-hidden />
                    </span>
                    <span className="city-stack__content">
                      <span className="city-stack__title">{city.name}</span>
                      {city.tagline && (
                        <span className="city-stack__tagline">{city.tagline}</span>
                      )}
                      <span className="city-stack__cta" aria-hidden>View city →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </RevealSection>
        </div>
      </section>
    </MarketLayout>
  );
}
