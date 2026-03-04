import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { BrokersList } from '@/components/BrokersList';
import { assetPaths } from '@/config/theme';
import { agents } from '@/data/agents';
import { Suspense } from 'react';
import { SITE_NAME, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Our Brokers';
const description =
  'Meet the BCRE team. Licensed in Oregon and Washington. Portland metro, SW Washington, the coast & Mt. Hood. Connect with a broker who knows your market.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/brokers',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('BCRE brokers – Oregon and Washington')],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('BCRE brokers – Oregon and Washington').url],
  },
};

export default function BrokersPage() {
  return (
    <main>
      <Hero
        title="Proudly Serving OR & WA"
        lead="Licensed in Oregon and Washington. Filter by location or language and find a broker who knows your markets, property types, and goals."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="BCRE brokers serving Oregon and Washington"
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
