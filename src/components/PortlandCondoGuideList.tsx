'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PortlandCondoEntry } from '@/data/portland-condo-guide-types';
import { CONDITION_COLOR_LEGEND } from '@/data/portland-condo-guide-types';
import { assetPaths } from '@/config/theme';
import { portlandCondoNeighborhoods } from '@/data/portland-condo-guide';
import { trackEvent } from '@/lib/analytics';

const STOCK_PLACEHOLDER = `${assetPaths.stock}/living.jpeg`;

function CondoCardImage({
  src,
  alt,
  fill,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const effectiveSrc = !src || useFallback ? STOCK_PLACEHOLDER : src;
  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      loading="lazy"
      onError={() => setUseFallback(true)}
    />
  );
}

export type CondoSort = 'name' | 'medianPrice' | 'medianPriceDesc' | 'hoa' | 'hoaEfficiency' | 'taxEfficiency' | 'yearBuilt' | 'daysOnMarket';

function formatPrice(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function sortCondos(list: PortlandCondoEntry[], sort: CondoSort): PortlandCondoEntry[] {
  const copy = [...list];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'medianPrice':
      return copy.sort((a, b) => a.medianPrice - b.medianPrice);
    case 'medianPriceDesc':
      return copy.sort((a, b) => b.medianPrice - a.medianPrice);
    case 'hoa':
      return copy.sort((a, b) => a.averageMonthlyHoa - b.averageMonthlyHoa);
    case 'hoaEfficiency':
      return copy.sort((a, b) => a.hoaPriceRatio - b.hoaPriceRatio);
    case 'taxEfficiency':
      return copy.sort((a, b) => a.taxPriceRatio - b.taxPriceRatio);
    case 'yearBuilt':
      return copy.sort((a, b) => b.yearBuilt - a.yearBuilt);
    case 'daysOnMarket':
      return copy.sort((a, b) => a.medianDaysOnMarket - b.medianDaysOnMarket);
    default:
      return copy;
  }
}

export interface PortlandCondoGuideListProps {
  condos: PortlandCondoEntry[];
}

const SORT_OPTIONS: { value: CondoSort; label: string }[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'medianPrice', label: 'Median price (low–high)' },
  { value: 'medianPriceDesc', label: 'Median price (high–low)' },
  { value: 'hoa', label: 'HOA (low–high)' },
  { value: 'hoaEfficiency', label: 'HOA efficiency (best first)' },
  { value: 'taxEfficiency', label: 'Tax efficiency (best first)' },
  { value: 'yearBuilt', label: 'Year built (newest)' },
  { value: 'daysOnMarket', label: 'Days on market' },
];

