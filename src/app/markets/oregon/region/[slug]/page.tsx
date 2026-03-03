import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import {
  getRegionBySlug,
  getCountiesForRegion,
  getAllOregonRegionSlugs,
} from '@/data/oregon-regions';
import { oregonMarket } from '@/data/markets';
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
    return { title: 'Oregon Region | Brantley Christianson Real Estate' };
  }
  const title = `${region.name} Real Estate | Oregon`;
  const description = `${region.description} Explore counties and cities. Connect with a BCRE broker.`;
  const url = `/markets/oregon/region/${slug}`;
  return {
    title,
    description,
    openGraph: { url, title, description },
    twitter: { card: 'summary_large_image', title, description },
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

  return (
    <main>
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

      <section className="section" aria-labelledby="counties-heading">
        <div className="container stack--xl">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li><Link href="/markets">Markets</Link></li>
              <li><Link href={oregonHref}>Oregon</Link></li>
              <li aria-current="page">{region.name}</li>
            </ol>
          </nav>
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

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in {region.name}?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker in your county.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
