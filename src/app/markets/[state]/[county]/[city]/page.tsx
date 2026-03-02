import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { getCityBySlug, getAllCityPaths } from '@/data/markets';

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
  return {
    title: `${cityData.name} Real Estate | ${countyData.name} | BCRE`,
    description: `${cityData.name}, ${countyData.name} ${stateMarket.name} real estate. ${cityData.tagline || ''} Connect with a BCRE broker.`.trim(),
  };
}

export default async function CityPage({ params }: PageProps) {
  const { state, county, city } = await params;
  const data = getCityBySlug(state, county, city);

  if (!data) notFound();

  const { city: cityData, county: countyData, state: stateMarket } = data;
  const stateHref = `/markets/${state}`;
  const countyHref = `/markets/${state}/${county}`;

  return (
    <main>
      <Hero
        title={cityData.name}
        lead={cityData.tagline ? `${cityData.tagline}. ${countyData.name}, ${stateMarket.name}.` : `${countyData.name}, ${stateMarket.name}.`}
        variant="short"
        imageSrc={countyData.imageSrc}
        imageAlt={cityData.name}
        priority
      >
        <Button href={countyHref} variant="white">
          All cities in {countyData.name}
        </Button>
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
      </Hero>

      <section className="section" aria-labelledby="city-heading">
        <div className="container container-narrow stack--xl">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li><Link href="/markets">Markets</Link></li>
              <li><Link href={stateHref}>{stateMarket.name}</Link></li>
              <li><Link href={countyHref}>{countyData.name}</Link></li>
              <li aria-current="page">{cityData.name}</li>
            </ol>
          </nav>
          <header className="stack--md text-center mx-auto">
            <h2 id="city-heading" className="section-title">
              {cityData.name}
            </h2>
            <p className="section-lead mx-auto">
              Our brokers know {cityData.name} and {countyData.name}. Whether you&apos;re buying or selling,
              we bring local expertise and a client-first approach to every transaction.
            </p>
          </header>
          <div className="text-center stack--md">
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

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in {cityData.name}?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker. We serve {countyData.name} and the greater {stateMarket.name} market.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
