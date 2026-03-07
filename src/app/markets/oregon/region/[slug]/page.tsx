import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { MarketLayout } from '@/components/markets/MarketLayout';
import { ListingsCta } from '@/components/markets/ListingsCta';
import {
  getRegionBySlug,
  getCountiesForRegion,
  getAllOregonRegionSlugs,
} from '@/data/oregon-regions';
import { SITE_NAME, SITE_URL, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllOregonRegionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) {
    return { title: `Oregon Region | ${SITE_NAME}` };
  }
  const title = `${region.name} Real Estate | Oregon`;
  const description = `${region.description} Explore counties and cities. Connect with a BCRE broker.`;
  const path = `/markets/oregon/region/${slug}`;
  const canonical = `${SITE_URL}${path}`;
  const socialTitle = `${title} | ${SITE_NAME}`;
  const image = defaultOgImage(`${region.name} real estate`);
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

export default async function OregonRegionPage({ params }: PageProps) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  const counties = getCountiesForRegion(slug).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const oregonHref = '/markets/oregon';

  const breadcrumb = (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li><Link href="/markets">Markets</Link></li>
        <li><Link href={oregonHref}>Oregon</Link></li>
        <li aria-current="page">{region.name}</li>
      </ol>
    </nav>
  );

  return (
    <MarketLayout
      breadcrumb={breadcrumb}
      ctaStrip={
        <div className="stack--md text-center">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in {region.name}?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1rem', maxWidth: '36ch' }}>
            Connect with a BCRE broker or browse active listings in this region.
          </p>
          <div className="market-layout-cta-actions">
            <Button href="/contact" variant="white">
              Get in touch
            </Button>
            <ListingsCta areaName={region.name} variant="white" />
          </div>
        </div>
      }
    >
      <Hero
        title={region.name}
        lead={region.description}
        variant="short"
        imageSrc={region.imageSrc}
        imageAlt={region.imageAlt}
        priority
      >
        <Button href={oregonHref} variant="white">
          Back to Oregon
        </Button>
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
      </Hero>

      <section className="section" aria-labelledby="about-region-heading">
        <div className="container container-narrow">
          <h2 id="about-region-heading" className="section-title text-center">
            About {region.name}
          </h2>
          <p className="section-lead text-center">
            We serve {counties.length} {counties.length === 1 ? 'county' : 'counties'} across {region.name}. Click a county below to see its cities and connect with a broker who knows the area.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="counties-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Counties in this region</p>
            <h2 id="counties-heading" className="section-title">
              {counties.length} {counties.length === 1 ? 'county' : 'counties'} in {region.name}
            </h2>
            <p className="section-lead mx-auto">
              Click a county to see its cities and connect with a broker who knows the area.
            </p>
          </header>
          <RevealSection>
            <ul className="city-stack" role="list">
              {counties.map((county) => (
                <li key={county.slug} className="city-stack__item">
                  <Link
                    href={`/markets/oregon/${county.slug}`}
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
    </MarketLayout>
  );
}
