import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agent dashboard',
  description: 'Assigned leads, their activity, and saved searches. BCRE agent dashboard.',
};

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_broker_id?: string | null; assigned_lender_id?: string | null };
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
type SavedSearchRow = { id: string; clerk_id: string; name: string | null; criteria: Record<string, unknown>; created_at: string };

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

export default async function AgentsDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: AgentUser | null = null;
  let leads: LeadRow[] = [];
  let savedSearches: SavedSearchRow[] = [];
  let totalAssignedCount = 0;

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      try {
        await ensureUserInSupabase(clerkUser);
      } catch (clerkErr) {
        console.warn('Could not sync Clerk user to Supabase:', (clerkErr as Error)?.message ?? clerkErr);
      }
    }

    const supabase = await createClerkSupabaseClient();

    const [userRes, leadsRes, countRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role, assigned_broker_id, assigned_lender_id')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries')
        .eq('assigned_broker_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_broker_id', userId),
    ]);

    if (userRes.error) {
      console.error('Error loading agent user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
    }

    totalAssignedCount = typeof countRes.count === 'number' ? countRes.count : 0;

    // Fallback: if no leads by Clerk ID, fetch by name/slug/email (legacy imports) and backfill
    const forFallback = user ?? (clerkUser ? { first_name: clerkUser.firstName, last_name: clerkUser.lastName, email: clerkUser.emailAddresses?.[0]?.emailAddress } : null);
    if (leads.length === 0 && forFallback) {
      const fullName = [forFallback.first_name, forFallback.last_name].filter(Boolean).join(' ').trim();
      const slug = getAgentSlugByEmail(forFallback.email ?? undefined);
      const possibleIds: string[] = [userId];
      if (forFallback.email) possibleIds.push(String(forFallback.email).trim());
      if (fullName) possibleIds.push(fullName);
      if (slug) possibleIds.push(slug);
      const uniq = [...new Set(possibleIds)];
      // Include lowercase variants so we match regardless of casing in DB (e.g. "NATE BRANTLEY", "nate")
      const uniqWithCase = [...new Set([...uniq, ...uniq.map((s) => s.toLowerCase())])];

      const admin = supabaseAdmin();
      const { data: fallbackLeads, error: fallbackErr } = await admin
        .from('leads')
        .select('id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries')
        .in('assigned_broker_id', uniqWithCase)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fallbackErr) {
        console.warn('Agent dashboard fallback query failed', { possibleIdsCount: uniqWithCase.length, error: fallbackErr.message });
      } else if (Array.isArray(fallbackLeads) && fallbackLeads.length > 0) {
        leads = fallbackLeads as LeadRow[];
        const { count: fallbackCount } = await admin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('assigned_broker_id', uniqWithCase);
        totalAssignedCount = typeof fallbackCount === 'number' ? fallbackCount : leads.length;
        // Backfill so next load uses Clerk ID
        const idsToUpdate = (fallbackLeads as LeadRow[]).filter((l) => l.assigned_broker_id !== userId).map((l) => l.id);
        if (idsToUpdate.length > 0) {
          await admin.from('leads').update({ assigned_broker_id: userId }).in('id', idsToUpdate);
        }
      } else {
        console.info('Agent dashboard: no leads by Clerk ID or fallback (name/email/slug). Check leads.assigned_broker_id in Supabase.', { possibleIdsCount: uniqWithCase.length });
      }
    }

    // Saved searches for assigned leads who have signed in (clerk_id set) — use admin to bypass RLS
    const clientClerkIds = leads.map((l) => l.clerk_id).filter(Boolean) as string[];
    if (clientClerkIds.length > 0) {
      const admin = supabaseAdmin();
      const { data: searches } = await admin
        .from('saved_searches')
        .select('id, clerk_id, name, criteria, created_at')
        .in('clerk_id', clientClerkIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (Array.isArray(searches)) {
        savedSearches = searches as SavedSearchRow[];
      }
    }
  } catch (err) {
    console.error('Unexpected error loading agent dashboard:', { userId, ...formatSupabaseError(err) });
  }

  // Allow access if Supabase has broker role, or if Clerk public_metadata has it (e.g. before webhook sync)
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role:', (clerkErr as Error)?.message ?? clerkErr);
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) {
      redirect('/lenders/dashboard');
    }
    redirect('/clients/dashboard');
  }

  // If Supabase had no user, build a minimal user from Clerk for display
  if (!user && clerkUser) {
    user = {
      first_name: clerkUser.firstName ?? null,
      last_name: clerkUser.lastName ?? null,
      email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
      role: roleFromClerk ?? 'agent',
    };
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null
    : null;

  // Assigned leads only; clients = those with clerk_id (signed in)
  const assignedLeadsCount = totalAssignedCount;
  const activeClientsCount = leads.filter((l) => l.clerk_id).length;

  function leadDisplayName(lead: LeadRow): string {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
    return name || lead.email || '—';
  }

  // Map clerk_id → lead display name for saved searches
  const clerkIdToName = new Map<string, string>();
  leads.forEach((l) => {
    if (l.clerk_id) clerkIdToName.set(l.clerk_id, leadDisplayName(l));
  });

  return (
    <main className="dashboard-page agent-dashboard">
      <Hero
        variant="short"
        title="Agent dashboard"
        lead="Your pipeline, client activity, and saved searches—all in one place."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Agent dashboard – assigned leads and activity"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="agent-welcome">
            <div className="agent-welcome__bg" aria-hidden />
            <div className="agent-welcome__inner">
              <div className="agent-welcome__content">
                <p className="agent-welcome__tag">Welcome back</p>
                <h1 className="agent-welcome__title">
                  {displayName ? `${displayName.split(' ')[0]}` : 'Dashboard'}
                </h1>
                {displayName && (
                  <p className="agent-welcome__sub">
                    Signed in as <strong>{displayName}</strong>
                    {user?.email ? ` · ${user.email}` : ''}
                  </p>
                )}
                {!displayName && (
                  <p className="agent-welcome__sub">
                    Your profile is syncing from Clerk. Refresh in a moment.
                  </p>
                )}
                <p style={{ marginTop: '0.5rem' }}>
                  <a href="/dashboard" className="text--muted" style={{ fontSize: '0.8125rem' }}>Refresh role from Clerk</a>
                </p>
              </div>
              <span className="agent-welcome__role" title="Synced from Clerk">Role: {user?.role ?? '—'}</span>
            </div>
          </div>

          {/* KPIs */}
          <section className="dashboard-section" aria-labelledby="pipeline-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Overview</p>
              <h2 id="pipeline-heading" className="section-title">Pipeline at a glance</h2>
              <p className="section-lead">
                Assigned leads, clients who’ve signed in, and saved searches they’ve created.
              </p>
            </header>
            <div className="agent-stats">
              <div className="agent-stat">
                <div className="agent-stat__value">{assignedLeadsCount > 0 ? assignedLeadsCount : '—'}</div>
                <div className="agent-stat__label">Assigned to me</div>
              </div>
              <div className="agent-stat">
                <div className="agent-stat__value">{activeClientsCount > 0 ? activeClientsCount : '—'}</div>
                <div className="agent-stat__label">Active clients</div>
              </div>
              <div className="agent-stat">
                <div className="agent-stat__value">{savedSearches.length > 0 ? savedSearches.length : '—'}</div>
                <div className="agent-stat__label">Saved searches</div>
              </div>
            </div>
          </section>

          {/* Assigned leads: tappable cards → detail */}
          <section className="dashboard-section" aria-labelledby="leads-heading">
            <header className="dashboard-section-header stack--xs">
              <div className="agent-section-cta">
                <div>
                  <p className="section-tag">Leads</p>
                  <h2 id="leads-heading" className="section-title">Recent leads</h2>
                  <p className="section-lead">
                    Tap a lead to view their profile, update contact info, and follow up.
                    {assignedLeadsCount > 10 && (
                      <span style={{ display: 'block', marginTop: '0.25rem' }}>
                        Showing 10 most recent of {assignedLeadsCount}.
                      </span>
                    )}
                  </p>
                </div>
                {assignedLeadsCount > 0 && (
                  <Link href="/agents/dashboard/leads" className="button button--primary">
                    See all leads
                  </Link>
                )}
              </div>
            </header>
            {leads.length > 0 ? (
              <ul className="agent-leads-list">
                {leads.map((lead) => (
                  <li key={lead.id}>
                    <div className="agent-lead-card">
                      <Link href={`/agents/dashboard/leads/${lead.id}`} className="agent-lead-card__link" aria-label={`View ${leadDisplayName(lead)}`}>
                        <div className="agent-lead-card__row">
                          <span className="agent-lead-card__name">{leadDisplayName(lead)}</span>
                          <span className="agent-lead-card__date">{formatLeadDate(lead.created_at)}</span>
                          <span className="agent-lead-card__chevron" aria-hidden>→</span>
                        </div>
                        {lead.email && (
                          <p className="agent-lead-card__email">{lead.email}</p>
                        )}
                        <div className="agent-lead-card__meta">
                          <span>Last active: {formatLastActive(lead.last_login)}</span>
                          {(lead.property_views != null && lead.property_views > 0) && (
                            <span>Views: {lead.property_views}</span>
                          )}
                          {(lead.property_inquiries != null && lead.property_inquiries > 0) && (
                            <span>Inquiries: {lead.property_inquiries}</span>
                          )}
                          {lead.clerk_id && <span className="agent-lead-card__badge">Client</span>}
                        </div>
                      </Link>
                      {lead.phone && (
                        <p className="agent-lead-card__phone">
                          <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
            <div className="empty-state">
              <p>No leads assigned to you yet. Assigned leads will appear here with their activity and saved searches.</p>
              <p className="text--muted" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                Leads are matched by your Clerk ID. If your CRM uses your name or email for assignment, we’ll pick them up and sync on next load.
              </p>
              <p className="text--muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem', maxWidth: '32rem' }}>
                To verify in Supabase: run <code style={{ background: 'var(--bg-subtle)', padding: '0.1em 0.3em', borderRadius: 4 }}>SELECT DISTINCT assigned_broker_id FROM leads WHERE assigned_broker_id IS NOT NULL;</code> — leads show here when a row’s <code>assigned_broker_id</code> equals your Clerk ID, your email (e.g. nate@brantleychristianson.com), full name (e.g. Nate Brantley), or agent slug (e.g. nate). Matching is case-insensitive (we try your name and slug in lower case too).
              </p>
              <Button href="/contact" variant="outline">
                View contact form
              </Button>
            </div>
          )}
        </section>

        {/* Client saved searches */}
        <section className="dashboard-section" aria-labelledby="saved-searches-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Searches</p>
            <h2 id="saved-searches-heading" className="section-title">Client saved searches</h2>
            <p className="section-lead">
              Saved searches created by your assigned clients. Stay aligned on what they’re looking for.
            </p>
          </header>
          {savedSearches.length > 0 ? (
            <ul className="agent-searches-list">
              {savedSearches.map((search) => (
                <li key={search.id} className="agent-search-card">
                  <div className="agent-search-card__row">
                    <span className="agent-search-card__title">{search.name || 'Untitled search'}</span>
                    <span className="agent-search-card__date">{formatLeadDate(search.created_at)}</span>
                  </div>
                  <p className="agent-search-card__client">
                    Client: {clerkIdToName.get(search.clerk_id) ?? '—'}
                  </p>
                  {search.criteria && typeof search.criteria === 'object' && Object.keys(search.criteria).length > 0 && (
                    <p className="agent-search-card__criteria" title={JSON.stringify(search.criteria)}>
                      {JSON.stringify(search.criteria)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No saved searches from your clients yet. When assigned clients save a search on the site, it will appear here.</p>
            </div>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="marketing-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Marketing</p>
            <h2 id="marketing-heading" className="section-title">Marketing insights</h2>
            <p className="section-lead">
              Listings and content performance—views, inquiries, top markets.
            </p>
          </header>
          <div className="agent-upsell">
            <h3>Coming soon</h3>
            <p>
              Views and engagement metrics for your listings and market pages. We&apos;ll show which content drives consultations.
            </p>
            <div className="dashboard-actions">
              <Button href="/resources" variant="outline">
                Share resources with clients
              </Button>
              <Button href="/agents" variant="text">
                Browse team profiles
              </Button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
