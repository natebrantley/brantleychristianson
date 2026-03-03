import {
  portlandMarketStats,
  PORTLAND_MARKET_VERIFIED,
} from '@/data/portland-market';

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

const cards = [
  {
    id: 'median-price',
    label: 'Median Sold Price',
    value: formatPrice(portlandMarketStats.medianSoldPrice),
    icon: 'price',
    ariaLabel: 'Median sold price',
  },
  {
    id: 'market-speed',
    label: 'Market Speed',
    value: `${portlandMarketStats.avgDaysToPending} Days to Pending`,
    icon: 'lightning',
    ariaLabel: 'Average market speed',
  },
  {
    id: 'price-sqft',
    label: 'Price per Sq Ft',
    value: `$${portlandMarketStats.medianPricePerSqFt}`,
    icon: 'ruler',
    ariaLabel: 'Median price per square foot',
  },
  {
    id: 'sale-to-list',
    label: 'Sale-to-List',
    value: `${portlandMarketStats.saleToListRatio}%`,
    sub: 'Full asking price',
    icon: 'target',
    ariaLabel: 'Sale to list ratio',
  },
] as const;

export function PortlandMarketHighlights() {
  return (
    <section
      className="portland-highlights"
      aria-labelledby="portland-highlights-heading"
    >
      <div className="container">
        <p id="portland-highlights-heading" className="sr-only">
          Portland market highlights
        </p>
        <div className="portland-highlights-verified" aria-hidden>
          Verified {PORTLAND_MARKET_VERIFIED} · Trend: {portlandMarketStats.trend}
        </div>
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  )}
                  {card.icon === 'lightning' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  )}
                  {card.icon === 'ruler' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></svg>
                  )}
                  {card.icon === 'target' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                  )}
                </span>
                <div className="portland-stat-card__content">
                  <span className="portland-stat-card__value">{card.value}</span>
                  <span className="portland-stat-card__label">{card.label}</span>
                  {'sub' in card && card.sub && (
                    <span className="portland-stat-card__sub">{card.sub}</span>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
