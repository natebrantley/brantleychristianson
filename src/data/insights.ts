/**
 * Insights blog: hyper-localized, SEO-optimized articles on market segments.
 * Add entries here; article pages use slug for routes and metadata.
 */

export type InsightArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  /** Comma-separated or array for display (e.g. "Portland, Condos") */
  marketSegment: string;
  /** Optional keywords for meta and SEO */
  keywords?: string[];
  /** HTML content for the article body (generated or authored) */
  body: string;
};

/** All insights articles, newest first. */
export const INSIGHTS_ARTICLES: InsightArticle[] = [
  {
    slug: 'welcome-to-insights',
    title: 'Welcome to Insights',
    excerpt:
      'Hyper-localized content and deep dives into Pacific Northwest market segments. Start here to see what’s coming.',
    date: '2026-03-07',
    marketSegment: 'Pacific Northwest',
    keywords: ['market insights', 'Pacific Northwest real estate', 'BCRE'],
    body: `
      <p>Insights is BCRE’s blog for <strong>generated, hyper-localized content</strong> and SEO-optimized articles. We’ll publish deep dives into:</p>
      <ul>
        <li>Neighborhood and city-level market trends</li>
        <li>Condo and single-family segments across Portland and SW Washington</li>
        <li>Coast, Mt. Hood, and mid-valley markets</li>
        <li>Data-driven takeaways from RMLS and local sources</li>
      </ul>
      <p>Each article is written to help serious buyers and sellers understand their specific market—and to rank for the kinds of searches that reflect real intent. Check back as we add more articles, or <a href="/contact">get in touch</a> for a consultation.</p>
    `.trim(),
  },
];

export function getInsightBySlug(slug: string): InsightArticle | undefined {
  return INSIGHTS_ARTICLES.find((a) => a.slug === slug);
}

export function getAllInsightSlugs(): string[] {
  return INSIGHTS_ARTICLES.map((a) => a.slug);
}
