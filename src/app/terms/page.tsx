import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms of use for the Brantley Christianson Real Estate website and services.',
  openGraph: { url: '/terms' },
  twitter: { card: 'summary_large_image' },
};

export default function TermsPage() {
  return (
    <main>
      <Hero
        title="Terms of Use"
        lead="Terms governing use of our website and services."
        variant="short"
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Meeting table"
        priority={false}
      />

      <section className="section" aria-labelledby="terms-content-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="terms-content-heading" className="sr-only">
            Terms of use content
          </h2>
          <div className="about-content stack--lg">
            <p className="about-lead">
              Welcome to Brantley Christianson Real Estate (&quot;BCRE&quot;). By using our website (brantleychristianson.com), you agree to these terms of use.
            </p>
            <p>
              <strong>Use of the site.</strong> Our site is for general information and to help you learn about our brokerage and request consultations. You may not use the site for any unlawful purpose, to transmit harmful code, or to interfere with the site or our systems. Content on the site (text, images, listings) is for informational purposes; we do not guarantee its completeness or accuracy.
            </p>
            <p>
              <strong>Real estate services.</strong> Contacting us through the site does not create a client relationship. Real estate services are subject to separate agreements and applicable law in Oregon and Washington. Listing details and availability are subject to change.
            </p>
            <p>
              <strong>Intellectual property.</strong> The BCRE name, logo, and site content are owned by Brantley Christianson Real Estate or our licensors. You may not copy, modify, or use our marks or content for commercial purposes without permission.
            </p>
            <p>
              <strong>Limitation of liability.</strong> To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the site. Our total liability is limited to the amount you paid us, if any, in the twelve months preceding the claim.
            </p>
            <p>
              <strong>Changes.</strong> We may update these terms at any time. Continued use of the site after changes constitutes acceptance. For questions, contact us at info@brantleychristianson.com.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
              Last updated: March 2026
            </p>
          </div>
          <p className="text-center">
            <Button href="/contact" variant="outline">
              Contact us
            </Button>
          </p>
        </div>
      </section>
    </main>
  );
}
