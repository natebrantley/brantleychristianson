'use client';

type Option = { value: string; label: string };

export function LeadsSortForm({
  options,
  currentSort,
  currentQ,
  currentStatus,
  currentSource,
  currentFavoriteCity,
}: {
  options: Option[];
  currentSort: string;
  currentQ: string;
  currentStatus?: string;
  currentSource?: string;
  currentFavoriteCity?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    params.set('sort', e.target.value);
    if (currentQ) params.set('q', currentQ);
    if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus);
    if (currentSource) params.set('source', currentSource);
    if (currentFavoriteCity) params.set('favorite_city', currentFavoriteCity);
    window.location.href = `/agents/dashboard/leads?${params.toString()}`;
  }

  return (
    <form method="get" action="/agents/dashboard/leads" className="leads-sort-form">
      <input type="hidden" name="q" value={currentQ} readOnly />
      <input type="hidden" name="status" value={currentStatus ?? 'all'} readOnly />
      <input type="hidden" name="source" value={currentSource ?? ''} readOnly />
      <input type="hidden" name="favorite_city" value={currentFavoriteCity ?? ''} readOnly />
      <label htmlFor="leads-sort">Sort</label>
      <select id="leads-sort" name="sort" value={currentSort} onChange={handleChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
