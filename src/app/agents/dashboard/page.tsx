import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agent dashboard',
  description: 'Pipeline, leads, and client management for BCRE agents.',
};

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null };
type LeadRow = { id: string; email: string; created_at: string };

function formatLeadDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default async function AgentsDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: AgentUser | null = null;
  let leads: LeadRow[] = [];
  let leadsCount = 0;

  try {
    const supabase = await createClerkSupabaseClient();

    const [userRes, leadsRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, email, created_at')
        .or(`assigned_broker_id.eq.${userId},assigned_broker_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (userRes.error) {
      console.error('Error loading agent user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
      leadsCount = leadsRes.data.length;
    }
  } catch (err) {
    console.error('Unexpected error loading agent dashboard:', { userId, ...formatSupabaseError(err) });
  }

  // Allow access if Supabase has broker role, or if Clerk public_metadata has it (e.g. before webhook sync)
  const clerkUser = await currentUser();
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    redirect('/clients');
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

  return (
    <main className="section">
      <div className="container stack--lg">
        <header className="stack--sm">
          <div className="dashboard-actions" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p className="section-tag">Agent dashboard</p>
              <h1 className="section-title">Welcome back</h1>
              {displayName && (
                <p className="section-lead">
                  Signed in as <strong>{displayName}</strong>
                  {user.email ? ` (${user.email})` : ''}
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
        </header>

        <section className="dashboard-section" aria-labelledby="overview-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Overview</p>
            <h2 id="overview-heading" className="section-title">Pipeline</h2>
            <p className="section-lead">
              Leads assigned to you or unassigned. Client and consultation counts will sync from your CRM when connected.
            </p>
          </header>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">{leadsCount > 0 ? leadsCount : '—'}</div>
              <div className="dashboard-stat-label">Leads (visible)</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">—</div>
              <div className="dashboard-stat-label">Active clients</div>
            </div>
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">—</div>
              <div className="dashboard-stat-label">Consultations this month</div>
            </div>
          </div>
        </section>

        <section className="dashboard-section" aria-labelledby="leads-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Leads</p>
            <h2 id="leads-heading" className="section-title">Recent leads</h2>
            <p className="section-lead">
              Incoming leads assigned to you or unassigned. Follow up from here or in your CRM.
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
                      <span style={{ fontWeight: 500 }}>{lead.email}</span>
                      <span className="text--muted" style={{ fontSize: '0.875rem' }}>
                        {formatLeadDate(lead.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty-state">
              <p>Leads will appear here when assigned to you or when RLS allows. Connect your CRM or Repliers for full pipeline sync.</p>
              <Button href="/contact" variant="outline">
                View contact form
              </Button>
            </div>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="clients-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Clients</p>
            <h2 id="clients-heading" className="section-title">Active clients</h2>
            <p className="section-lead">
              Clients you&apos;re working with—saved homes, searches, and next steps. CRM sync coming.
            </p>
          </header>
          <div className="empty-state">
            <p>Active client cards will show here once linked. Use your CRM for now.</p>
          </div>
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
              <Button href="/brokers" variant="text">
                Browse team profiles
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
