'use client';

export function LeadsFilterFavoriteCity({
  favoriteCities,
  currentFavoriteCity,
  currentQ,
  currentSort,
  currentVerified,
  currentSource,
}: {
  favoriteCities: string[];
  currentFavoriteCity: string;
  currentQ: string;
  currentSort: string;
  currentVerified: boolean;
  currentSource: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (currentQ) params.set('q', currentQ);
    if (currentSort !== 'created_at-desc') params.set('sort', currentSort);
    if (currentVerified) params.set('verified', '1');
    if (currentSource) params.set('source', currentSource);
    const city = e.target.value.trim();
    if (city) params.set('favorite_city', city);
    const qs = params.toString();
    window.location.href = qs ? `/agents/dashboard/leads?${qs}` : '/agents/dashboard/leads';
  }

  if (favoriteCities.length === 0) return null;

  return (
    <select
      value={currentFavoriteCity}
      onChange={handleChange}
      className="leads-filters-inline__select"
      aria-label="Filter by favorite city"
    >
      <option value="">All cities</option>
      {favoriteCities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
