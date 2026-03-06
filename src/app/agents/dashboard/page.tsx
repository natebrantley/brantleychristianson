import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
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
  agent?: string | null;
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

    const [userRes, leadsRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role, assigned_broker_id, assigned_lender_id')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, email, created_at, assigned_broker_id, agent, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries')
        .eq('assigned_broker_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (userRes.error) {
      console.error('Error loading agent user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
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
  const assignedLeadsCount = leads.length;
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
    <main className="dashboard-page">
      <Hero
        variant="short"
        title="Agent dashboard"
        lead="Your assigned leads, their activity, and saved searches."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Agent dashboard – assigned leads and activity"
      />
      <div className="section">
        <div className="container stack--lg">
          <header className="stack--sm">
            <div className="dashboard-actions">
              <div>
                <p className="section-tag">Welcome back</p>
                <h1 className="section-title">
                  {displayName ? `Hi, ${displayName.split(' ')[0]}` : 'Dashboard'}
                </h1>
                {displayName && (
                  <p className="section-lead">
                    Signed in as <strong>{displayName}</strong>
                    {user?.email ? ` (${user.email})` : ''}
                  </p>
                )}
                {!displayName && (
                  <p className="section-lead">
                    Your profile is syncing from Clerk. Refresh in a moment.
                  </p>
                )}
              </div>
              <span
                className="text--muted"
                style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                title="Synced from Clerk (Public metadata role)"
              >
                Role: {user?.role ?? '—'}
              </span>
            </div>
            <p className="section-lead" style={{ marginTop: '0.25rem' }}>
              <a href="/dashboard" className="text--muted" style={{ fontSize: '0.875rem' }}>Refresh role from Clerk</a>
            </p>
          </header>

        {/* Summary: assigned leads, active clients, saved searches */}
        <section className="dashboard-section" aria-labelledby="pipeline-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Overview</p>
            <h2 id="pipeline-heading" className="section-title">Assigned leads & activity</h2>
            <p className="section-lead">
              Your assigned leads, their activity on the site, and saved searches they’ve created.
            </p>
          </header>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{assignedLeadsCount > 0 ? assignedLeadsCount : '—'}</div>
              <div className="dashboard-stat-label">Assigned to me</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{activeClientsCount > 0 ? activeClientsCount : '—'}</div>
              <div className="dashboard-stat-label">Active clients</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{savedSearches.length > 0 ? savedSearches.length : '—'}</div>
              <div className="dashboard-stat-label">Client saved searches</div>
            </div>
          </div>
        </section>

        {/* Assigned leads with activity */}
        <section className="dashboard-section" aria-labelledby="leads-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Leads</p>
            <h2 id="leads-heading" className="section-title">My assigned leads</h2>
            <p className="section-lead">
              Leads assigned to you. Activity reflects site usage (property views, inquiries, last login).
            </p>
          </header>
          {leads.length > 0 ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <ul className="stack--none" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {leads.map((lead) => (
                  <li
                    key={lead.id}
                    style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{leadDisplayName(lead)}</span>
                      <span className="text--muted" style={{ fontSize: '0.875rem' }}>
                        {formatLeadDate(lead.created_at)}
                      </span>
                    </div>
                    {lead.email && (
                      <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                        {lead.email}
                      </p>
                    )}
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', fontSize: '0.8125rem' }}>
                      <span className="text--muted">Last active: {formatLastActive(lead.last_login)}</span>
                      {(lead.property_views != null && lead.property_views > 0) && (
                        <span className="text--muted">Views: {lead.property_views}</span>
                      )}
                      {(lead.property_inquiries != null && lead.property_inquiries > 0) && (
                        <span className="text--muted">Inquiries: {lead.property_inquiries}</span>
                      )}
                      {lead.clerk_id && (
                        <span style={{ fontWeight: 500 }}>Client</span>
                      )}
                    </div>
                    {lead.phone && (
                      <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                        <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty-state">
              <p>No leads assigned to you yet. Assigned leads will appear here with their activity and saved searches.</p>
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
              Saved searches created by your assigned clients. Use these to stay aligned on what they’re looking for.
            </p>
          </header>
          {savedSearches.length > 0 ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <ul className="stack--none" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {savedSearches.map((search) => (
                  <li
                    key={search.id}
                    style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{search.name || 'Untitled search'}</span>
                      <span className="text--muted" style={{ fontSize: '0.875rem' }}>
                        {formatLeadDate(search.created_at)}
                      </span>
                    </div>
                    <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                      Client: {clerkIdToName.get(search.clerk_id) ?? '—'}
                    </p>
                    {search.criteria && typeof search.criteria === 'object' && Object.keys(search.criteria).length > 0 && (
                      <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                        {JSON.stringify(search.criteria)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
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
          <div className="card">
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
