import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { MarketStack } from '@/components/MarketStack';
import { RevealSection } from '@/components/RevealSection';
import { washingtonMarket } from '@/data/markets';
import type { Metadata } from 'next';

const countyStackItems = washingtonMarket.counties.map((c) => ({
  title: c.name,
  description: c.description,
  href: `/markets/washington/${c.slug}`,
  imageSrc: c.imageSrc,
  imageAlt: c.imageAlt,
}));

export const metadata: Metadata = {
  title: 'Washington Real Estate',
  description:
    'BCRE serves Clark and Cowlitz counties—Vancouver, Camas, Longview, Kelso, and Southwest Washington. Local expertise across the Portland-Vancouver metro.',
  openGraph: { url: '/markets/washington' },
  twitter: { card: 'summary_large_image' },
};

export default function WashingtonMarketsPage() {
  return (
    <main>
      <Hero
        title="Washington"
        lead="Southwest Washington. We serve Clark and Cowlitz counties—Vancouver, Camas, Longview, Kelso, and the Lower Columbia."
        variant="short"
        imageSrc={washingtonMarket.imageSrc}
        imageAlt={washingtonMarket.imageAlt}
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/markets" variant="white">
          All markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="counties-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Counties we serve</p>
            <h2 id="counties-heading" className="section-title">
              Clark & Cowlitz
            </h2>
            <p className="section-lead mx-auto">
              From Vancouver and Camas to Longview and Kelso. Local expertise across Southwest Washington.
            </p>
          </header>
          <RevealSection>
            <MarketStack items={countyStackItems} />
          </RevealSection>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place in Washington?
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
