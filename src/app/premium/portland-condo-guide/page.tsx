import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { PortlandCondoGuideList } from '@/components/PortlandCondoGuideList';
import { RevealSection } from '@/components/RevealSection';
import { PremiumSignInButton } from '@/components/PremiumSignInButton';
import { assetPaths } from '@/config/theme';
import { SITE_URL, buildPageMetadata } from '@/config/site';
import { portlandCondoGuide, portlandCondoNeighborhoods } from '@/data/portland-condo-guide';
import type { Metadata } from 'next';

const title = '2026 Portland Condo Guide';
const description =
  'BCRE’s 2026 Portland condo guide. Compare buildings by neighborhood, median price, HOA, and more. Pearl District, Downtown, South Waterfront, East Portland.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description:
    'BCRE 2026 Portland condo guide. Compare buildings by neighborhood, median price, HOA, rent caps. Pearl District, Downtown, South Waterfront, East Portland.',
  path: '/premium/portland-condo-guide',
  ogImageAlt: 'Portland condo guide – BCRE',
});

export default async function PremiumPortlandCondoGuidePage() {
  const { userId } = await auth();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '2026 Portland Condo Guide',
    description:
      'Dataset of Portland condominium buildings with median prices, HOA fees, rent caps, amenities, and more.',
    url: `${SITE_URL}/premium/portland-condo-guide`,
    creator: {
      '@type': 'Organization',
      name: 'Brantley Christianson Real Estate',
      url: SITE_URL,
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
        imageAlt="Portland skyline and condo buildings"
        priority
      >
        {userId ? (
          <Button href="/contact" variant="white">
            Request a consultation
          </Button>
        ) : (
          <PremiumSignInButton
            redirectUrl="/premium/portland-condo-guide"
            className="button button--white"
          >
            Sign in to view full guide (free)
          </PremiumSignInButton>
        )}
      </Hero>

      <section className="section" aria-labelledby="how-to-use-heading">
        <div className="container container-narrow stack--xl">
          <div className="condo-guide-at-a-glance" aria-label="Guide summary">
            <p>
              <strong>{portlandCondoGuide.length} buildings</strong> across{' '}
              <strong>{portlandCondoNeighborhoods.length} neighborhoods</strong> — Pearl District,
              Downtown, South Waterfront, East Portland, and more.
            </p>
          </div>
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">How to use this guide</p>
            <h2 id="how-to-use-heading" className="section-title">
              Make smarter Portland condo decisions
            </h2>
            <p className="section-lead mx-auto">
              Filter by neighborhood and financial position, then sort by price or HOA to compare
              buildings. Click any building for full stats, policies, and our take.
            </p>
          </header>
          <div className="stack--md">
            <p>
              Use the <strong>neighborhood</strong> and <strong>financial position</strong> filters
              below to narrow the list. Sort by <strong>median price</strong> or{' '}
              <strong>HOA</strong> to rank by cost; use <strong>HOA ratio</strong> or{' '}
              <strong>tax ratio</strong> to compare value. Green dots indicate stronger financial
              position (lower cost burden, no special assessment).
            </p>
            <p>
              For deeper detail—rent caps, short-term rental rules, amenities, and our expert
              view—open a building or visit our{' '}
              <Link href="/markets/oregon/multnomah/portland">Portland market hub</Link>.{' '}
              <Link href="/contact">Request a consultation</Link> for tailored advice.
            </p>
          </div>
        </div>
      </section>

      {userId ? (
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
      ) : (
        <section className="section section--alt" aria-labelledby="teaser-heading">
          <div className="container container-narrow stack--lg">
            <header className="stack--md text-center mx-auto">
              <h2 id="teaser-heading" className="section-title">
                Free — sign in to view the full building list
              </h2>
              <p className="section-lead mx-auto">
                This guide is free. Sign in to access filters, sortable data, and building-by-building
                details.
              </p>
            </header>
            <div style={{ textAlign: 'center' }}>
              <PremiumSignInButton redirectUrl="/premium/portland-condo-guide">
                Sign in to view full guide (free)
              </PremiumSignInButton>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
