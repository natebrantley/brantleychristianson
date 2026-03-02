import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import { site } from '@/data/site';

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    href: site.social.instagram,
    handle: '@brantleychristianson',
    tagline: 'Daily stories, listings, and behind-the-scenes from our brokers.',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: site.social.facebook,
    handle: '@brantleychristianson',
    tagline: 'Longer-form updates, event highlights, and market notes.',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    href: site.social.linkedin,
    handle: '@natebrantley',
    tagline: 'Broker spotlights, market commentary, and company news.',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: site.social.youtube,
    handle: '@brantleychristianson',
    tagline: 'Featured listings, video walkthroughs, and condo tours.',
  },
].filter((s) => s.href);

export const metadata = {
  title: 'Social | Brantley Christianson Real Estate',
  description:
    'Follow Brantley Christianson Real Estate on Instagram, Facebook, LinkedIn, and YouTube for listings, market insights, broker stories, and featured video tours.',
};

export default function SocialPage() {
  return (
    <main>
      <Hero
        title="Connect with Brantley Christianson online."
        lead="Follow along for listings, market insights, and the people behind BCRE across Oregon and Washington."
        variant="short"
        imageSrc={`${assetPaths.markets}/pdx_skyline_2.jpeg`}
        imageAlt="Portland skyline at dusk"
        priority
      >
        {site.social.instagram && (
          <Button href={site.social.instagram} variant="white">
            Follow on Instagram
          </Button>
        )}
        <Button href="/contact" variant="outline">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="social-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Connect</p>
            <h1 id="social-heading" className="section-title">
              Where to find us online
            </h1>
            <p className="section-lead mx-auto">
              Choose the channel that fits you best. However you follow along, you&apos;ll see
              Pacific Northwest listings, market context, and real stories from our brokers.
            </p>
          </header>

          {SOCIAL_LINKS.length > 0 ? (
            <ul className="social-links-list social-links-list--cards" aria-label="BCRE social channels">
              {SOCIAL_LINKS.map(({ key, label, href, handle, tagline }) => (
                <li key={key} className="social-links-item">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link social-link--card"
                  >
                    <span
                      className={`social-link-icon social-link-icon--${key}`}
                      aria-hidden="true"
                    >
                      {key === 'instagram'
                        ? 'IG'
                        : key === 'facebook'
                          ? 'f'
                          : key === 'linkedin'
                            ? 'in'
                            : '▶'}
                    </span>
                    <span className="social-link-label">{label}</span>
                    <span className="social-link-handle">{handle}</span>
                    <span className="social-link-tagline">{tagline}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </main>
  );
}

