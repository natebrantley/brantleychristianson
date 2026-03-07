import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { LendersFilterable } from '@/components/LendersFilterable';
import { assetPaths } from '@/config/theme';
import { lenders } from '@/data/lenders';
import { buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Preferred Lenders';
const description =
  'BCRE trusted lending partners. Connect with a loan officer who knows Oregon and Washington markets. Purchase, refinance, and investment financing.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/lenders',
  ogImageAlt: 'BCRE preferred lenders',
});

export default function LendersPage() {
  return (
    <main className="lenders-page">
      <Hero
        title="Preferred Lenders"
        lead="Work with loan officers we trust. They know our markets and deliver options, clarity, and service for purchase, refinance, and investment loans."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Preferred lenders for Oregon and Washington"
        priority
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
      </Hero>

      <section className="section" aria-labelledby="lenders-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Lending partners</p>
            <h2 id="lenders-heading" className="section-title">
              Meet our preferred lenders
            </h2>
            <p className="section-lead mx-auto">
              Click a lender for their profile, NMLS details, and contact info. Filter by location or language, or sort by name.
            </p>
          </header>
          <LendersFilterable lenders={lenders} />
        </div>
      </section>
    </main>
  );
}
