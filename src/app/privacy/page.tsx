import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import { buildPageMetadata } from '@/config/site';
import type { Metadata } from 'next';

const title = 'Privacy Policy';
const description =
  'How Brantley Christianson Real Estate collects, uses, and protects your information. Oregon and Washington.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/privacy',
  ogImageAlt: 'BCRE privacy policy',
});

export default function PrivacyPage() {
  return (
    <main>
      <Hero
        title="Privacy Policy"
        lead="How we collect, use, and protect your information."
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Office environment"
        priority={false}
      />

      <section className="section" aria-labelledby="privacy-content-heading">
        <div className="container container-narrow stack--xl">
          <h2 id="privacy-content-heading" className="sr-only">
            Privacy policy content
          </h2>
          <div className="about-content stack--lg">
            <p className="about-lead">
              Brantley Christianson Real Estate (&quot;BCRE,&quot; &quot;we,&quot; &quot;us&quot;) respects your privacy. This policy describes how we handle information when you use our website or contact us.
            </p>
            <p>
              <strong>Information we collect.</strong> When you request a consultation or otherwise get in touch, we collect the information you provide (such as name, email, phone, and message). We use this to respond to you and to provide real estate services. We may also collect technical data (e.g., IP address, browser type) when you visit our site.
            </p>
            <p>
              <strong>How we use it.</strong> We use your information to communicate with you, schedule consultations, and improve our services. We do not sell your personal information to third parties. We may share information with service providers (e.g., email/CRM tools) that help us operate our business, under agreements that protect your data.
            </p>
            <p>
              <strong>Cookies and analytics.</strong> We may use cookies and similar technologies for site functionality and analytics (e.g., Google Analytics) to understand how visitors use our site. You can control cookies through your browser settings.
            </p>
            <p>
              <strong>Security.</strong> We take reasonable steps to protect your information. No method of transmission over the internet is 100% secure; we encourage you to use caution when sharing sensitive data.
            </p>
            <p>
              <strong>Your choices.</strong> You may request access to or correction of your information, or ask us to stop using it for marketing, by contacting us at info@brantleychristianson.com.
            </p>
            <p>
              <strong>Updates.</strong> We may update this policy from time to time. The &quot;Last updated&quot; date below reflects the latest change. Continued use of our site after changes constitutes acceptance of the updated policy.
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
