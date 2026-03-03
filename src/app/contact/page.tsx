import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { ConsultationForm } from '@/components/ConsultationForm';
import { assetPaths } from '@/config/theme';
import { SITE_URL } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Request a Consultation';
const description =
  'Get a tailored real estate or market consultation. Tell us your goals—buying, selling, or learning the market—and we’ll connect you with a BCRE broker in Oregon or Washington.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: `${SITE_URL}/contact`,
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Request a Consultation',
  description: 'Get in touch with Brantley Christianson Real Estate for a tailored consultation.',
  url: `${SITE_URL}/contact`,
  mainEntity: {
    '@type': 'RealEstateAgent',
    name: 'Brantley Christianson Real Estate',
    url: SITE_URL,
    areaServed: [{ '@type': 'State', name: 'Oregon' }, { '@type': 'State', name: 'Washington' }],
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
    <main>
      <Hero
        title="Request a tailored real estate or market consultation."
        lead="Tell us whether you’re buying, selling, or just learning the market. We’ll connect you with a broker who fits your goals."
        variant="short"
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt="Living room"
        priority
      >
        <Button href="#consultation" variant="white">
          Start your consultation
        </Button>
      </Hero>

      <section
        id="consultation"
        className="section section--alt"
        aria-labelledby="consultation-heading"
      >
        <div className="container container-narrow stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Consultation</p>
            <h2 id="consultation-heading" className="section-title">
              Request a consultation
            </h2>
            <p className="section-lead mx-auto">
              Tell us about your goals. A BCRE broker will follow up to schedule a time to talk.
            </p>
            <p className="consultation-trust text-center mx-auto">
              We typically respond within one business day. No spam—just a direct reply from our team.
            </p>
          </header>
          <div className="consultation-form-wrap">
            <ConsultationForm source="contact-page" market="multi-market" />
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
