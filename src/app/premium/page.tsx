import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { PremiumSignInButton } from '@/components/PremiumSignInButton';
import { assetPaths } from '@/config/theme';
import { buildPageMetadata } from '@/config/site';
import { PREMIUM_RESOURCES } from '@/data/premium-resources';
import type { Metadata } from 'next';

const title = 'Premium resources';
const description =
  'Free high-value guides and data for serious buyers and sellers. Sign in (free) to access the 2026 Portland Condo Guide and other premium resources from BCRE.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/premium',
  ogImageAlt: 'BCRE premium resources',
});

export default async function PremiumPage() {
  const { userId } = await auth();

  return (
    <main className="premium-page">
      <Hero
        title="Premium resources"
        lead={
          userId
            ? 'Free high-value guides and data for serious buyers and sellers. Full access to the condo guide and more.'
            : 'Free high-value guides — sign in (no cost) to access the 2026 Portland Condo Guide and other premium resources.'
        }
        variant="short"
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Premium resources – BCRE"
        priority
      >
        {userId ? (
          <Button href="/premium/portland-condo-guide" variant="white">
            2026 Portland Condo Guide
          </Button>
        ) : (
          <PremiumSignInButton redirectUrl="/premium" className="button button--white">
            Sign in to access (free)
          </PremiumSignInButton>
        )}
        <Button href="/contact" variant="outline">
          Request a consultation
        </Button>
      </Hero>

      <section className="section" aria-labelledby="premium-list-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Guides</p>
            <h2 id="premium-list-heading" className="section-title">
              {userId ? 'Your premium resources' : 'Free — sign in to access'}
            </h2>
            <p className="section-lead mx-auto">
              {userId
                ? 'Click through to use the full guides and data.'
                : 'Premium resources are free. Sign in to view the full building list, filters, and sortable data for each guide.'}
            </p>
          </header>
          <RevealSection>
            {userId ? (
              <div className="resource-grid" aria-label="Premium resources">
                {PREMIUM_RESOURCES.map((resource) => (
                  <article key={resource.slug} className="resource-card">
                    <h3 className="resource-card-title">
                      <Link href={resource.href}>{resource.title}</Link>
                    </h3>
                    <p className="resource-card-body">{resource.excerpt}</p>
                    <p className="resource-card-meta">
                      Focus: <strong>Premium</strong>
                    </p>
                    <Button href={resource.href} variant="outline">
                      View guide
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="resource-grid" aria-label="Premium resources teaser">
                {PREMIUM_RESOURCES.map((resource) => (
                  <article key={resource.slug} className="resource-card resource-card--teaser">
                    <h3 className="resource-card-title">{resource.title}</h3>
                    <p className="resource-card-body">{resource.excerpt}</p>
                    <p className="resource-card-meta">Free — sign in to access</p>
                  </article>
                ))}
              </div>
            )}
          </RevealSection>
          {!userId && (
            <div className="premium-cta" style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <PremiumSignInButton redirectUrl="/premium" className="button button--primary">
                Sign in to access (free)
              </PremiumSignInButton>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
