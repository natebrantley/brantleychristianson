import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { BrokersList } from '@/components/BrokersList';
import { assetPaths } from '@/config/theme';
import { agents } from '@/data/agents';
import { Suspense } from 'react';
import { SITE_NAME, defaultOgImage } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Our Agents';
const description =
  'Meet the BCRE team. Licensed in Oregon and Washington. Portland metro, SW Washington, the coast & Mt. Hood. Choose an agent as your main contact or connect for a consultation.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/agents',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('BCRE agents – Oregon and Washington')],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [defaultOgImage('BCRE agents – Oregon and Washington').url],
  },
};

export default function AgentsListPage() {
  return (
    <main>
      <Hero
        title="Proudly Serving OR & WA"
        lead="Licensed in Oregon and Washington. Filter by location or language, view each agent’s page, or choose one as your main contact from your dashboard."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="BCRE agents serving Oregon and Washington"
        priority
      >
        <Button href="/contact" variant="white">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="agents-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">The team</p>
            <h2 id="agents-heading" className="section-title">
              Meet our agents
            </h2>
            <p className="section-lead mx-auto">
              Each agent has their own profile. Signed-in clients can choose an agent as their main contact for quick access from the dashboard.
            </p>
          </header>
          <Suspense fallback={<div className="brokers-loading" aria-busy="true">Loading agents…</div>}>
            <BrokersList agents={agents} basePath="/agents" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
