'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PropertyCard, type PropertyCardListing } from '@/components/rmls/PropertyCard';
import { RMLSDisclaimer } from '@/components/rmls/RMLSDisclaimer';
import { SearchFilters } from './SearchFilters';

const SEARCH_SORT_OPTIONS = [
  'listDate-desc',
  'listPrice-asc',
  'listPrice-desc',
  'sqft-desc',
] as const;

interface SearchState {
  pageNum: number;
  resultsPerPage: number;
  minPrice: string;
  maxPrice: string;
  city: string;
  sort: string;
}

const defaultState: SearchState = {
  pageNum: 1,
  resultsPerPage: 20,
  minPrice: '',
  maxPrice: '',
  city: '',
  sort: 'listDate-desc',
};

function getInitialStateFromSearchParams(searchParams: URLSearchParams | null): SearchState {
  if (!searchParams) return defaultState;
  const pageNum = Math.min(1000, Math.max(1, parseInt(searchParams.get('pageNum') ?? '1', 10) || 1));
  const resultsPerPage = Math.min(100, Math.max(1, parseInt(searchParams.get('resultsPerPage') ?? '20', 10) || 20));
  const sort = searchParams.get('sort')?.trim();
  return {
    pageNum,
    resultsPerPage,
    minPrice: searchParams.get('minPrice')?.trim() ?? '',
    maxPrice: searchParams.get('maxPrice')?.trim() ?? '',
    city: searchParams.get('city')?.trim() ?? '',
    sort:
      sort && SEARCH_SORT_OPTIONS.includes(sort as (typeof SEARCH_SORT_OPTIONS)[number])
        ? sort
        : defaultState.sort,
  };
}

function mapApiListingToCard(item: Record<string, unknown>): PropertyCardListing | null {
  const mlsId = item.mlsNumber ?? item.mls_listing_id;
  if (typeof mlsId !== 'string') return null;
  const address = (item.address as string) ?? '';
  const office = item.office as Record<string, unknown> | undefined;
  const brokerageName = office?.brokerageName ?? item.listing_firm_name;
  const agents = item.agents as Array<{ name?: string | null }> | undefined;
  const agentName = agents?.[0]?.name ?? item.listing_agent_name;
  const images = item.images as string[] | undefined;
  const firstImage = Array.isArray(images) ? images[0] : item.image_url;
  let imageUrl: string | null = null;
  if (typeof firstImage === 'string') {
    imageUrl = firstImage.startsWith('http') ? firstImage : `https://cdn.repliers.io/${firstImage.replace(/^\//, '')}`;
  }

  const listPrice = item.listPrice ?? item.price;
  const price = typeof listPrice === 'number' ? listPrice : typeof listPrice === 'string' ? parseFloat(listPrice) : null;
  const details = item.details as Record<string, unknown> | undefined;
  const beds = (details?.numBedrooms ?? item.beds) as number | null | undefined;
  const baths = (details?.numBathrooms ?? item.baths) as number | null | undefined;
  const sqft = (details?.sqft ?? item.sqft) as number | null | undefined;
  const addr = item.address as Record<string, unknown> | undefined;
  const city = (addr?.city ?? item.city) as string | undefined;
  const state = (addr?.state ?? item.state) as string | undefined;
  const zip = (addr?.zip ?? item.zip) as string | undefined;

  return {
    id: (item.id as string) ?? mlsId,
    address: typeof address === 'string' ? address : String(addr?.streetNumber ?? '') + ' ' + String(addr?.streetName ?? ''),
    city: city ?? undefined,
    state: state ?? undefined,
    zip: zip ?? undefined,
    price: price ?? null,
    beds: beds != null ? Number(beds) : null,
    baths: baths != null ? Number(baths) : null,
    sqft: sqft != null ? Number(sqft) : null,
    status: (item.status as string) ?? 'Active',
    listingFirmName: typeof brokerageName === 'string' ? brokerageName : 'Unknown',
    listingAgentName: typeof agentName === 'string' ? agentName : null,
    imageUrl,
    detailUrl: `/listings/${encodeURIComponent(mlsId)}`,
  };
}

