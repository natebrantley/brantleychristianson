import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import { site } from '@/data/site';
import type { Metadata } from 'next';

/** Extract YouTube playlist ID from a playlist URL for embedding */
function getYoutubePlaylistId(url: string): string | null {
  const match = url?.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

const SOCIAL_LINKS = [
  {
    key: 'youtube',
    label: 'YouTube',
    href: site.social.youtube,
    handle: '@brantleychristianson',
    tagline: 'Featured listings, video walkthroughs, and condo tours.',
  },
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
].filter((s) => s.href);

const title = 'Connect on Social';
const description =
  'Follow Brantley Christianson Real Estate on Instagram, Facebook, LinkedIn, and YouTube for listings, market insights, broker stories, and featured video tours.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    url: '/social',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function SocialPage() {
  const youtubePlaylistId = getYoutubePlaylistId(site.social.youtube ?? '');

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

      {youtubePlaylistId && (
        <section
          className="section section--alt social-youtube-featured"
          aria-labelledby="youtube-playlist-heading"
        >
          <div className="container stack--xl">
            <header className="stack--md text-center mx-auto social-youtube-featured__header">
              <p className="section-tag">Featured</p>
              <h2 id="youtube-playlist-heading" className="section-title">
                Featured listings on YouTube
              </h2>
              <p className="section-lead mx-auto" style={{ maxWidth: '42ch' }}>
                Video walkthroughs and condo tours from our brokers. Watch below or open the
                playlist on YouTube.
              </p>
            </header>
            <div className="social-youtube-featured__embed-wrap">
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${youtubePlaylistId}`}
                title="BCRE featured listings playlist on YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="social-youtube-featured__embed"
              />
            </div>
            <p className="text-center">
              <Button
                href={site.social.youtube}
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch full playlist on YouTube
              </Button>
            </p>
          </div>
        </section>
      )}

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

