/**
 * Reusable market stats block. Uses same card style as PortlandMarketHighlights.
 * Pass pre-fetched stats from server (e.g. /api/market/stats) or static data.
 */

export interface MarketStatsData {
  medianListPrice?: number;
  averageListPrice?: number;
  count?: number;
}

export interface MarketStatsProps {
  /** Pre-fetched or static stats */
  stats: MarketStatsData;
  /** e.g. "RMLS" or "Repliers" */
  sourceLabel?: string;
  /** Optional "Data as of" or verified date */
  asOf?: string;
  /** Section heading id for aria-labelledby */
  headingId?: string;
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function MarketStats({
  stats,
  sourceLabel = 'RMLS',
  asOf,
  headingId = 'market-stats-heading',
}: MarketStatsProps) {
  const { medianListPrice, averageListPrice, count } = stats;
  const cards: Array<{ id: string; label: string; value: string; icon: 'price' | 'ruler' | 'target'; ariaLabel: string }> = [];
  if (medianListPrice != null) {
    cards.push({
      id: 'median-price',
      label: 'Median List Price',
      value: formatPrice(medianListPrice),
      icon: 'price',
      ariaLabel: 'Median list price',
    });
  }
  if (averageListPrice != null && averageListPrice !== medianListPrice) {
    cards.push({
      id: 'avg-price',
      label: 'Average List Price',
      value: formatPrice(averageListPrice),
      icon: 'ruler',
      ariaLabel: 'Average list price',
    });
  }
  if (count != null) {
    cards.push({
      id: 'count',
      label: 'Active Listings',
      value: String(count),
      icon: 'target',
      ariaLabel: 'Number of active listings',
    });
  }
  if (cards.length === 0) return null;

  const sourceText = [asOf, sourceLabel].filter(Boolean).join(' · ');

  return (
    <section
      className="portland-highlights market-stats-block"
      aria-labelledby={headingId}
    >
      <div className="container">
        <p id={headingId} className="sr-only">
          Market statistics
        </p>
        {sourceText && (
          <div className="portland-highlights-verified" aria-hidden>
            {sourceText}
          </div>
        )}
        <ul className="portland-highlights-grid" role="list">
          {cards.map((card) => (
            <li key={card.id}>
              <article
                className="portland-stat-card"
                aria-label={card.ariaLabel}
              >
                <span
                  className={`portland-stat-card__icon portland-stat-card__icon--${card.icon}`}
                  aria-hidden
                >
                  {card.icon === 'price' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  )}
                  {card.icon === 'ruler' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" />
                      <path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" />
                    </svg>
                  )}
                  {card.icon === 'target' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                    </svg>
                  )}
                </span>
                <div className="portland-stat-card__content">
                  <span className="portland-stat-card__value">{card.value}</span>
                  <span className="portland-stat-card__label">{card.label}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
