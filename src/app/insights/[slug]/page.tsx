import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';
import { SITE_URL, buildPageMetadata } from '@/config/site';
import { getInsightBySlug, getAllInsightSlugs } from '@/data/insights';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllInsightSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightBySlug(slug);
  if (!article) return { title: 'Not found' };
  return buildPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/insights/${slug}`,
    ogImageAlt: `${article.title} – BCRE Insights`,
  });
}

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

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getInsightBySlug(slug);
  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    url: `${SITE_URL}/insights/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'Brantley Christianson Real Estate',
      url: SITE_URL,
    },
    ...(article.keywords?.length && { keywords: article.keywords.join(', ') }),
  };

  return (
    <main className="insight-article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero
        variant="short"
        title={article.title}
        lead={article.excerpt}
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt=""
        priority
      >
        <Button href="/insights" variant="white">
          All Insights
        </Button>
      </Hero>

      <section className="section" aria-labelledby="insight-article-heading">
        <div className="container container-narrow stack--lg">
          <nav className="insight-article-back" aria-label="Breadcrumb">
            <Link href="/insights" className="text--muted" style={{ fontSize: '0.875rem' }}>
              ← Insights
            </Link>
          </nav>
          <header className="insight-article-header">
            <p className="insight-article-meta">
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              {article.marketSegment && (
                <span className="insight-article-segment"> · {article.marketSegment}</span>
              )}
            </p>
            <h1 id="insight-article-heading" className="insight-article-title">
              {article.title}
            </h1>
          </header>
          <div
            className="insight-article-body prose"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
          <p>
            <Button href="/insights" variant="outline">
              Back to Insights
            </Button>
          </p>
        </div>
      </section>
    </main>
  );
}
