import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { BrokersList } from '@/components/BrokersList';
import { assetPaths } from '@/config/theme';
import { agents } from '@/data/agents';
import { Suspense } from 'react';

export const metadata = {
  title: 'Our Brokers | Brantley Christianson Real Estate',
  description:
    'Meet the BCRE team. Licensed in Oregon and Washington. Portland metro, SW Washington, the coast & Mt. Hood.',
};

export default function BrokersPage() {
  return (
    <main>
      <Hero
        title="Meet the brokers behind our condo intelligence."
        lead="Licensed in Oregon and Washington. Filter by location or language and find a broker who knows your buildings, your neighborhood, and your goals."
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
              Filter by location (state or city) or language. Sort by name or license. Click a broker for their profile, or reach out by email or phone.
            </p>
          </header>
          <Suspense fallback={<div className="brokers-loading" aria-busy="true">Loading brokers…</div>}>
            <BrokersList agents={agents} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
