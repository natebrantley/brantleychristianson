import { redirect } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import { getAgentBySlug } from '@/data/agents';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Client dashboard',
  description: 'Saved homes, searches, and next steps with your BCRE agent.',
};

type UserFields = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_broker_slug?: string | null };

function formatLeadDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default async function ClientsDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: UserFields | null = null;
  let linkedLeads: { id: string; email: string; created_at: string }[] = [];

  try {
    const supabase = await createClerkSupabaseClient();
    const [userRes, leadsRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role, assigned_broker_slug')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, email, created_at')
        .eq('clerk_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (userRes.error) {
      console.error('Error loading client user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      linkedLeads = leadsRes.data as { id: string; email: string; created_at: string }[];
    }
  } catch (err) {
    console.error('Unexpected error loading client dashboard:', { userId, ...formatSupabaseError(err) });
  }

  if (isBrokerRole(user?.role)) {
    redirect('/agents');
  }

  const displayName = user
    ? ([user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null)
    : null;

  const assignedAgent = user?.assigned_broker_slug ? getAgentBySlug(user.assigned_broker_slug) : null;

  return (
    <main>
      <Hero
        variant="short"
        title="Your dashboard"
        lead="Saved homes, searches, and next steps with your BCRE agent."
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt="Client dashboard – your home search at a glance"
      />
      <div className="section">
        <div className="container stack--lg">
          {/* Your agent or choose agent */}
          <section className="dashboard-section" aria-labelledby="your-agent-heading">
            <h2 id="your-agent-heading" className="section-title" style={{ marginBottom: '0.5rem' }}>
              Your agent
            </h2>
            {assignedAgent ? (
              <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src={assignedAgent.image}
                    alt=""
                    width={80}
                    height={80}
                    style={{ borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '1.125rem' }}>{assignedAgent.name}</p>
                  <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9375rem' }}>{assignedAgent.title}</p>
                  <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)', gap: '0.5rem' }}>
                    {assignedAgent.phone && (
                      <Button href={`tel:${assignedAgent.phone.replace(/\D/g, '')}`} variant="primary">
                        Call {assignedAgent.name}
                      </Button>
                    )}
                    <Button href={`mailto:${assignedAgent.email}`} variant="outline">
                      Email
                    </Button>
                    <Button href={assignedAgent.url} variant="text">
                      View profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <p style={{ margin: 0 }}>
                  You don&apos;t have an agent assigned yet. Choose one from our team and they&apos;ll be listed here for quick call and email.
                </p>
                <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)' }}>
                  <Button href="/agents" variant="primary">
                    Choose your agent
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Welcome + quick actions */}
          <header className="stack--sm">
            <p className="section-tag">Client dashboard</p>
            <h1 className="section-title">Welcome back</h1>
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
            <div className="dashboard-actions">
              <Button href="/markets" variant="outline">
                Explore markets
              </Button>
              <Button href="/contact" variant="primary">
                Request a consultation
              </Button>
            </div>
          </header>

          {linkedLeads.length > 0 && (
            <section className="dashboard-section" aria-labelledby="requests-heading">
              <header className="dashboard-section-header stack--xs">
                <p className="section-tag">Activity</p>
                <h2 id="requests-heading" className="section-title">Your consultation requests</h2>
                <p className="section-lead">
                  Requests linked to your account. Your agent will follow up.
                </p>
              </header>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <ul className="stack--none" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {linkedLeads.map((lead) => (
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
            </section>
          )}

          <section className="dashboard-section" aria-labelledby="saved-homes-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Your portfolio</p>
              <h2 id="saved-homes-heading" className="section-title">Saved homes</h2>
              <p className="section-lead">
                Properties you&apos;ve saved. Your agent can help narrow down and schedule showings.
              </p>
            </header>
            <div className="empty-state">
              <p>You haven&apos;t saved any homes yet. Browse markets and listings, then save the ones you love.</p>
              <Button href="/markets" variant="outline">
                Explore markets
              </Button>
            </div>
          </section>

          {/* Saved searches */}
          <section className="dashboard-section" aria-labelledby="saved-searches-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Alerts</p>
              <h2 id="saved-searches-heading" className="section-title">Saved searches</h2>
              <p className="section-lead">
                Get notified when new listings match your criteria.
              </p>
            </header>
            <div className="empty-state">
              <p>No saved searches yet. Set up a search and we&apos;ll email you when something matches.</p>
              <Button href="/contact" variant="outline">
                Request a consultation
              </Button>
            </div>
          </section>

          {/* Next steps – two cards in a grid on larger screens */}
          <section className="dashboard-section" aria-labelledby="next-steps-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Next steps</p>
              <h2 id="next-steps-heading" className="section-title">Getting started</h2>
              <p className="section-lead">
                Resources and ways to connect with your agent.
              </p>
            </header>
            <div className="dashboard-card-grid">
              <div className="card">
                <h3>Connect with your agent</h3>
                <p>
                  Schedule a consultation to discuss your goals—buying, selling, or learning the market. We&apos;ll match you with a broker and keep your saved homes and searches in sync here.
                </p>
                <div className="dashboard-actions">
                  <Button href="/contact" variant="primary">
                    Request a consultation
                  </Button>
                  <Button href="/resources" variant="outline">
                    View resources
                  </Button>
                </div>
              </div>
              <div className="card">
                <h3>Portland condo guide</h3>
                <p>
                  Compare buildings, HOAs, rent caps, and amenities across Portland condos. Refine your searches and talk through options with your agent.
                </p>
                <Button href="/resources/portland-condo-guide" variant="text">
                  Open Portland Condo Guide
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