export function ListingsSearchClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SearchState>(() =>
    getInitialStateFromSearchParams(searchParams)
  );
  const [listings, setListings] = useState<PropertyCardListing[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [source, setSource] = useState<'repliers' | 'cache' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    async (overrides?: Partial<SearchState>) => {
      const s = { ...state, ...overrides };
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('pageNum', String(s.pageNum));
        params.set('resultsPerPage', String(s.resultsPerPage));
        params.set('sort', s.sort);
        if (s.minPrice) params.set('minPrice', s.minPrice);
        if (s.maxPrice) params.set('maxPrice', s.maxPrice);
        if (s.city.trim()) params.set('city', s.city.trim());

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = (await res.json().catch(() => ({}))) as {
          listings?: Record<string, unknown>[];
          count?: number;
          page?: number;
          numPages?: number;
          source?: 'cache';
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? 'Search failed. Please try again.');
          setListings([]);
          setCount(0);
          return;
        }

        const raw = data.listings ?? [];
        const mapped = raw.map(mapApiListingToCard).filter((c): c is PropertyCardListing => c != null);
        setListings(mapped);
        setCount(data.count ?? mapped.length);
        setPage(data.page ?? 1);
        setNumPages(data.numPages ?? 1);
        setSource(data.source ?? 'repliers');
      } catch {
        setError('Search failed. Please try again.');
        setListings([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    },
    [state]
  );

  useEffect(() => {
    runSearch({ ...state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setState((prev) => ({ ...prev, pageNum: 1 }));
    runSearch({ pageNum: 1 });
  };

  const handleReset = () => {
    setState(defaultState);
    setState((prev) => ({ ...prev, pageNum: 1 }));
    setTimeout(() => runSearch(defaultState), 0);
  };

  const handlePageChange = (nextPage: number) => {
    setState((prev) => ({ ...prev, pageNum: nextPage }));
    runSearch({ pageNum: nextPage });
  };

  return (
    <div className="listings-search">
      <SearchFilters
        minPrice={state.minPrice}
        maxPrice={state.maxPrice}
        city={state.city}
        sort={state.sort}
        onMinPriceChange={(v) => setState((p) => ({ ...p, minPrice: v }))}
        onMaxPriceChange={(v) => setState((p) => ({ ...p, maxPrice: v }))}
        onCityChange={(v) => setState((p) => ({ ...p, city: v }))}
        onSortChange={(v) => setState((p) => ({ ...p, sort: v }))}
        onSearch={handleSearch}
        onReset={handleReset}
        isLoading={loading}
      />
      <div className="listings-search__results">
        {source === 'cache' && (
          <p className="listings-search__cache-notice" role="status">
            Results may be temporarily incomplete. Try again in a moment for the latest listings.
          </p>
        )}
        {error && (
          <p className="listings-search__error" role="alert">
            {error}
          </p>
        )}
        {loading && listings.length === 0 && (
          <p className="listings-search__loading">Loading listings…</p>
        )}
        {!loading && !error && listings.length === 0 && (
          <p className="listings-search__empty">No listings match your filters. Try broadening your search.</p>
        )}
        {listings.length > 0 && (
          <>
            <p className="listings-search__count">
              {count} {count === 1 ? 'listing' : 'listings'} found
            </p>
            <ul className="listings-search__grid">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <PropertyCard listing={listing} />
                </li>
              ))}
            </ul>
            {numPages > 1 && (
              <nav className="listings-search__pagination" aria-label="Pagination">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                  className="button button--outline"
                >
                  Previous
                </button>
                <span className="listings-search__page-num">
                  Page {page} of {numPages}
                </span>
                <button
                  type="button"
                  disabled={page >= numPages || loading}
                  onClick={() => handlePageChange(page + 1)}
                  className="button button--outline"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
      <RMLSDisclaimer className="listings-search__disclaimer" />
    </div>
  );
}
