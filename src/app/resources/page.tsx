import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Resources';
const description =
  'Guides on buying and selling condos, HOAs, rent caps, and Portland and Pacific Northwest condo markets. From BCRE—condo guide, coast guide, and market synthesis.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/resources',
  ogImageAlt: 'BCRE resources and guides',
});

export default function ResourcesPage() {
  return (
    <main>
      <Hero
        title="Condo & market resources for serious buyers and sellers."
        lead="Use our guides to compare buildings, understand HOAs and rent caps, and make better decisions in Portland and across the Pacific Northwest."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Resources for condo and market research"
        priority
      >
        <Button href="/resources/portland-condo-guide" variant="white">
          2026 Portland Condo Guide
        </Button>
        <Button href="/contact" variant="outline">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="featured-resources-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Featured</p>
            <h2 id="featured-resources-heading" className="section-title">
              Featured guides
            </h2>
            <p className="section-lead mx-auto">
              Start with our Portland condo guide or explore the Oregon coast and latest market synthesis; then connect with a broker to apply the
              data to your specific situation.
            </p>
          </header>
          <RevealSection>
            <div className="resource-grid" aria-label="Featured resources">
              <article className="resource-card">
                <h3 className="resource-card-title">
                  <Link href="/resources/portland-condo-guide">
                    2026 Portland Condo Guide
                  </Link>
                </h3>
                <p className="resource-card-body">
                  A data-rich overview of condominium buildings across Portland. Compare median
                  prices, HOA levels, rent caps, amenities, and more.
                </p>
                <p className="resource-card-meta">
                  Focus: <strong>Portland condos</strong>
                </p>
                <Button href="/resources/portland-condo-guide" variant="outline">
                  View guide
                </Button>
              </article>
              <article className="resource-card">
                <h3 className="resource-card-title">
                  <Link href="/resources/oregon-coast-guide">
                    Oregon Coast Guide
                  </Link>
                </h3>
                <p className="resource-card-body">
                  Fifteen of the largest and most popular Oregon coast cities—from Astoria to Brookings. Explore communities and connect with a local broker.
                </p>
                <p className="resource-card-meta">
                  Focus: <strong>Oregon coast</strong>
                </p>
                <Button href="/resources/oregon-coast-guide" variant="outline">
                  View guide
                </Button>
              </article>
              <article className="resource-card">
                <h3 className="resource-card-title">
                  <Link href="/resources/market-synthesis-feb2026">
                    Pacific Northwest Market Synthesis (Feb 2026)
                  </Link>
                </h3>
                <p className="resource-card-body">
                  A synthesis of RMLS Market Action Reports: affordability ceilings, Portland vs. SW Washington, mid-valley stability, and coastal recalibration.
                </p>
                <p className="resource-card-meta">
                  Focus: <strong>RMLS data, PNW markets</strong>
                </p>
                <Button href="/resources/market-synthesis-feb2026" variant="outline">
                  Read synthesis
                </Button>
              </article>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="topics-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Topics</p>
            <h2 id="topics-heading" className="section-title">
              Learn the condo landscape
            </h2>
            <p className="section-lead mx-auto">
              Use these themes to frame your research, then bring your questions to a BCRE broker
              for building-specific advice.
            </p>
          </header>
          <div className="resource-grid" aria-label="Resource topics">
            <article className="resource-card">
              <h3 className="resource-card-title">Buying a condo with confidence</h3>
              <p className="resource-card-body">
                How to think about neighborhoods, price bands, and building selection—especially in
                markets like Portland where inventory and HOA structures vary widely.
              </p>
              <p className="resource-card-meta">
                See also:{' '}
                <Link href="/markets/oregon/multnomah/portland">Portland market hub</Link>
              </p>
            </article>
            <article className="resource-card">
              <h3 className="resource-card-title">Evaluating HOAs, rent caps & risk</h3>
              <p className="resource-card-body">
                Why HOA levels, rent caps, and special assessments matter—and how our condo guide
                data helps you understand long-term carrying costs.
              </p>
              <p className="resource-card-meta">
                See also:{' '}
                <Link href="/resources/portland-condo-guide">2026 Portland Condo Guide</Link>
              </p>
            </article>
            <article className="resource-card">
              <h3 className="resource-card-title">Selling a condo strategically</h3>
              <p className="resource-card-body">
                Positioning your condo against competing buildings, understanding buyer demand, and
                using our data to support pricing and negotiation.
              </p>
              <p className="resource-card-meta">
                Next step:{' '}
                <Link href="/contact">request a seller-focused consultation</Link>.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

