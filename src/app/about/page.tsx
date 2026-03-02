import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';

export const metadata = {
  title: 'About | Brantley Christianson Real Estate',
  description:
    'A local, independent real estate brokerage in Oregon and Washington. Fiercely independent, strategically driven.',
};

export default function AboutPage() {
  return (
    <main>
      <Hero
        title="A local, independent condo-focused brokerage."
        lead="We serve Oregon and Washington with experienced brokers who specialize in condos and complex urban properties—no franchise, no corporate playbook."
        variant="short"
        imageSrc={`${assetPaths.stock}/living.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/brokers" variant="white">
          Meet our brokers
        </Button>
      </Hero>

      <section className="section" aria-labelledby="who-we-are">
        <div className="container container-narrow stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Who we are</p>
            <h2 id="who-we-are" className="section-title">
              Independent by design
            </h2>
          </header>
          <RevealSection className="stack--lg about-content">
            <p className="about-lead">
              Brantley Christianson Real Estate is a local, independent real estate brokerage serving Oregon and Washington. We are not a national franchise—we are a Pacific Northwest firm built on local expertise and a client-first approach.
            </p>
            <p>
              Our brokers live and work in the communities they serve: Portland metro, Southwest Washington (Vancouver, Clark County), the Oregon coast, Mt. Hood, and beyond. Licensed in Oregon, Washington, or both, they bring deep market knowledge and a commitment to exceptional service to every transaction.
            </p>
            <p>
              Fiercely independent and strategically driven, we focus on what we do best: helping buyers and sellers navigate the Pacific Northwest real estate market with clarity, integrity, and results.
            </p>
          </RevealSection>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="our-markets">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Where we serve</p>
            <h2 id="our-markets" className="section-title">
              Oregon & Washington
            </h2>
            <p className="section-lead mx-auto">
              Portland metro and Southwest Washington dominate our service area. We also serve the Oregon coast and Mt. Hood.
            </p>
          </header>
          <RevealSection className="text-center">
            <Button href="/markets" variant="outline">
              Explore our markets
            </Button>
          </RevealSection>
        </div>
      </section>

      <section className="section" aria-labelledby="our-team">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">The team</p>
            <h2 id="our-team" className="section-title">
              Our brokers
            </h2>
            <p className="section-lead mx-auto">
              Licensed in Oregon and Washington. Local expertise, exceptional service.
            </p>
          </header>
          <RevealSection className="text-center">
            <Button href="/brokers" variant="primary">
              Meet the BCRE team
            </Button>
          </RevealSection>
        </div>
      </section>

      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Ready to work with us?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Connect with a broker in your market.
          </p>
          <Button href="/contact" variant="white">
            Contact BCRE
          </Button>
        </div>
      </section>
    </main>
  );
}
