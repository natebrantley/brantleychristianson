import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { IntelligenceHubs } from '@/components/IntelligenceHubs';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { allMarkets } from '@/data/markets';

const hubItems = allMarkets.map((m) => ({
  title: m.name,
  description: m.description,
  href: m.href,
  imageSrc: m.imageSrc,
  imageAlt: m.imageAlt,
}));

export const metadata = {
  title: 'Our Markets | Brantley Christianson Real Estate',
  description:
    'BCRE serves Oregon and Washington: Portland metro (Multnomah, Washington, Clackamas), SW Washington (Clark, Cowlitz), and beyond.',
};

export default function MarketsIndexPage() {
  return (
    <main>
      <Hero
        title="Learn the markets we serve."
        lead="Oregon and Washington metro areas where we live and work. Start here to understand neighborhoods, counties, and real estate opportunities across our service area."
        variant="short"
        imageSrc={`${assetPaths.markets}/pdx_skyline_2.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/markets/oregon" variant="white">
          Explore Oregon markets
        </Button>
        <Button href="/markets/washington" variant="outline">
          Explore Washington markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="states-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Explore</p>
            <h2 id="states-heading" className="section-title">
              Oregon & Washington
            </h2>
            <p className="section-lead mx-auto">
              Select a state to see the counties we serve and learn more about each market.
            </p>
          </header>
          <RevealSection>
            <IntelligenceHubs hubs={hubItems} />
          </RevealSection>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to find your place?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a BCRE broker in your market.
          </p>
          <Button href="/contact" variant="white">
            Get in touch
          </Button>
        </div>
      </section>
    </main>
  );
}
