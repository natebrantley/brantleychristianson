import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { oregonMarket } from '@/data/markets';
import { oregonRegions } from '@/data/oregon-regions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oregon Real Estate',
  description:
    'BCRE serves Portland metro, the Willamette Valley, the coast, Central and Eastern Oregon. Explore Oregon regions and connect with a local broker.',
  openGraph: { url: '/markets/oregon' },
  twitter: { card: 'summary_large_image' },
};

export default function OregonMarketsPage() {
  return (
    <main>
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

      <section className="section" aria-labelledby="regions-heading">
        <div className="container stack--xl">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li><Link href="/markets">Markets</Link></li>
              <li aria-current="page">Oregon</li>
            </ol>
          </nav>
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Explore by region</p>
            <h2 id="regions-heading" className="section-title">
              Oregon regions
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

      <section className="section section--alt" aria-labelledby="condo-guide-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="condo-guide-heading" className="section-title">
              2026 Portland Condo Guide
            </h2>
            <p className="section-lead mx-auto">
              Explore our data-driven guide to Portland condominium buildings.
            </p>
          </header>
          <p className="text-center">
            <Button href="/resources/portland-condo-guide" variant="outline">
              2026 Portland Condo Guide
            </Button>
          </p>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in Oregon?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker in your region.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
