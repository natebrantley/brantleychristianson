import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { RevealSection } from '@/components/RevealSection';
import { assetPaths } from '@/config/theme';
import { buildPageMetadata } from '@/config/site';
import { INSIGHTS_ARTICLES } from '@/data/insights';
import type { Metadata } from 'next';

const title = 'Insights';
const description =
  'Hyper-localized, SEO-optimized articles on Pacific Northwest real estate. Deep dives into market segments, neighborhoods, and data-driven insights from BCRE.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/insights',
  ogImageAlt: 'BCRE Insights – market insights and local content',
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function InsightsPage() {
  const articles = [...INSIGHTS_ARTICLES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="insights-page">
      <Hero
        title="Insights"
        lead="Hyper-localized content and deep dives into Pacific Northwest market segments. SEO-optimized articles for buyers, sellers, and investors."
        variant="short"
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="BCRE Insights – market insights and research"
        priority
      >
        <Button href="/contact" variant="white">
          Talk to a broker
        </Button>
        <Button href="/markets" variant="outline">
          Explore markets
        </Button>
      </Hero>

      <section className="section" aria-labelledby="insights-list-heading">
        <div className="container stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Blog</p>
            <h2 id="insights-list-heading" className="section-title">
              Articles &amp; market deep dives
            </h2>
            <p className="section-lead mx-auto">
              Data-driven, locally focused articles to help you understand neighborhoods, segments, and trends across Oregon and Washington.
            </p>
          </header>
          <RevealSection>
            {articles.length > 0 ? (
              <ul className="insights-list" aria-label="Insights articles">
                {articles.map((article) => (
                  <li key={article.slug} className="insights-list-item">
                    <article className="insight-card">
                      <p className="insight-card-meta">
                        <time dateTime={article.date}>{formatDate(article.date)}</time>
                        {article.marketSegment && (
                          <span className="insight-card-segment"> · {article.marketSegment}</span>
                        )}
                      </p>
                      <h3 className="insight-card-title">
                        <Link href={`/insights/${article.slug}`}>{article.title}</Link>
                      </h3>
                      <p className="insight-card-excerpt">{article.excerpt}</p>
                      <Button href={`/insights/${article.slug}`} variant="outline">
                        Read article
                      </Button>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text--muted">No articles yet. Check back soon.</p>
            )}
          </RevealSection>
        </div>
      </section>
    </main>
  );
}
