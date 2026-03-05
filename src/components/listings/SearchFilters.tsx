'use client';

/**
 * Filter sidebar for listing search. Controlled by parent via props.
 */

export interface SearchFiltersProps {
  minPrice: string;
  maxPrice: string;
  city: string;
  sort: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'listDate-desc', label: 'Newest first' },
  { value: 'listPrice-asc', label: 'Price: Low to high' },
  { value: 'listPrice-desc', label: 'Price: High to low' },
  { value: 'sqft-desc', label: 'Square footage: High to low' },
];

export function SearchFilters({
  minPrice,
  maxPrice,
  city,
  sort,
  onMinPriceChange,
  onMaxPriceChange,
  onCityChange,
  onSortChange,
  onSearch,
  onReset,
  isLoading = false,
}: SearchFiltersProps) {
  return (
    <aside className="listings-filters" aria-label="Search filters">
      <h2 className="listings-filters__title">Filters</h2>
      <div className="listings-filters__group">
        <label htmlFor="listings-min-price">Min price</label>
        <input
          id="listings-min-price"
          type="number"
          min={0}
          placeholder="Any"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          className="listings-filters__input"
        />
      </div>
      <div className="listings-filters__group">
        <label htmlFor="listings-max-price">Max price</label>
        <input
          id="listings-max-price"
          type="number"
          min={0}
          placeholder="Any"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className="listings-filters__input"
        />
      </div>
      <div className="listings-filters__group">
        <label htmlFor="listings-city">City</label>
        <input
          id="listings-city"
          type="text"
          placeholder="e.g. Portland"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="listings-filters__input"
        />
      </div>
      <div className="listings-filters__group">
        <label htmlFor="listings-sort">Sort by</label>
        <select
          id="listings-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="listings-filters__select"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="listings-filters__actions">
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="button button--primary"
        >
          {isLoading ? 'Searching…' : 'Search'}
        </button>
        <button type="button" onClick={onReset} className="button button--outline">
          Reset
        </button>
      </div>
    </aside>
  );
}
