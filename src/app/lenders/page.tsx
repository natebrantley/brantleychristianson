import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { LendersList } from '@/components/LendersList';
import { assetPaths } from '@/config/theme';
import { lenders } from '@/data/lenders';
import type { Metadata } from 'next';

const title = 'Preferred Lenders';
const description =
  'Our trusted lending partners. Connect with a loan officer who understands your market and goals. Purchase, refinance, and investment financing.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/lenders',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function LendersPage() {
  return (
    <main>
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
              Click a lender for their profile, NMLS details, and contact info. Reach out directly by email or phone.
            </p>
          </header>
          <div className="lenders-list-wrap">
            <LendersList lenders={lenders} />
          </div>
        </div>
      </section>
    </main>
  );
}
