import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { SITE_NAME, buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const title = 'About Us';
const description =
  'Fiercely independent boutique real estate brokerage in Oregon and Washington. Licensed, local expertise. Members of RMLS, EMAR, OAR, WAR, NAR & NWMLS. Portland metro, SW Washington, coast & Mt. Hood.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/about',
  ogImageAlt: 'About BCRE – Oregon and Washington real estate',
});

const PILLARS = [
  {
    title: 'Local expertise',
    text: 'Our brokers live and work in the communities they serve—no fly-in playbooks.',
  },
  {
    title: 'Independent by design',
    text: 'No franchise script. We advise with clarity and integrity, not corporate mandates.',
  },
  {
    title: 'Client-first',
    text: 'Your goals drive the strategy. We focus on outcomes that matter to you.',
  },
  {
    title: 'Strategic focus',
    text: 'Residential, condos, and investment property across Oregon and Washington.',
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <Hero
        title="Fiercely independent. Strategically driven."
        lead="A fully licensed, independently owned boutique brokerage in Oregon and Washington. Built on local expertise and a client-first approach—no franchise, no corporate playbook."
        variant="short"
        imageSrc={`${assetPaths.stock}/living.jpeg`}
        imageAlt="Living space in a Pacific Northwest home"
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/agents" variant="white">
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
              Brantley Christianson Real Estate is a fully independently owned and operated boutique real estate brokerage serving Oregon and Washington. We are fully licensed in both states and are not a national franchise—we are a Pacific Northwest firm built on deep market knowledge and a commitment to exceptional service.
            </p>
            <p>
              We are members of the RMLS, EMAR, OAR, WAR, NAR, and NWMLS.
            </p>
            <blockquote className="about-quote" cite="https://brantleychristianson.com">
              <p className="about-quote__text">
                Fiercely independent and strategically driven—we focus on what we do best: helping buyers and sellers navigate the Pacific Northwest with clarity, integrity, and results.
              </p>
            </blockquote>
            <p>
              Our brokers are licensed in Oregon, Washington, or both. They serve Portland metro, Southwest Washington (Vancouver, Clark County), the Oregon coast, Mt. Hood, the Willamette Valley, and beyond. Every transaction is guided by local expertise and a client-first approach.
            </p>
            <ul className="about-pillars" role="list">
              {PILLARS.map((pillar) => (
                <li key={pillar.title} className="about-pillar">
                  <h3 className="about-pillar__title">{pillar.title}</h3>
                  <p className="about-pillar__text">{pillar.text}</p>
                </li>
              ))}
            </ul>
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
              From Portland and Vancouver to the coast, valley, and high desert. Explore the markets where our brokers live and work.
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
              Experienced agents who know their markets inside and out. Licensed in Oregon and Washington—ready to guide your next move.
            </p>
          </header>
          <RevealSection className="text-center">
            <Button href="/agents" variant="primary">
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
            Connect with a broker who knows your market.
          </p>
          <Button href="/contact" variant="white">
            Contact BCRE
          </Button>
        </div>
      </section>
    </main>
  );
}
