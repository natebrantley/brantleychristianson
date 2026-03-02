import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { ConsultationForm } from '@/components/ConsultationForm';
import { assetPaths } from '@/config/theme';
import { site } from '@/data/site';

const SOCIAL_LINKS = [
  { label: 'Instagram', href: site.social.instagram, icon: 'Instagram' },
  { label: 'Facebook', href: site.social.facebook, icon: 'Facebook' },
  { label: 'LinkedIn', href: site.social.linkedin, icon: 'LinkedIn' },
].filter((s) => s.href);

export const metadata = {
  title: 'Contact | Brantley Christianson Real Estate',
  description:
    'Get in touch with BCRE. Request a consultation or connect with us on social. Portland metro, SW Washington, the coast & Mt. Hood.',
};

export default function ContactPage() {
  return (
    <main>
      <Hero
        title="Request a tailored real estate or market consultation."
        lead="Tell us whether you’re buying, selling, or just learning the market. We’ll connect you with a broker who fits your goals."
        variant="short"
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="#consultation" variant="white">
          Start your consultation
        </Button>
      </Hero>

      <section id="social" className="section" aria-labelledby="social-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Connect</p>
            <h2 id="social-heading" className="section-title">
              Follow BCRE
            </h2>
            <p className="section-lead mx-auto">
              Stay in the loop on listings, market insights, and news from our team.
            </p>
          </header>
          {SOCIAL_LINKS.length > 0 ? (
            <nav className="social-links" aria-label="Social media">
              <ul className="social-links-list">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

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
          </header>
          <div className="consultation-form-wrap">
            <ConsultationForm source="contact-page" market="multi-market" />
          </div>
        </div>
      </section>
    </main>
  );
}
