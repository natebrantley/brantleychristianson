'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PortlandCondoEntry } from '@/data/portland-condo-guide-types';
import { portlandCondoNeighborhoods } from '@/data/portland-condo-guide';

export type CondoSort = 'name' | 'medianPrice' | 'medianPriceDesc' | 'hoa' | 'yearBuilt' | 'daysOnMarket';

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
  { value: 'yearBuilt', label: 'Year built (newest)' },
  { value: 'daysOnMarket', label: 'Days on market' },
];

export function PortlandCondoGuideList({ condos }: PortlandCondoGuideListProps) {
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [sort, setSort] = useState<CondoSort>('name');

  const filtered = useMemo(() => {
    if (neighborhood === 'all') return condos;
    return condos.filter((c) => c.neighborhood === neighborhood);
  }, [condos, neighborhood]);

  const sorted = useMemo(() => sortCondos(filtered, sort), [filtered, sort]);

  return (
    <div className="condo-guide">
      <div className="condo-guide-toolbar">
        <div className="condo-guide-toolbar-group">
          <label htmlFor="condo-neighborhood" className="condo-guide-label">
            Neighborhood
          </label>
          <select
            id="condo-neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
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
            onChange={(e) => setSort(e.target.value as CondoSort)}
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
        <p className="condo-guide-count" aria-live="polite">
          {sorted.length} building{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ul className="condo-guide-grid" role="list">
        {sorted.map((condo) => (
          <li key={condo.id}>
            <article className="condo-guide-card">
              <Link href={condo.url} className="condo-guide-card-link">
                <span className="condo-guide-card-image-wrap">
                  <Image
                    src={condo.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="condo-guide-card-img"
                    loading="lazy"
                  />
                  <span
                    className={`condo-guide-color condo-guide-color--${condo.colorCode.toLowerCase()}`}
                    title={`Market indicator: ${condo.colorCode}`}
                    aria-hidden
                  />
                </span>
                <div className="condo-guide-card-body">
                  <h2 className="condo-guide-card-name">{condo.name}</h2>
                  <p className="condo-guide-card-neighborhood">{condo.neighborhood}</p>
                  <p className="condo-guide-card-address">{condo.address}</p>
                  <dl className="condo-guide-card-stats">
                    <div>
                      <dt>Median price</dt>
                      <dd>{formatPrice(condo.medianPrice)}</dd>
                    </div>
                    <div>
                      <dt>HOA</dt>
                      <dd>${condo.averageMonthlyHoa}/mo</dd>
                    </div>
                    <div>
                      <dt>Built</dt>
                      <dd>{condo.yearBuilt}</dd>
                    </div>
                    <div>
                      <dt>Rent cap</dt>
                      <dd>{condo.rentCap}</dd>
                    </div>
                  </dl>
                  {condo.amenities.length > 0 && (
                    <p className="condo-guide-card-amenities">
                      {condo.amenities.slice(0, 4).join(' · ')}
                      {condo.amenities.length > 4 && ` +${condo.amenities.length - 4}`}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
