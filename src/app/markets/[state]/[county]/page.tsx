import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import {
  getCountyBySlug,
  getStateBySlug,
  getAllCountyPaths,
} from '@/data/markets';
import { SITE_NAME, defaultOgImage } from '@/config/site';
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
  const url = `/markets/${state}/${county}`;
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    openGraph: { url, title: socialTitle, description, images: [defaultOgImage(`${countyData.name} real estate`)], },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [defaultOgImage(`${countyData.name} real estate`).url] },
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
    <main>
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
