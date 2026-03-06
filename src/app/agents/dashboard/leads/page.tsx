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
  source?: string | null;
  timeframe?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
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

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str || !str.trim()) return '—';
  const t = str.trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

const RECENT_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Visual feedback: "new" = created in last N days, "active" = last_login in last N days. */
function getLeadRecency(lead: LeadRow): 'new' | 'active' | null {
  const now = Date.now();
  const createdMs = lead.created_at ? new Date(lead.created_at).getTime() : 0;
  const loginMs = lead.last_login ? new Date(lead.last_login).getTime() : 0;
  const createdDaysAgo = (now - createdMs) / MS_PER_DAY;
  const loginDaysAgo = loginMs ? (now - loginMs) / MS_PER_DAY : Infinity;
  if (createdDaysAgo <= RECENT_DAYS && createdDaysAgo >= 0) return 'new';
  if (loginDaysAgo <= RECENT_DAYS && loginDaysAgo >= 0) return 'active';
  return null;
}

/** Escape for Postgres ilike: % and _ are wildcards. Comma would break .or() so strip it. */
function escapeIlike(s: string): string {
  const noComma = s.replace(/,/g, ' ').trim();
  return noComma.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; status?: string; source?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const q = (params.q ?? '').trim().slice(0, 100);
  const sortKey = params.sort ?? 'created_at-desc';
  const statusFilter = params.status === 'clients' || params.status === 'leads' ? params.status : 'all';
  const sourceFilter = (params.source ?? '').trim().slice(0, 80);
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
          'id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries, source, timeframe, city, state, notes',
          { count: 'exact' }
        )
        .eq('assigned_broker_id', userId);
      if (statusFilter === 'clients') {
        query = query.not('clerk_id', 'is', null);
      } else if (statusFilter === 'leads') {
        query = query.is('clerk_id', null);
      }
      if (sourceFilter) {
        const sourcePattern = `%${escapeIlike(sourceFilter)}%`;
        query = query.ilike('source', sourcePattern);
      }
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
          'id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries, source, timeframe, city, state, notes',
          { count: 'exact' }
        )
        .in('assigned_broker_id', uniqWithCase);
      if (statusFilter === 'clients') {
        fallbackQuery = fallbackQuery.not('clerk_id', 'is', null);
      } else if (statusFilter === 'leads') {
        fallbackQuery = fallbackQuery.is('clerk_id', null);
      }
      if (sourceFilter) {
        const sourcePattern = `%${escapeIlike(sourceFilter)}%`;
        fallbackQuery = fallbackQuery.ilike('source', sourcePattern);
      }
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

  const filterParams = { q, sort: sortKey, status: statusFilter, source: sourceFilter };

  function buildUrl(updates: Partial<{ page: number; q: string; sort: string; status: string; source: string }>) {
    const base = '/agents/dashboard/leads';
    const sp = new URLSearchParams();
    const pageVal = updates.page != null ? updates.page : page;
    const qVal = updates.q !== undefined ? updates.q : filterParams.q;
    const sortVal = updates.sort !== undefined ? updates.sort : filterParams.sort;
    const statusVal = updates.status !== undefined ? updates.status : filterParams.status;
    const sourceVal = updates.source !== undefined ? updates.source : filterParams.source;
    if (pageVal > 1) sp.set('page', String(pageVal));
    if (qVal) sp.set('q', qVal);
    if (sortVal !== 'created_at-desc') sp.set('sort', sortVal);
    if (statusVal !== 'all') sp.set('status', statusVal);
    if (sourceVal) sp.set('source', sourceVal);
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
    <main className="dashboard-page leads-page agent-dashboard">
      <Hero
        variant="short"
        title="Leads"
        lead="Search, sort, and manage your assigned leads."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads – CRM"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="leads-toolbar" id="leads-toolbar">
            <Link href="/agents/dashboard" className="leads-toolbar__back">
              ← Back to dashboard
            </Link>
            <div className="leads-toolbar__title-row">
              <h1 className="leads-toolbar__title">All leads</h1>
              <span className="leads-toolbar__count">
                {totalCount.toLocaleString()} lead{totalCount !== 1 ? 's' : ''}
                {(q || statusFilter !== 'all' || sourceFilter) ? (
                  <> — <Link href={buildUrl({ page: 1, q: '', status: 'all', source: '' })}>Clear filters</Link></>
                ) : null}
              </span>
            </div>
            <div className="leads-filters">
              <form method="get" action="/agents/dashboard/leads" className="leads-search-form">
                <input type="hidden" name="sort" value={sortKey} />
                <input type="hidden" name="status" value={statusFilter} />
                <input type="hidden" name="source" value={sourceFilter} />
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
                currentStatus={statusFilter}
                currentSource={sourceFilter}
              />
              <form method="get" action="/agents/dashboard/leads" className="leads-filters-inline">
                <input type="hidden" name="q" value={q} />
                <input type="hidden" name="sort" value={sortKey} />
                <select name="status" defaultValue={statusFilter} className="leads-filters-inline__select" aria-label="Filter by status">
                  <option value="all">All</option>
                  <option value="clients">Clients</option>
                  <option value="leads">Leads</option>
                </select>
              </form>
            </div>
          </div>

          {leads.length > 0 ? (
            <>
              {/* Desktop: simple table with status feedback and clear View action */}
              <div className="leads-table-card leads-table-card--desktop">
                <div className="leads-table-scroll">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Contact</th>
                        <th>Last active</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => {
                        const recency = getLeadRecency(lead);
                        return (
                          <tr key={lead.id}>
                            <td className="lead-name">
                              <Link href={`/agents/dashboard/leads/${lead.id}`}>{leadDisplayName(lead)}</Link>
                            </td>
                            <td className="lead-status">
                              <span className="lead-status__pills">
                                {lead.clerk_id ? (
                                  <span className="lead-badge lead-badge--client">Client</span>
                                ) : (
                                  <span className="lead-badge lead-badge--lead">Lead</span>
                                )}
                                {recency === 'new' && <span className="lead-pill lead-pill--new">New</span>}
                                {recency === 'active' && <span className="lead-pill lead-pill--active">Active</span>}
                              </span>
                            </td>
                            <td className="lead-contact">
                              {lead.email ? (
                                <a href={`mailto:${lead.email}`}>{truncate(lead.email, 28)}</a>
                              ) : (
                                '—'
                              )}
                              {lead.phone && (
                                <span className="lead-contact__sep"> · </span>
                              )}
                              {lead.phone ? (
                                <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                              ) : (
                                lead.email ? null : '—'
                              )}
                            </td>
                            <td className="lead-activity">
                              <span className="lead-activity__text">{formatLastActive(lead.last_login)}</span>
                              {recency && (
                                <span className={`lead-activity__dot lead-activity__dot--${recency}`} aria-hidden title={recency === 'new' ? 'Created recently' : 'Active recently'} />
                              )}
                            </td>
                            <td className="lead-view">
                              <Link href={`/agents/dashboard/leads/${lead.id}`} className="lead-view__btn">
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: simple tappable cards with status feedback */}
              <ul className="leads-mobile-cards" aria-label="Leads list">
                {leads.map((lead) => {
                  const recency = getLeadRecency(lead);
                  return (
                    <li key={lead.id} className="leads-mobile-card">
                      <Link href={`/agents/dashboard/leads/${lead.id}`} className="leads-mobile-card__link" aria-label={`View ${leadDisplayName(lead)}`}>
                        <div className="leads-mobile-card__header">
                          <span className="leads-mobile-card__name">{leadDisplayName(lead)}</span>
                          <span className="leads-mobile-card__pills">
                            {lead.clerk_id ? (
                              <span className="lead-badge lead-badge--client">Client</span>
                            ) : (
                              <span className="lead-badge lead-badge--lead">Lead</span>
                            )}
                            {recency === 'new' && <span className="lead-pill lead-pill--new">New</span>}
                            {recency === 'active' && <span className="lead-pill lead-pill--active">Active</span>}
                          </span>
                          <span className="leads-mobile-card__chevron" aria-hidden>→</span>
                        </div>
                      <div className="leads-mobile-card__body">
                        {lead.email && (
                          <p className="leads-mobile-card__row">
                            <span className="leads-mobile-card__label">Email</span>
                            <span className="leads-mobile-card__value leads-mobile-card__value--email">{lead.email}</span>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="leads-mobile-card__row">
                            <span className="leads-mobile-card__label">Phone</span>
                            <span className="leads-mobile-card__value">{lead.phone}</span>
                          </p>
                        )}
                        <p className="leads-mobile-card__row">
                          <span className="leads-mobile-card__label">Last active</span>
                          <span className="leads-mobile-card__value">{formatLastActive(lead.last_login)}</span>
                        </p>
                        <p className="leads-mobile-card__row leads-mobile-card__row--meta">
                          <span className="leads-mobile-card__label">Views</span>
                          <span className="leads-mobile-card__value">{lead.property_views ?? '—'}</span>
                          <span className="leads-mobile-card__dot" aria-hidden>·</span>
                          <span className="leads-mobile-card__label">Created</span>
                          <span className="leads-mobile-card__value">{formatLeadDate(lead.created_at)}</span>
                        </p>
                      </div>
                    </Link>
                    {(lead.email || lead.phone) && (
                      <div className="leads-mobile-card__actions">
                        {lead.phone && (
                          <a href={`tel:${lead.phone.replace(/\D/g, '')}`} className="leads-mobile-card__btn leads-mobile-card__btn--call" aria-label={`Call ${lead.phone}`}>
                            Call
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="leads-mobile-card__btn leads-mobile-card__btn--email" aria-label={`Email ${lead.email}`}>
                            Email
                          </a>
                        )}
                        <Link href={`/agents/dashboard/leads/${lead.id}`} className="leads-mobile-card__btn leads-mobile-card__btn--view">
                          View profile
                        </Link>
                      </div>
                    )}
                    {!lead.email && !lead.phone && (
                      <div className="leads-mobile-card__actions">
                        <Link href={`/agents/dashboard/leads/${lead.id}`} className="leads-mobile-card__btn leads-mobile-card__btn--view leads-mobile-card__btn--view-solo">
                          View profile
                        </Link>
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>

              <a href="#leads-toolbar" className="leads-back-to-top">Back to top</a>

              <div className="leads-pagination">
                <p className="leads-pagination__info">
                  Showing {startRow.toLocaleString()}–{endRow.toLocaleString()} of {totalCount.toLocaleString()}
                </p>
                <nav className="leads-pagination__nav" aria-label="Leads pagination">
                  {hasPrev && (
                    <Link href={buildUrl({ page: page - 1 })} className="leads-pagination__prev" aria-label="Previous page">
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
                        href={buildUrl({ page: p })}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {hasNext && (
                    <Link href={buildUrl({ page: page + 1 })} className="leads-pagination__next" aria-label="Next page">
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
              <Link href={q || statusFilter !== 'all' || sourceFilter ? buildUrl({ page: 1, q: '', status: 'all', source: '' }) : '/agents/dashboard'} className="button button--outline" style={{ marginTop: '0.5rem' }}>
                {q || statusFilter !== 'all' || sourceFilter ? 'Clear filters' : 'Back to dashboard'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
