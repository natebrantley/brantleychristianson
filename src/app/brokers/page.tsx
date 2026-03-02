import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { BrokersList } from '@/components/BrokersList';
import { assetPaths } from '@/config/theme';
import { agents } from '@/data/agents';

export const metadata = {
  title: 'Our Brokers | Brantley Christianson Real Estate',
  description:
    'Meet the BCRE team. Licensed in Oregon and Washington. Portland metro, SW Washington, the coast & Mt. Hood.',
};

export default function BrokersPage() {
  return (
    <main>
      <Hero
        title="Our brokers"
        lead="Licensed in Oregon and Washington. Local expertise, exceptional service."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/contact" variant="white">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="brokers-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">The team</p>
            <h2 id="brokers-heading" className="section-title">
              Meet the BCRE team
            </h2>
            <p className="section-lead mx-auto">
              Sort by name or license state. Click a broker to view their profile, or reach out directly by email or phone.
            </p>
          </header>
          <BrokersList agents={agents} />
        </div>
      </section>
    </main>
  );
}
