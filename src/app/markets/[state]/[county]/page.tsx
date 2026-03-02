import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import {
  getCountyBySlug,
  getStateBySlug,
  getAllCountyPaths,
} from '@/data/markets';

interface PageProps {
  params: Promise<{ state: string; county: string }>;
}

export async function generateStaticParams() {
  return getAllCountyPaths();
}

export async function generateMetadata({ params }: PageProps) {
  const { state, county } = await params;
  const stateMarket = getStateBySlug(state);
  const countyData = getCountyBySlug(state, county);
  if (!stateMarket || !countyData) return { title: 'Market | BCRE' };
  return {
    title: `${countyData.name} | ${stateMarket.name} | Brantley Christianson Real Estate`,
    description: `BCRE serves ${countyData.name}. Explore cities: ${countyData.cities.map((c) => c.name).join(', ')}.`,
  };
}

export default async function CountyPage({ params }: PageProps) {
  const { state, county } = await params;
  const stateMarket = getStateBySlug(state);
  const countyData = getCountyBySlug(state, county);

  if (!stateMarket || !countyData) notFound();

  const stateHref = `/markets/${state}`;
  const cities = countyData.cities;

  return (
    <main>
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

      <section className="section" aria-labelledby="cities-heading">
        <div className="container stack--xl">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li><Link href="/markets">Markets</Link></li>
              <li><Link href={stateHref}>{stateMarket.name}</Link></li>
              <li aria-current="page">{countyData.name}</li>
            </ol>
          </nav>
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
            <ul className="city-grid" role="list">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/markets/${state}/${county}/${city.slug}`}
                    className="city-card"
                  >
                    <span className="city-card-name">{city.name}</span>
                    {city.tagline && (
                      <span className="city-card-tagline">{city.tagline}</span>
                    )}
                    <span className="city-card-arrow" aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </RevealSection>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker in {countyData.name}.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
