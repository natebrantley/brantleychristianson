'use client';

import { useMemo, useState } from 'react';
import type { Lender } from '@/data/types';
import { LendersList } from '@/components/LendersList';

export interface LendersFilterableProps {
  lenders: Lender[];
}

const SORT_AZ = 'a-z';
const SORT_ZA = 'z-a';
type SortOrder = typeof SORT_AZ | typeof SORT_ZA;

/** State/license code labels for display */
const LICENSE_LABELS: Record<string, string> = {
  WA: 'Washington',
  OR: 'Oregon',
  CA: 'California',
  MT: 'Montana',
  FL: 'Florida',
};

function getLicenseLabel(code: string): string {
  return LICENSE_LABELS[code] ?? code;
}

/** Last word of display name (last name); falls back to full name if single word */
function getLastName(fullName: string): string {
  const trimmed = fullName.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace === -1 ? trimmed : trimmed.slice(lastSpace + 1);
}

export function LendersFilterable({ lenders }: LendersFilterableProps) {
  const [location, setLocation] = useState<string>('all');
  const [language, setLanguage] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SORT_AZ);

  const locations = useMemo(() => {
    const set = new Set<string>();
    lenders.forEach((l) => l.licenses.forEach((code) => set.add(code)));
    return Array.from(set).sort();
  }, [lenders]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    lenders.forEach((l) => (l.languages ?? []).forEach((lang) => set.add(lang)));
    return Array.from(set).sort();
  }, [lenders]);

  const filteredAndSorted = useMemo(() => {
    let list = lenders;

    if (location !== 'all') {
      list = list.filter((l) => l.licenses.includes(location));
    }
    if (language !== 'all') {
      list = list.filter((l) => (l.languages ?? []).includes(language));
    }

    list = [...list].sort((a, b) => {
      const aLast = getLastName(a.name);
      const bLast = getLastName(b.name);
      let cmp = aLast.localeCompare(bLast, undefined, { sensitivity: 'base' });
      if (cmp === 0) cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      return sortOrder === SORT_ZA ? -cmp : cmp;
    });

    return list;
  }, [lenders, location, language, sortOrder]);

  return (
    <div className="lenders-filterable">
      <div className="lenders-filters" role="group" aria-labelledby="lenders-filters-heading">
        <h2 id="lenders-filters-heading" className="lenders-filters-heading">
          Filter & sort
        </h2>
        <div className="lenders-filters-row">
          <div className="lenders-filter-group">
            <label htmlFor="lenders-filter-location" className="lenders-filter-label">
              Location
            </label>
            <select
              id="lenders-filter-location"
              className="lenders-filter-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by license state"
            >
              <option value="all">All locations</option>
              {locations.map((code) => (
                <option key={code} value={code}>
                  {getLicenseLabel(code)}
                </option>
              ))}
            </select>
          </div>

          <div className="lenders-filter-group">
            <label htmlFor="lenders-filter-language" className="lenders-filter-label">
              Language
            </label>
            <select
              id="lenders-filter-language"
              className="lenders-filter-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Filter by language"
            >
              <option value="all">All languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="lenders-filter-group">
            <label htmlFor="lenders-sort" className="lenders-filter-label">
              Sort by name
            </label>
            <select
              id="lenders-sort"
              className="lenders-filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="Sort lenders by name"
            >
              <option value={SORT_AZ}>A–Z</option>
              <option value={SORT_ZA}>Z–A</option>
            </select>
          </div>
        </div>
        <p className="lenders-filters-result" aria-live="polite">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'lender' : 'lenders'}
        </p>
      </div>

      <div className="lenders-list-wrap">
        <LendersList lenders={filteredAndSorted} />
      </div>
    </div>
  );
}
