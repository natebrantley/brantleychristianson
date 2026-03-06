'use client';

type Option = { value: string; label: string };

export function LeadsSortForm({
  options,
  currentSort,
  currentQ,
}: {
  options: Option[];
  currentSort: string;
  currentQ: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    params.set('sort', e.target.value);
    if (currentQ) params.set('q', currentQ);
    window.location.href = `/agents/dashboard/leads?${params.toString()}`;
  }

  return (
    <form method="get" action="/agents/dashboard/leads" className="leads-sort-form">
      <input type="hidden" name="q" value={currentQ} readOnly />
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
