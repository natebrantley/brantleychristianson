import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import {
  getCityBySlug,
  getAllCityPaths,
  getOtherCitiesInCounty,
} from '@/data/markets';

interface PageProps {
  params: Promise<{ state: string; county: string; city: string }>;
}

export async function generateStaticParams() {
  return getAllCityPaths();
}

export async function generateMetadata({ params }: PageProps) {
  const { state, county, city } = await params;
  const data = getCityBySlug(state, county, city);
  if (!data) return { title: 'City | BCRE' };
  const { city: cityData, county: countyData, state: stateMarket } = data;
  const lead = cityData.tagline
    ? `${cityData.tagline}. ${countyData.name}, ${stateMarket.name}.`
    : `${countyData.name}, ${stateMarket.name} real estate.`;
  return {
    title: `${cityData.name} Real Estate | ${countyData.name} | BCRE`,
    description: `${cityData.name} real estate. ${lead} Connect with a BCRE broker who knows the area.`,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { state, county, city } = await params;
  const data = getCityBySlug(state, county, city);

  if (!data) notFound();

  const { city: cityData, county: countyData, state: stateMarket } = data;
  const stateHref = `/markets/${state}`;
  const countyHref = `/markets/${state}/${county}`;
  const otherCities = getOtherCitiesInCounty(state, county, city);

  const isPortland = state === 'oregon' && county === 'multnomah' && city === 'portland';
  const canonicalUrl = `https://brantleychristianson.com/markets/${state}/${county}/${city}`;

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
        item: `https://brantleychristianson.com${countyHref}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: cityData.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <main className="city-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Hero
        title={cityData.name}
        lead={
          cityData.tagline
            ? `${cityData.tagline}. ${countyData.name}, ${stateMarket.name}.`
            : `${countyData.name}, ${stateMarket.name}.`
        }
        variant="short"
        imageSrc={countyData.imageSrc}
        imageAlt={`${cityData.name}, ${countyData.name}`}
        priority
      >
        <Button href={countyHref} variant="white">
          All cities in {countyData.name}
        </Button>
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
      </Hero>

      {/* Breadcrumb */}
      <section className="section city-page-breadcrumb" aria-label="Breadcrumb">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li>
                <Link href="/markets">Markets</Link>
              </li>
              <li>
                <Link href={stateHref}>{stateMarket.name}</Link>
              </li>
              <li>
                <Link href={countyHref}>{countyData.name}</Link>
              </li>
              <li aria-current="page">{cityData.name}</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* About this city & county */}
      <section className="section" aria-labelledby="city-about-heading">
        <div className="container container-narrow">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Local expertise</p>
            <h2 id="city-about-heading" className="section-title">
              {cityData.name} real estate
            </h2>
            <p className="section-lead mx-auto">
              {cityData.tagline && (
                <>
                  <strong>{cityData.name}</strong> — {cityData.tagline}.{' '}
                </>
              )}
              {countyData.description}
            </p>
          </header>

          {isPortland && (
            <div className="city-page-resource">
              <p className="city-page-resource-lead">
                Considering a condo in Portland? Explore our data-driven guide to
                condominium buildings across the metro area.
              </p>
              <Button href="/resources/portland-condo-guide" variant="outline">
                2026 Portland Condo Guide
              </Button>
            </div>
          )}

          <div className="text-center stack--md city-page-actions">
            <Button href="/contact" variant="primary">
              Connect with a broker in {cityData.name}
            </Button>
            <p>
              <Link href={countyHref} className="button button--text">
                View all cities in {countyData.name}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Other cities in this county */}
      {otherCities.length > 0 && (
        <section
          className="section section--alt"
          aria-labelledby="more-cities-heading"
        >
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto">
              <h2 id="more-cities-heading" className="section-title">
                More cities in {countyData.name}
              </h2>
              <p className="section-lead mx-auto">
                Explore other communities we serve in {countyData.name}. Each
                has its own character—and a BCRE broker who knows the area.
              </p>
            </header>
            <RevealSection>
              <ul className="city-grid city-page-grid" role="list">
                {otherCities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/markets/${state}/${county}/${c.slug}`}
                      className="city-card"
                    >
                      <span className="city-card-name">{c.name}</span>
                      {c.tagline && (
                        <span className="city-card-tagline">{c.tagline}</span>
                      )}
                      <span className="city-card-arrow" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </RevealSection>
            <p className="text-center">
              <Button href={countyHref} variant="outline">
                View all {countyData.cities.length} cities in {countyData.name}
              </Button>
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in {cityData.name}?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker. We serve {countyData.name} and the
            greater {stateMarket.name} market.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
