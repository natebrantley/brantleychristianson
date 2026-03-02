import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { RevealSection } from '@/components/RevealSection';
import { oregonMarket } from '@/data/markets';

const countyHubs = oregonMarket.counties.map((c) => ({
  title: c.name,
  description: c.description,
  href: `/markets/oregon/${c.slug}`,
  imageSrc: c.imageSrc,
  imageAlt: c.imageAlt,
}));

export const metadata = {
  title: 'Oregon Markets | Brantley Christianson Real Estate',
  description:
    'BCRE serves Multnomah, Washington, and Clackamas counties—Portland metro and surrounding Oregon communities.',
};

export default function OregonMarketsPage() {
  return (
    <main>
      <Hero
        title="Oregon"
        lead="Portland metro and beyond. We serve Multnomah, Washington, and Clackamas counties."
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

      <section className="section" aria-labelledby="counties-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Counties we serve</p>
            <h2 id="counties-heading" className="section-title">
              Multnomah, Washington & Clackamas
            </h2>
            <p className="section-lead mx-auto">
              Portland and the surrounding metro. Our brokers know these communities inside and out.
            </p>
          </header>
          <RevealSection>
            <IntelligenceHubs hubs={countyHubs} />
          </RevealSection>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="condo-guide-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Resource</p>
            <h2 id="condo-guide-heading" className="section-title">
              Portland condos
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
