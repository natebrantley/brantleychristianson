import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { deriveUserSlug } from '@/lib/user-slug';
import { Hero } from '@/components/Hero';
import { LeadsSortForm } from './LeadsSortForm';
import { assetPaths } from '@/config/theme';
import { getLeadPulse, getLeadPulseLabel } from '@/lib/getLeadPulse';
import { LEADS_SELECT } from '@/lib/leads-fields';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: 'first_name-asc', label: 'Name A–Z', column: 'first_name', ascending: true },
  { value: 'first_name-desc', label: 'Name Z–A', column: 'first_name', ascending: false },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: 'All leads | Agent dashboard',
  description: 'All assigned leads – CRM view. BCRE agent dashboard.',
  path: '/agents/dashboard/leads',
  ogImageAlt: 'BCRE agent leads',
  robots: { index: false, follow: false },
});

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; slug?: string | null };
type LeadRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  crmc_score?: number | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  assigned_broker_id?: string | null;
  assigned_lender_id?: string | null;
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

/** Visual feedback: simplified schema has no created_at/last_login; always null. */
function getLeadRecency(_lead: LeadRow): 'new' | 'active' | null {
  return null;
}

/** Escape for Postgres ilike: % and _ are wildcards. Comma would break .or() so strip it. */
function escapeIlike(s: string): string {
  const noComma = s.replace(/,/g, ' ').trim();
  return noComma.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

const LEAD_SELECT = LEADS_SELECT;

function getLeadInitials(lead: LeadRow): string {
  const first = (lead.first_name ?? '').trim().slice(0, 1).toUpperCase();
  const last = (lead.last_name ?? '').trim().slice(0, 1).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const email = (lead.email_address ?? '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
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
  const sortKey = params.sort ?? 'first_name-asc';
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

    const buildLeadsQuery = (client: Awaited<ReturnType<typeof createClerkSupabaseClient>>, brokerIds: string[]) => {
      let query = client
        .from('leads')
        .select(LEAD_SELECT, { count: 'exact' })
        .in('assigned_broker_id', brokerIds)
        .is('marketing_opted_out_at', null);
      if (q) {
        const pattern = `%${escapeIlike(q)}%`;
        query = query.or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},email_address.ilike.${pattern}`
        );
      }
      return query
        .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
        .range(from, to);
    };

    const userRes = await supabase
      .from('users')
      .select('first_name, last_name, email, role, slug')
      .eq('clerk_id', userId)
      .maybeSingle();
    if (userRes.data != null) user = userRes.data as AgentUser;

    const brokerIds: string[] = [userId];
    if (user?.slug) brokerIds.push(user.slug);
    if (user?.first_name != null || user?.last_name != null) {
      const derived = deriveUserSlug(user.first_name, user.last_name);
      if (derived) brokerIds.push(derived);
    }
    if (clerkUser) {
      const derived = deriveUserSlug(clerkUser.firstName, clerkUser.lastName);
      if (derived) brokerIds.push(derived);
    }
    const agentSlug = getAgentSlugByEmail(user?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined);
    if (agentSlug) brokerIds.push(agentSlug);
    const uniqBrokerIds = [...new Set(brokerIds)];

    const leadsRes = await buildLeadsQuery(supabase, uniqBrokerIds);
    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as unknown as LeadRow[];
    }
    totalCount = typeof leadsRes.count === 'number' ? leadsRes.count : leads.length;

    const canonicalBrokerId =
      (user?.slug && user.slug.trim()) ? user.slug.trim() : (getAgentSlugByEmail(user?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined) ?? userId);
    if (leads.length > 0) {
      const idsToNormalize = leads.filter((l) => l.assigned_broker_id !== canonicalBrokerId).map((l) => l.id);
      if (idsToNormalize.length > 0) {
        await supabaseAdmin().from('leads').update({ assigned_broker_id: canonicalBrokerId }).in('id', idsToNormalize);
      }
    }

    const forFallback = user ?? (clerkUser ? { first_name: clerkUser.firstName, last_name: clerkUser.lastName, email: clerkUser.emailAddresses?.[0]?.emailAddress } : null);
    if (leads.length === 0 && totalCount === 0 && forFallback) {
      const fullName = [forFallback.first_name, forFallback.last_name].filter(Boolean).join(' ').trim();
      const slug = getAgentSlugByEmail(forFallback.email ?? undefined);
      const possibleIds: string[] = [userId];
      if (forFallback.email) possibleIds.push(String(forFallback.email).trim());
      if (fullName) possibleIds.push(fullName);
      if (slug) possibleIds.push(slug);
      if (user?.slug) possibleIds.push(user.slug);
      const derivedSlug = deriveUserSlug(forFallback.first_name, forFallback.last_name);
      if (derivedSlug) possibleIds.push(derivedSlug);
      const uniq = [...new Set(possibleIds)];
      const uniqWithCase = [...new Set([...uniq, ...uniq.map((s) => s.toLowerCase())])];

      const admin = supabaseAdmin();
      let fallbackQuery = admin
        .from('leads')
        .select(LEAD_SELECT, { count: 'exact' })
        .in('assigned_broker_id', uniqWithCase)
        .is('marketing_opted_out_at', null);
      if (q) {
        const pattern = `%${escapeIlike(q)}%`;
        fallbackQuery = fallbackQuery.or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},email_address.ilike.${pattern}`
        );
      }
      const { data: fallbackLeads, count: fallbackCount } = await fallbackQuery
        .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
        .range(from, to);

      if (Array.isArray(fallbackLeads)) {
        leads = fallbackLeads as unknown as LeadRow[];
        totalCount = typeof fallbackCount === 'number' ? fallbackCount : leads.length;
        const idsToUpdate = (fallbackLeads as unknown as LeadRow[]).filter((l) => l.assigned_broker_id !== canonicalBrokerId).map((l) => l.id);
        if (idsToUpdate.length > 0) {
          await admin.from('leads').update({ assigned_broker_id: canonicalBrokerId }).in('id', idsToUpdate);
        }
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
    return name || (lead.email_address ?? '') || '—';
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const startRow = totalCount === 0 ? 0 : from + 1;
  const endRow = Math.min(from + PAGE_SIZE, totalCount);

  const filterParams = { q, sort: sortKey };

  function buildUrl(updates: Partial<{ page: number; q: string; sort: string }>) {
    const base = '/agents/dashboard/leads';
    const sp = new URLSearchParams();
    const pageVal = updates.page != null ? updates.page : page;
    const qVal = updates.q !== undefined ? updates.q : filterParams.q;
    const sortVal = updates.sort !== undefined ? updates.sort : filterParams.sort;
    if (pageVal > 1) sp.set('page', String(pageVal));
    if (qVal) sp.set('q', qVal);
    if (sortVal !== 'first_name-asc') sp.set('sort', sortVal);
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
    <main className="dashboard-page leads-page agent-dashboard" aria-label="Leads – all assigned leads">
      <Hero
        variant="short"
        title="Leads"
        lead="Search, sort, and manage your assigned leads."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads – CRM"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="leads-toolbar" id="leads-toolbar" role="search" aria-label="Leads search and filters">
            <Link href="/agents/dashboard" className="leads-toolbar__back">
              ← Back to dashboard
            </Link>
            <div className="leads-toolbar__title-row">
              <h1 className="leads-toolbar__title">All leads</h1>
              <span className="leads-toolbar__count">
                {totalCount.toLocaleString()} lead{totalCount !== 1 ? 's' : ''}
                {q ? (
                  <> — <Link href={buildUrl({ page: 1, q: '' })}>Clear search</Link></>
                ) : null}
              </span>
            </div>
            <div className="leads-filters">
              <form method="get" action="/agents/dashboard/leads" className="leads-search-form" aria-label="Search leads">
                <input type="hidden" name="sort" value={sortKey} />
                <label htmlFor="leads-search-q" className="sr-only">Search by name or email</label>
                <input
                  id="leads-search-q"
                  type="search"
                  name="q"
                  placeholder="Search by name or email…"
                  defaultValue={q}
                  aria-label="Search leads by name or email"
                  autoComplete="off"
                />
                <button type="submit" aria-label="Submit search">Search</button>
              </form>
              <div className="leads-filters-group" role="group" aria-label="Sort leads">
                <LeadsSortForm
                  options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  currentSort={sortKey}
                  currentQ={q}
                  currentVerified={false}
                  currentSource=""
                  currentFavoriteCity=""
                />
              </div>
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
                        <th>Contact</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => {
                        const recency = getLeadRecency(lead);
                        const pulseLevel = getLeadPulse(lead);
                        const pulseLabel = getLeadPulseLabel(pulseLevel);
                        const initials = getLeadInitials(lead);
                        return (
                          <tr key={lead.id}>
                            <td className="lead-name">
                              <span className="lead-name__cell">
                                <span className="lead-avatar" aria-hidden>{initials}</span>
                                <span
                                  className={`lead-pulse lead-pulse--${pulseLevel}`}
                                  role="img"
                                  aria-label={pulseLabel}
                                  title={pulseLabel}
                                />
                                <Link href={`/agents/dashboard/leads/${lead.id}`}>{leadDisplayName(lead)}</Link>
                              </span>
                            </td>
                            <td className="lead-contact">
                              {lead.email_address ? (
                                <a href={`mailto:${lead.email_address}`}>{truncate(lead.email_address, 28)}</a>
                              ) : (
                                '—'
                              )}
                              {lead.phone && (
                                <span className="lead-contact__sep"> · </span>
                              )}
                              {lead.phone ? (
                                <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                              ) : (
                                lead.email_address ? null : '—'
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
                  const pulseLevel = getLeadPulse(lead);
                  const pulseLabel = getLeadPulseLabel(pulseLevel);
                  const initials = getLeadInitials(lead);
                  return (
                    <li key={lead.id} className="leads-mobile-card">
                      <Link href={`/agents/dashboard/leads/${lead.id}`} className="leads-mobile-card__link" aria-label={`View ${leadDisplayName(lead)}`}>
                        <div className="leads-mobile-card__header">
                          <span className="lead-avatar" aria-hidden>{initials}</span>
                          <span className="leads-mobile-card__name">{leadDisplayName(lead)}</span>
                          <span className="leads-mobile-card__pills">
                            <span
                              className={`lead-pulse lead-pulse--${pulseLevel}`}
                              role="img"
                              aria-label={pulseLabel}
                              title={pulseLabel}
                            />
                            <span className="lead-badge lead-badge--lead">Lead</span>
                            {recency === 'new' && <span className="lead-pill lead-pill--new">New</span>}
                            {recency === 'active' && <span className="lead-pill lead-pill--active">Active</span>}
                          </span>
                          <span className="leads-mobile-card__chevron" aria-hidden>→</span>
                        </div>
                      <div className="leads-mobile-card__body">
                        {lead.email_address && (
                          <p className="leads-mobile-card__row">
                            <span className="leads-mobile-card__label">Email</span>
                            <span className="leads-mobile-card__value leads-mobile-card__value--email">{lead.email_address}</span>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="leads-mobile-card__row">
                            <span className="leads-mobile-card__label">Phone</span>
                            <span className="leads-mobile-card__value">{lead.phone}</span>
                          </p>
                        )}
                      </div>
                    </Link>
                    {(lead.email_address || lead.phone) && (
                      <div className="leads-mobile-card__actions">
                        {lead.phone && (
                          <a href={`tel:${lead.phone.replace(/\D/g, '')}`} className="leads-mobile-card__btn leads-mobile-card__btn--call" aria-label={`Call ${lead.phone}`}>
                            Call
                          </a>
                        )}
                        {lead.email_address && (
                          <a href={`mailto:${lead.email_address}`} className="leads-mobile-card__btn leads-mobile-card__btn--email" aria-label={`Email ${lead.email_address}`}>
                            Email
                          </a>
                        )}
                        <Link href={`/agents/dashboard/leads/${lead.id}`} className="leads-mobile-card__btn leads-mobile-card__btn--view">
                          View profile
                        </Link>
                      </div>
                    )}
                    {!lead.email_address && !lead.phone && (
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
                  : 'No leads assigned to you yet. When leads are assigned to you, they’ll appear here.'}
              </p>
              <Link href={q ? buildUrl({ page: 1, q: '' }) : '/agents/dashboard'} className="button button--outline" style={{ marginTop: '0.5rem' }}>
                {q ? 'Clear search' : 'Back to dashboard'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
