'use client';

type Option = { value: string; label: string };

export function LeadsSortForm({
  options,
  currentSort,
  currentQ,
  currentVerified,
  currentSource,
  currentFavoriteCity,
}: {
  options: Option[];
  currentSort: string;
  currentQ: string;
  currentVerified?: boolean;
  currentSource?: string;
  currentFavoriteCity?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    params.set('sort', e.target.value);
    if (currentQ) params.set('q', currentQ);
    if (currentVerified) params.set('verified', '1');
    if (currentSource) params.set('source', currentSource);
    if (currentFavoriteCity) params.set('favorite_city', currentFavoriteCity);
    window.location.href = `/agents/dashboard/leads?${params.toString()}`;
  }

  return (
    <form method="get" action="/agents/dashboard/leads" className="leads-sort-form" role="group" aria-label="Sort leads">
      <input type="hidden" name="q" value={currentQ} readOnly />
      {currentVerified && <input type="hidden" name="verified" value="1" readOnly />}
      <input type="hidden" name="source" value={currentSource ?? ''} readOnly />
      <input type="hidden" name="favorite_city" value={currentFavoriteCity ?? ''} readOnly />
      <label htmlFor="leads-sort" className="sr-only">Sort leads by</label>
      <select id="leads-sort" name="sort" value={currentSort} onChange={handleChange} aria-label="Sort leads by">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
