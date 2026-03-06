import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import { getLenderBySlug } from '@/data/lenders';
import type { Metadata } from 'next';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agent dashboard',
  description: 'Pipeline, leads, and client management for BCRE agents.',
};

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_lender_id?: string | null };
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
        .select('first_name, last_name, email, role, assigned_lender_id')
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

    // If no row in Supabase, sync from Clerk so future requests see the user
    if (!user && !userRes.error) {
      const clerkUser = await currentUser();
      if (clerkUser) await ensureUserInSupabase(clerkUser);
    }

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

  const preferredLender = user?.assigned_lender_id ? getLenderBySlug(user.assigned_lender_id) : null;

  return (
    <main>
      <Hero
        variant="short"
        title="Agent dashboard"
        lead="Pipeline, leads, and client management."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Agent dashboard – pipeline and leads"
      />
      <div className="section">
        <div className="container stack--lg">
          <header className="stack--sm">
            <div className="dashboard-actions" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
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
        </header>

        {/* Preferred lender for easy contact */}
        <section className="dashboard-section" aria-labelledby="preferred-lender-heading">
          <h2 id="preferred-lender-heading" className="section-title" style={{ marginBottom: '0.5rem' }}>
            Your preferred lender
          </h2>
          {preferredLender ? (
            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
              <div style={{ flexShrink: 0 }}>
                <Image
                  src={preferredLender.image}
                  alt=""
                  width={80}
                  height={80}
                  style={{ borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: '1.125rem' }}>{preferredLender.name}</p>
                <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9375rem' }}>{preferredLender.title} · {preferredLender.company}</p>
                {(preferredLender.phone || preferredLender.email) && (
                  <ul style={{ margin: 'var(--space-sm) 0 0 0', padding: 0, listStyle: 'none', fontSize: '0.9375rem' }}>
                    {preferredLender.phone && (
                      <li style={{ marginTop: '0.25rem' }}>
                        <span className="text--muted">Phone: </span>
                        <a href={`tel:${preferredLender.phone.replace(/\D/g, '')}`} style={{ fontWeight: 500 }}>
                          {preferredLender.phone}
                        </a>
                      </li>
                    )}
                    {preferredLender.email && (
                      <li style={{ marginTop: '0.25rem' }}>
                        <span className="text--muted">Email: </span>
                        <a href={`mailto:${preferredLender.email}`} style={{ fontWeight: 500, wordBreak: 'break-all' }}>
                          {preferredLender.email}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
                <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)', gap: '0.5rem' }}>
                  {preferredLender.phone && (
                    <Button href={`tel:${preferredLender.phone.replace(/\D/g, '')}`} variant="primary">
                      Call {preferredLender.name}
                    </Button>
                  )}
                  <Button href={`mailto:${preferredLender.email}`} variant="outline">
                    Email
                  </Button>
                  {preferredLender.url ? (
                    <Button href={preferredLender.url} variant="text" target="_blank" rel="noopener noreferrer">
                      Visit website
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <p style={{ margin: 0 }}>
                Add a preferred lender for quick contact when referring clients. They&apos;ll appear here.
              </p>
              <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)' }}>
                <Button href="/lenders" variant="primary">
                  Choose preferred lender
                </Button>
              </div>
            </div>
          )}
        </section>

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
