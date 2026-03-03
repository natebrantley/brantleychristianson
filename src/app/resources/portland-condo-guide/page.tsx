import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { PortlandCondoGuideList } from '@/components/PortlandCondoGuideList';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { portlandCondoGuide } from '@/data/portland-condo-guide';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2026 Portland Condo Guide',
  description:
    'BCRE’s 2026 Portland condo guide. Compare buildings by neighborhood, median price, HOA, and more. Pearl District, Downtown, South Waterfront, East Portland.',
  openGraph: { url: '/resources/portland-condo-guide' },
  twitter: { card: 'summary_large_image' },
};

export default function PortlandCondoGuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '2026 Portland Condo Guide',
    description:
      'Dataset of Portland condominium buildings with median prices, HOA fees, rent caps, amenities, and more.',
    url: 'https://brantleychristianson.com/resources/portland-condo-guide',
    creator: {
      '@type': 'Organization',
      name: 'Brantley Christianson Real Estate',
      url: 'https://brantleychristianson.com',
    },
    spatialCoverage: {
      '@type': 'Place',
      name: 'Portland, Oregon',
    },
    numberOfItems: portlandCondoGuide.length,
    keywords: ['Portland condos', 'condo guide', 'HOA fees', 'rent caps'],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero
        title="2026 Portland Condo Guide"
        lead="Data-driven overview of Portland condominium buildings. Filter by neighborhood, sort by price or HOA."
        variant="short"
        imageSrc={`${assetPaths.markets}/pdx.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/contact" variant="white">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="how-to-use-heading">
        <div className="container container-narrow stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">How to use this guide</p>
            <h2 id="how-to-use-heading" className="section-title">
              Make smarter Portland condo decisions
            </h2>
            <p className="section-lead mx-auto">
              Start with your neighborhood and budget, then use the filters and stats to compare
              buildings side by side.
            </p>
          </header>
          <div className="stack--md">
            <p>
              Use the <strong>neighborhood filter</strong> to focus on areas you&apos;re actually
              willing to live in, then sort by <strong>median price</strong> or{' '}
              <strong>average monthly HOA</strong> to see how different buildings stack up.
            </p>
            <p>
              Pay attention to <strong>rent caps</strong>, <strong>short-term rental rules</strong>,
              and <strong>special assessments</strong> if you&apos;re an investor or you care about
              flexibility and risk. Buildings with stronger financial footing often have more
              predictable long-term ownership costs.
            </p>
            <p>
              When you&apos;re ready to go deeper, click into individual buildings for detailed
              stats and our expert view, or cross-reference this guide with our{' '}
              <Link href="/markets/oregon/multnomah/portland">Portland market hub</Link>. For
              tailored advice on specific buildings, <Link href="/contact">request a consultation</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section condo-guide-section" aria-labelledby="guide-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="guide-heading" className="section-title">
              Explore Portland condos
            </h2>
            <p className="section-lead mx-auto">
              Median prices, HOA fees, rent caps, amenities, and more. Use filters and sort to find
              buildings that match your goals.
            </p>
          </header>
          <RevealSection>
            <PortlandCondoGuideList condos={portlandCondoGuide} />
          </RevealSection>
        </div>
      </section>
    </main>
  );
}
