import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { SITE_URL, SITE_NAME, defaultOgImage } from '@/config/site';
import { oregonCoastGuideCities } from '@/data/oregon-coast-guide';
import type { Metadata } from 'next';

const title = 'Oregon Coast Guide';
const description =
  'BCRE’s guide to 15 of the largest and most popular Oregon coast cities—from Astoria to Brookings. Explore real estate and communities on the Pacific.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/resources/oregon-coast-guide',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Oregon Coast guide – BCRE')],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('Oregon Coast guide – BCRE').url],
  },
};

export default function OregonCoastGuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Oregon Coast Guide',
    description: 'Guide to 15 major Oregon coast cities with links to real estate and community information.',
    url: `${SITE_URL}/resources/oregon-coast-guide`,
    numberOfItems: oregonCoastGuideCities.length,
    itemListElement: oregonCoastGuideCities.map((city, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: city.name,
      url: `${SITE_URL}/markets/oregon/${city.countySlug}/${city.slug}`,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero
        title="Oregon Coast Guide"
        lead="Fifteen of the largest and most popular cities on the Oregon coast. From Astoria to Brookings—explore communities and connect with a local broker."
        variant="short"
        imageSrc={`${assetPaths.markets}/AdobeStock_60907024.jpeg`}
        imageAlt="Oregon coast shoreline"
        priority
      >
        <Button href="/markets/oregon/region/oregon-coast" variant="white">
          Explore Oregon Coast region
        </Button>
        <Button href="/contact" variant="outline">
          Get in touch
        </Button>
      </Hero>

      <section className="section" aria-labelledby="cities-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="cities-heading" className="section-title">
              15 Oregon coast cities
            </h2>
            <p className="section-lead mx-auto">
              Click a city to learn more about the area and connect with a BCRE broker who knows the coast.
            </p>
          </header>
          <RevealSection>
            <ul className="resource-grid" role="list" aria-label="Oregon coast cities">
              {oregonCoastGuideCities.map((city) => (
                <li key={`${city.countySlug}-${city.slug}`}>
                  <article className="resource-card">
                    <h3 className="resource-card-title">
                      <Link href={`/markets/oregon/${city.countySlug}/${city.slug}`}>
                        {city.name}
                      </Link>
                    </h3>
                    <p className="resource-card-body">{city.description}</p>
                    <Button
                      href={`/markets/oregon/${city.countySlug}/${city.slug}`}
                      variant="outline"
                    >
                      View {city.name}
                    </Button>
                  </article>
                </li>
              ))}
            </ul>
          </RevealSection>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place on the coast?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker who knows Oregon coast real estate.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
