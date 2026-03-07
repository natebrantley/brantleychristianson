import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isOwnerRole, isBrokerRole, isLenderRole } from '@/lib/roles';
import { Hero } from '@/components/Hero';
import { LeadsSortForm } from '@/app/agents/dashboard/leads/LeadsSortForm';
import { assetPaths } from '@/config/theme';
import { getLeadPulse, getLeadPulseLabel } from '@/lib/getLeadPulse';
import { LEADS_SELECT } from '@/lib/leads-fields';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const OWNER_LEADS_BASE = '/owners/dashboard/leads';
const SORT_OPTIONS = [
  { value: 'first_name-asc', label: 'Name A–Z', column: 'first_name', ascending: true },
  { value: 'first_name-desc', label: 'Name Z–A', column: 'first_name', ascending: false },
] as const;

export const metadata: Metadata = {
  title: 'All leads | Owner dashboard',
  description: 'All leads – full CRM access. BCRE owner dashboard.',
};

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

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str || !str.trim()) return '—';
  const t = str.trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

function getLeadRecency(_lead: LeadRow): 'new' | 'active' | null {
  return null;
}

function escapeIlike(s: string): string {
  const noComma = s.replace(/,/g, ' ').trim();
  return noComma.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function getLeadInitials(lead: LeadRow): string {
  const first = (lead.first_name ?? '').trim().slice(0, 1).toUpperCase();
  const last = (lead.last_name ?? '').trim().slice(0, 1).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const email = (lead.email_address ?? '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export default async function OwnerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; scope?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const q = (params.q ?? '').trim().slice(0, 100);
  const sortKey = params.sort ?? 'first_name-asc';
  const scope = (params.scope === 'mine' ? 'mine' : 'all') as 'all' | 'mine';
  const sortConfig = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let user: { role?: string | null; slug?: string | null } | null = null;
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

    const userRes = await supabase
      .from('users')
      .select('role, slug')
      .eq('clerk_id', userId)
      .maybeSingle();
    user = userRes.data ?? null;

    let query = supabase.from('leads').select(LEADS_SELECT, { count: 'exact' });
    if (scope === 'mine') {
      const brokerIds = [userId];
      if (user?.slug) brokerIds.push(user.slug);
      query = query.in('assigned_broker_id', brokerIds);
    }
    if (q) {
      const pattern = `%${escapeIlike(q)}%`;
      query = query.or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},email_address.ilike.${pattern}`
      );
    }
    const leadsRes = await query
      .order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false })
      .range(from, to);

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as unknown as LeadRow[];
    }
    totalCount = typeof leadsRes.count === 'number' ? leadsRes.count : leads.length;
  } catch (err) {
    console.error('Error loading owner leads:', formatSupabaseError(err));
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch {
    // ignore
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isOwner = isOwnerRole(user?.role) || isOwnerRole(roleFromClerk);

  if (!isOwner) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) redirect('/agents/dashboard');
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

  const filterParams = { q, sort: sortKey, scope };

  function buildUrl(updates: Partial<{ page: number; q: string; sort: string; scope: string }>) {
    const sp = new URLSearchParams();
    const pageVal = updates.page != null ? updates.page : page;
    const qVal = updates.q !== undefined ? updates.q : filterParams.q;
    const sortVal = updates.sort !== undefined ? updates.sort : filterParams.sort;
    const scopeVal = updates.scope !== undefined ? updates.scope : filterParams.scope;
    if (pageVal > 1) sp.set('page', String(pageVal));
    if (qVal) sp.set('q', qVal);
    if (sortVal !== 'first_name-asc') sp.set('sort', sortVal);
    if (scopeVal !== 'all') sp.set('scope', scopeVal);
    const qs = sp.toString();
    return qs ? `${OWNER_LEADS_BASE}?${qs}` : OWNER_LEADS_BASE;
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
    <main className="dashboard-page leads-page owner-dashboard owner-dashboard--crm" aria-label="Leads – CRM">
      <Hero
        variant="short"
        title="Leads"
        lead={scope === 'mine' ? 'Leads assigned to you. Switch to all leads below.' : 'All leads across the team. Toggle to see only yours.'}
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads – CRM"
      />
      <div className="section owner-dashboard__section">
        <div className="container owner-dashboard__container stack--lg">
          <div className="leads-toolbar" id="leads-toolbar" role="search" aria-label="Leads search and filters">
            <Link href="/owners/dashboard" className="leads-toolbar__back">
              ← Back to dashboard
            </Link>
            <div className="owner-leads-scope">
              <span className="owner-leads-scope__label">View:</span>
              <div className="owner-leads-scope__toggle" role="group" aria-label="Lead scope">
                <Link
                  href={buildUrl({ page: 1, scope: 'mine' })}
                  className={`owner-leads-scope__btn ${scope === 'mine' ? 'owner-leads-scope__btn--active' : ''}`}
                  aria-pressed={scope === 'mine'}
                >
                  My leads
                </Link>
                <Link
                  href={buildUrl({ page: 1, scope: 'all' })}
                  className={`owner-leads-scope__btn ${scope === 'all' ? 'owner-leads-scope__btn--active' : ''}`}
                  aria-pressed={scope === 'all'}
                >
                  All leads
                </Link>
              </div>
            </div>
            <div className="leads-toolbar__title-row">
              <h1 className="leads-toolbar__title">
                {scope === 'mine' ? 'My leads' : 'All leads'}
              </h1>
              <span className="leads-toolbar__count">
                {totalCount.toLocaleString()} lead{totalCount !== 1 ? 's' : ''}
                {q ? (
                  <> — <Link href={buildUrl({ page: 1, q: '' })}>Clear search</Link></>
                ) : null}
              </span>
            </div>
            <div className="leads-filters">
              <form method="get" action={OWNER_LEADS_BASE} className="leads-search-form" aria-label="Search leads">
                <input type="hidden" name="sort" value={sortKey} />
                {scope !== 'all' && <input type="hidden" name="scope" value={scope} />}
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
                  basePath={OWNER_LEADS_BASE}
                  currentScope={scope !== 'all' ? scope : undefined}
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
                                <Link href={`${OWNER_LEADS_BASE}/${lead.id}`}>{leadDisplayName(lead)}</Link>
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
                              <Link href={`${OWNER_LEADS_BASE}/${lead.id}`} className="lead-view__btn">
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

              <ul className="leads-mobile-cards" aria-label="Leads list">
                {leads.map((lead) => {
                  const pulseLevel = getLeadPulse(lead);
                  const pulseLabel = getLeadPulseLabel(pulseLevel);
                  const initials = getLeadInitials(lead);
                  const recency = getLeadRecency(lead);
                  return (
                    <li key={lead.id} className="leads-mobile-card">
                      <Link href={`${OWNER_LEADS_BASE}/${lead.id}`} className="leads-mobile-card__link" aria-label={`View ${leadDisplayName(lead)}`}>
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
                          <Link href={`${OWNER_LEADS_BASE}/${lead.id}`} className="leads-mobile-card__btn leads-mobile-card__btn--view">
                            View profile
                          </Link>
                        </div>
                      )}
                      {!lead.email_address && !lead.phone && (
                        <div className="leads-mobile-card__actions">
                          <Link href={`${OWNER_LEADS_BASE}/${lead.id}`} className="leads-mobile-card__btn leads-mobile-card__btn--view leads-mobile-card__btn--view-solo">
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
                  : scope === 'mine'
                    ? 'No leads assigned to you yet.'
                    : 'No leads yet.'}
              </p>
              <Link href={q ? buildUrl({ page: 1, q: '' }) : '/owners/dashboard'} className="button button--outline" style={{ marginTop: '0.5rem' }}>
                {q ? 'Clear search' : 'Back to dashboard'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