export function PortlandCondoGuideList({ condos }: PortlandCondoGuideListProps) {
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [financialFilter, setFinancialFilter] = useState<'all' | 'green'>('all');
  const [sort, setSort] = useState<CondoSort>('name');

  const filtered = useMemo(() => {
    let list = condos;
    if (neighborhood !== 'all') {
      list = list.filter((c) => c.neighborhood === neighborhood);
    }
    if (financialFilter === 'green') {
      list = list.filter((c) => c.colorCode === 'GREEN');
    }
    return list;
  }, [condos, neighborhood, financialFilter]);

  const sorted = useMemo(() => sortCondos(filtered, sort), [filtered, sort]);

  const hasActiveFilters = neighborhood !== 'all' || financialFilter !== 'all';

  const handleResetFilters = () => {
    setNeighborhood('all');
    setFinancialFilter('all');
    trackEvent('guide_filters_reset', {});
  };

  return (
    <div className="condo-guide">
      <div className="condo-guide-intro">
        <p className="condo-guide-intro-text">
          Use the filters to narrow Portland condominium buildings by neighborhood, financial position, and how the building behaves in the market.
        </p>
        <ul className="condo-guide-personas" aria-label="Suggested ways to use this guide">
          <li>
            <strong>Investors:</strong> start with <em>Green only</em> financials and sort by HOA or tax efficiency.
          </li>
          <li>
            <strong>First-time buyers:</strong> filter to your target neighborhood, then sort by median price (low–high).
          </li>
          <li>
            <strong>Downsizers:</strong> filter to elevator-friendly neighborhoods and scan amenities and HOA levels.
          </li>
        </ul>
      </div>
      <p className="condo-guide-legend" aria-label="Financial indicator legend">
        <span className="condo-guide-legend-item">
          <span className="condo-guide-color condo-guide-color--green" aria-hidden /> Green: stronger financial position
        </span>
        <span className="condo-guide-legend-item">
          <span className="condo-guide-color condo-guide-color--yellow" aria-hidden /> Yellow: moderate
        </span>
        <span className="condo-guide-legend-item">
          <span className="condo-guide-color condo-guide-color--red" aria-hidden /> Red: higher cost or special assessment
        </span>
      </p>
      <div className="condo-guide-toolbar">
        <div className="condo-guide-toolbar-group">
          <label htmlFor="condo-financial" className="condo-guide-label">
            Financial position
          </label>
          <select
            id="condo-financial"
            value={financialFilter}
            onChange={(e) => {
              const next = e.target.value as 'all' | 'green';
              setFinancialFilter(next);
              trackEvent('guide_filter_change', {
                filter: 'financial',
                value: next,
              });
            }}
            className="condo-guide-select"
            aria-label="Filter by financial position"
          >
            <option value="all">All buildings</option>
            <option value="green">Green only</option>
          </select>
        </div>
        <div className="condo-guide-toolbar-group">
          <label htmlFor="condo-neighborhood" className="condo-guide-label">
            Neighborhood
          </label>
          <select
            id="condo-neighborhood"
            value={neighborhood}
            onChange={(e) => {
              const nextNeighborhood = e.target.value;
              setNeighborhood(nextNeighborhood);
              trackEvent('guide_filter_change', {
                filter: 'neighborhood',
                value: nextNeighborhood,
              });
            }}
            className="condo-guide-select"
            aria-label="Filter by neighborhood"
          >
            <option value="all">All neighborhoods</option>
            {portlandCondoNeighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="condo-guide-toolbar-group">
          <label htmlFor="condo-sort" className="condo-guide-label">
            Sort by
          </label>
          <select
            id="condo-sort"
            value={sort}
            onChange={(e) => {
              const nextSort = e.target.value as CondoSort;
              setSort(nextSort);
              trackEvent('guide_sort_change', {
                sort: nextSort,
              });
            }}
            className="condo-guide-select"
            aria-label="Sort condos"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="condo-guide-toolbar-summary">
          <p className="condo-guide-count" aria-live="polite">
            {sorted.length} building{sorted.length !== 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <div className="condo-guide-active-filters">
              <span className="condo-guide-active-label">Filters:</span>
              {neighborhood !== 'all' && (
                <span className="condo-guide-chip">
                  Neighborhood: {neighborhood}
                </span>
              )}
              {financialFilter === 'green' && (
                <span className="condo-guide-chip">Green buildings only</span>
              )}
              <button
                type="button"
                className="condo-guide-reset"
                onClick={handleResetFilters}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="condo-guide-empty" role="status">
          <p className="condo-guide-empty-title">No buildings match your filters</p>
          <p className="condo-guide-empty-body">
            Try changing the neighborhood or financial position filters, or reset to see all
            buildings.
          </p>
          <button
            type="button"
            className="condo-guide-reset"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className="condo-guide-grid" role="list">
          {sorted.map((condo) => (
            <li key={condo.id}>
              <article className="condo-guide-card">
                <Link href={condo.url} className="condo-guide-card-link">
                  <span className="condo-guide-card-image-wrap">
                    <CondoCardImage
                      src={condo.image || ''}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="condo-guide-card-img"
                    />
                    <span
                      className={`condo-guide-color condo-guide-color--${condo.colorCode.toLowerCase()}`}
                      title={CONDITION_COLOR_LEGEND[condo.colorCode]}
                      aria-hidden
                    />
                  </span>
                  <div className="condo-guide-card-body">
                    <div className="condo-guide-card-header">
                      <span className="condo-guide-card-thumb-wrap">
                        <CondoCardImage
                          src={condo.image || ''}
                          alt=""
                          fill
                          sizes="80px"
                          className="condo-guide-card-thumb-img"
                        />
                      </span>
                      <div className="condo-guide-card-title-block">
                        <h2 className="condo-guide-card-name">{condo.name}</h2>
                        <p className="condo-guide-card-neighborhood">{condo.neighborhood}</p>
                      </div>
                    </div>
                    <p className="condo-guide-card-address">{condo.address}</p>
                    <dl className="condo-guide-card-stats">
                      <div>
                        <dt>Median price</dt>
                        <dd>{formatPrice(condo.medianPrice)}</dd>
                      </div>
                      <div>
                        <dt>HOA</dt>
                        <dd>${condo.averageMonthlyHoa.toLocaleString()}/mo</dd>
                      </div>
                      <div>
                        <dt>$/sq ft</dt>
                        <dd>${condo.avgPricePerSqFt.toFixed(0)}</dd>
                      </div>
                      <div>
                        <dt>Built</dt>
                        <dd>{condo.yearBuilt}</dd>
                      </div>
                      <div>
                        <dt>Stories</dt>
                        <dd>{condo.stories}</dd>
                      </div>
                      <div>
                        <dt>DOM</dt>
                        <dd>{Math.round(condo.medianDaysOnMarket)}</dd>
                      </div>
                      <div>
                        <dt>Tax ratio</dt>
                        <dd>{condo.taxPriceRatio.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt>HOA ratio</dt>
                        <dd>{condo.hoaPriceRatio.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt>Rent cap</dt>
                        <dd>{condo.rentCap}</dd>
                      </div>
                      <div>
                        <dt>Concierge</dt>
                        <dd>{condo.concierge}</dd>
                      </div>
                      <div>
                        <dt>Parking</dt>
                        <dd>{condo.parking}</dd>
                      </div>
                      <div>
                        <dt>Special assess.</dt>
                        <dd>{condo.specialAssessment}</dd>
                      </div>
                    </dl>
                    {condo.amenities.length > 0 && (
                      <p className="condo-guide-card-amenities">
                        {condo.amenities.slice(0, 5).join(' · ')}
                        {condo.amenities.length > 5 && ` +${condo.amenities.length - 5}`}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
