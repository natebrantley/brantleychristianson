import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { Hero } from '@/components/Hero';
import { LeadsSortForm } from './LeadsSortForm';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Newest first', column: 'created_at', ascending: false },
  { value: 'created_at-asc', label: 'Oldest first', column: 'created_at', ascending: true },
  { value: 'last_login-desc', label: 'Last active (recent)', column: 'last_login', ascending: false },
  { value: 'last_login-asc', label: 'Last active (oldest)', column: 'last_login', ascending: true },
  { value: 'first_name-asc', label: 'Name A–Z', column: 'first_name', ascending: true },
  { value: 'first_name-desc', label: 'Name Z–A', column: 'first_name', ascending: false },
] as const;

export const metadata: Metadata = {
  title: 'All leads | Agent dashboard',
  description: 'All assigned leads – CRM view. BCRE agent dashboard.',
};

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null };
type LeadRow = {
  id: string;
  email: string;
  created_at: string;
  assigned_broker_id?: string | null;
  clerk_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  last_login?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
};

function formatLeadDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatLastActive(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

/** Escape for Postgres ilike: % and _ are wildcards. Comma would break .or() so strip it. */
function escapeIlike(s: string): string {
  const noComma = s.replace(/,/g, ' ').trim();
  return noComma.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const q = (params.q ?? '').trim().slice(0, 100);
  const sortKey = params.sort ?? 'created_at-desc';
  const sortConfig = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let user: AgentUser | null = null;
  let leads: LeadRow[] = [];
  let totalCount = 0;

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      try {
        await ensureUserInSupabase(clerkUser);
      } catch {
        // ignore
      }
    }

    const supabase = await createClerkSupabaseClient();

    const buildLeadsQuery = (client: Awaited<ReturnType<typeof createClerkSupabaseClient>>) => {
      let query = client
        .from('leads')
        .select(
          'id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries',
          { count: 'exact' }
        )
        .eq('assigned_broker_id', userId);
      if (q) {
        const pattern = `%${escapeIlike(q)}%`;
        query = query.or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},email_address.ilike.${pattern}`
        );
      }
      return query
        .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
        .range(from, to);
    };

    const [userRes, leadsRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role')
        .eq('clerk_id', userId)
        .maybeSingle(),
      buildLeadsQuery(supabase),
    ]);

    user = userRes.data ?? null;
    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
    }
    totalCount = typeof leadsRes.count === 'number' ? leadsRes.count : leads.length;

    const forFallback = user ?? (clerkUser ? { first_name: clerkUser.firstName, last_name: clerkUser.lastName, email: clerkUser.emailAddresses?.[0]?.emailAddress } : null);
    if (leads.length === 0 && totalCount === 0 && forFallback) {
      const fullName = [forFallback.first_name, forFallback.last_name].filter(Boolean).join(' ').trim();
      const slug = getAgentSlugByEmail(forFallback.email ?? undefined);
      const possibleIds: string[] = [userId];
      if (forFallback.email) possibleIds.push(String(forFallback.email).trim());
      if (fullName) possibleIds.push(fullName);
      if (slug) possibleIds.push(slug);
      const uniq = [...new Set(possibleIds)];
      const uniqWithCase = [...new Set([...uniq, ...uniq.map((s) => s.toLowerCase())])];

      const admin = supabaseAdmin();
      let fallbackQuery = admin
        .from('leads')
        .select(
          'id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries',
          { count: 'exact' }
        )
        .in('assigned_broker_id', uniqWithCase);
      if (q) {
        const pattern = `%${escapeIlike(q)}%`;
        fallbackQuery = fallbackQuery.or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},email_address.ilike.${pattern}`
        );
      }
      const { data: fallbackLeads, count: fallbackCount } = await fallbackQuery
        .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
        .range(from, to);

      if (Array.isArray(fallbackLeads)) {
        leads = fallbackLeads as LeadRow[];
        totalCount = typeof fallbackCount === 'number' ? fallbackCount : leads.length;
      }
    }
  } catch (err) {
    console.error('Error loading agent leads:', formatSupabaseError(err));
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch {
    // ignore
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  function leadDisplayName(lead: LeadRow): string {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
    return name || lead.email || '—';
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const startRow = totalCount === 0 ? 0 : from + 1;
  const endRow = Math.min(from + PAGE_SIZE, totalCount);

  function buildUrl(updates: { page?: number; q?: string; sort?: string }) {
    const u = new URL('/agents/dashboard/leads', 'https://x');
    if (updates.page != null) u.searchParams.set('page', String(updates.page));
    if (updates.q !== undefined) u.searchParams.set('q', updates.q);
    if (updates.sort !== undefined) u.searchParams.set('sort', updates.sort);
    const base = '/agents/dashboard/leads';
    const sp = new URLSearchParams();
    if (updates.page != null) sp.set('page', String(updates.page));
    if (updates.q !== undefined) sp.set('q', updates.q);
    if (updates.sort !== undefined) sp.set('sort', updates.sort);
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  }

  const paginationPages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) paginationPages.push(i);
  } else {
    const mid = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...mid].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) paginationPages.push('ellipsis');
      paginationPages.push(sorted[i]!);
    }
  }

  return (
    <main className="dashboard-page leads-page">
      <Hero
        variant="short"
        title="Leads"
        lead="Search, sort, and manage your assigned leads."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads – CRM"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="leads-toolbar">
            <Link href="/agents/dashboard" className="leads-toolbar__back">
              ← Back to dashboard
            </Link>
            <div className="leads-toolbar__title-row">
              <h1 className="leads-toolbar__title">All leads</h1>
              <span className="leads-toolbar__count">
                {totalCount.toLocaleString()} lead{totalCount !== 1 ? 's' : ''}
                {q ? (
                  <> matching &quot;{q}&quot; — <Link href={buildUrl({ q: '', sort: sortKey })}>Clear search</Link></>
                ) : null}
              </span>
            </div>
            <div className="leads-filters">
              <form method="get" action="/agents/dashboard/leads" className="leads-search-form">
                <input type="hidden" name="sort" value={sortKey} />
                <input
                  type="search"
                  name="q"
                  placeholder="Search by name or email…"
                  defaultValue={q}
                  aria-label="Search leads"
                />
                <button type="submit">Search</button>
              </form>
              <LeadsSortForm
                options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                currentSort={sortKey}
                currentQ={q}
              />
            </div>
          </div>

          {leads.length > 0 ? (
            <>
              {/* Desktop: table */}
              <div className="leads-table-card leads-table-card--desktop">
                <div className="leads-table-scroll">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Last active</th>
                        <th>Views</th>
                        <th>Inquiries</th>
                        <th>Created</th>
                        <th>Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="lead-name">{leadDisplayName(lead)}</td>
                          <td className="lead-email">
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`}>{lead.email}</a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {lead.phone ? (
                              <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>{formatLastActive(lead.last_login)}</td>
                          <td>{lead.property_views ?? '—'}</td>
                          <td>{lead.property_inquiries ?? '—'}</td>
                          <td>{formatLeadDate(lead.created_at)}</td>
                          <td>
                            {lead.clerk_id ? (
                              <span className="lead-badge">Client</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: card list (no horizontal scroll) */}
              <ul className="leads-mobile-cards" aria-label="Leads list">
                {leads.map((lead) => (
                  <li key={lead.id} className="leads-mobile-card">
                    <div className="leads-mobile-card__header">
                      <span className="leads-mobile-card__name">{leadDisplayName(lead)}</span>
                      {lead.clerk_id ? <span className="lead-badge">Client</span> : null}
                    </div>
                    {lead.email && (
                      <p className="leads-mobile-card__row">
                        <span className="leads-mobile-card__label">Email</span>
                        <a href={`mailto:${lead.email}`}>{lead.email}</a>
                      </p>
                    )}
                    {lead.phone && (
                      <p className="leads-mobile-card__row">
                        <span className="leads-mobile-card__label">Phone</span>
                        <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                      </p>
                    )}
                    <p className="leads-mobile-card__row">
                      <span className="leads-mobile-card__label">Last active</span>
                      <span>{formatLastActive(lead.last_login)}</span>
                    </p>
                    <p className="leads-mobile-card__row">
                      <span className="leads-mobile-card__label">Views</span>
                      <span>{lead.property_views ?? '—'}</span>
                    </p>
                    <p className="leads-mobile-card__row">
                      <span className="leads-mobile-card__label">Created</span>
                      <span>{formatLeadDate(lead.created_at)}</span>
                    </p>
                  </li>
                ))}
              </ul>

              <div className="leads-pagination">
                <p className="leads-pagination__info">
                  Showing {startRow.toLocaleString()}–{endRow.toLocaleString()} of {totalCount.toLocaleString()}
                </p>
                <nav className="leads-pagination__nav" aria-label="Leads pagination">
                  {hasPrev && (
                    <Link href={buildUrl({ page: page - 1, q, sort: sortKey })} aria-label="Previous page">
                      Previous
                    </Link>
                  )}
                  {paginationPages.map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${i}`} className="leads-pagination__ellipsis" aria-hidden>
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={buildUrl({ page: p, q, sort: sortKey })}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {hasNext && (
                    <Link href={buildUrl({ page: page + 1, q, sort: sortKey })} aria-label="Next page">
                      Next
                    </Link>
                  )}
                </nav>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>
                {q
                  ? `No leads match "${q}". Try a different search or clear the search.`
                  : 'No leads assigned to you yet.'}
              </p>
              <Link href={q ? buildUrl({ q: '', sort: sortKey }) : '/agents/dashboard'} className="button button--outline" style={{ marginTop: '0.5rem' }}>
                {q ? 'Clear search' : 'Back to dashboard'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
