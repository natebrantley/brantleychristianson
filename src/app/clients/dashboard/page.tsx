import { redirect } from 'next/navigation';
import Image from 'next/image';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import { getAgentBySlug, getAgentByEmail } from '@/data/agents';
import { getLenderBySlug, getLenderByEmail } from '@/data/lenders';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your dashboard',
  description: 'Your agent, lender, saved homes, and next steps. BCRE client dashboard.',
};

type UserFields = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_broker_id?: string | null; assigned_lender_id?: string | null };

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
  let brokerUserEmail: string | null = null;
  let lenderUserEmail: string | null = null;

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

    // Resolve assigned agent/lender when stored as Clerk ID (user_xxx); fetch their user row for email → agents/lenders.json
    const brokerClerkId = user?.assigned_broker_id?.startsWith('user_') ? user.assigned_broker_id : null;
    const lenderClerkId = user?.assigned_lender_id?.startsWith('user_') ? user.assigned_lender_id : null;
    const clerkIdsToFetch = [brokerClerkId, lenderClerkId].filter(Boolean) as string[];
    if (clerkIdsToFetch.length > 0) {
      const { data: assignedUsers } = await supabase
        .from('users')
        .select('clerk_id, email')
        .in('clerk_id', clerkIdsToFetch);
      for (const row of assignedUsers ?? []) {
        if (row.clerk_id === brokerClerkId) brokerUserEmail = row.email as string | null;
        if (row.clerk_id === lenderClerkId) lenderUserEmail = row.email as string | null;
      }
    }
  } catch (err) {
    console.error('Unexpected error loading client dashboard:', { userId, ...formatSupabaseError(err) });
  }

  let roleFromClerk: string | null = null;
  try {
    const clerkUser = await currentUser();
    roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role:', (clerkErr as Error)?.message ?? clerkErr);
  }
  if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) {
    redirect('/agents/dashboard');
  }
  if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) {
    redirect('/lenders/dashboard');
  }

  const displayName = user
    ? ([user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null)
    : null;
  const firstName = displayName?.split(' ')[0] ?? 'there';

  const assignedAgent = user?.assigned_broker_id
    ? (getAgentByEmail(brokerUserEmail ?? undefined) ?? getAgentBySlug(user.assigned_broker_id))
    : null;
  const assignedLender = user?.assigned_lender_id
    ? (getLenderByEmail(lenderUserEmail ?? undefined) ?? getLenderBySlug(user.assigned_lender_id))
    : null;
  const hasTeam = !!(assignedAgent || assignedLender);

  return (
    <main className="dashboard-page client-dashboard">
      <Hero
        variant="short"
        title="Your dashboard"
        lead="Your agent, saved homes, and next steps—all in one place."
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt="Client dashboard – your home search at a glance"
      />
      <div className="section client-dashboard__section">
        <div className="container stack--lg client-dashboard__container">
          {/* Welcome + primary CTA */}
          <header className="client-dashboard__welcome" aria-labelledby="welcome-heading">
            <p className="section-tag client-dashboard__welcome-tag">Your home base</p>
            <h1 id="welcome-heading" className="section-title client-dashboard__welcome-title">
              Welcome back{displayName ? `, ${firstName}` : ''}
            </h1>
            {displayName && user?.email && (
              <p className="section-lead client-dashboard__welcome-lead">
                Signed in as <strong>{displayName}</strong> · {user.email}
              </p>
            )}
            {!displayName && (
              <p className="section-lead client-dashboard__welcome-lead">
                Your profile is syncing. Refresh in a moment if needed.
              </p>
            )}
            <div className="client-dashboard__quick-actions">
              <Button href="/contact" variant="primary">
                Request a consultation
              </Button>
              <Button href="/markets" variant="outline">
                Explore markets
              </Button>
              <Button href="/listings" variant="outline">
                Browse listings
              </Button>
            </div>
          </header>

          {/* Your team: Agent + Lender (grid on desktop) */}
          <section className="client-dashboard__team" aria-labelledby="team-heading">
            <h2 id="team-heading" className="client-dashboard__team-heading">
              Your team
            </h2>
            <p className="client-dashboard__team-lead">
              {hasTeam
                ? 'Your BCRE agent and preferred lender. Reach out anytime.'
                : 'Choose an agent and lender to get started. They’ll appear here for quick contact.'}
            </p>
            <div className="client-dashboard__team-grid">
              {/* Agent card */}
              <div className="client-dashboard__team-card">
                <h3 className="client-dashboard__team-card-title">Your agent</h3>
                {assignedAgent ? (
                  <div className="card dashboard-contact-card client-dashboard__contact-card">
                    <div className="client-dashboard__contact-avatar">
                      <Image
                        src={assignedAgent.image}
                        alt=""
                        width={72}
                        height={72}
                        style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="client-dashboard__contact-body">
                      <p className="client-dashboard__contact-name">{assignedAgent.name}</p>
                      <p className="client-dashboard__contact-meta">{assignedAgent.title}</p>
                      {(assignedAgent.phone || assignedAgent.email) && (
                        <ul className="client-dashboard__contact-list">
                          {assignedAgent.phone && (
                            <li>
                              <span className="text--muted">Phone </span>
                              <a href={`tel:${assignedAgent.phone.replace(/\D/g, '')}`}>{assignedAgent.phone}</a>
                            </li>
                          )}
                          {assignedAgent.email && (
                            <li>
                              <span className="text--muted">Email </span>
                              <a href={`mailto:${assignedAgent.email}`} style={{ wordBreak: 'break-all' }}>{assignedAgent.email}</a>
                            </li>
                          )}
                        </ul>
                      )}
                      <div className="dashboard-actions client-dashboard__contact-actions">
                        {assignedAgent.phone && (
                          <Button href={`tel:${assignedAgent.phone.replace(/\D/g, '')}`} variant="primary">
                            Call
                          </Button>
                        )}
                        <Button href={`mailto:${assignedAgent.email}`} variant="outline">
                          Email
                        </Button>
                        <Button href={assignedAgent.url} variant="text">
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card client-dashboard__empty-card">
                    <p>No agent assigned yet. Choose one from our team for buying, selling, or market advice.</p>
                    <Button href="/agents" variant="primary">
                      Choose your agent
                    </Button>
                  </div>
                )}
              </div>

              {/* Lender card */}
              <div className="client-dashboard__team-card">
                <h3 className="client-dashboard__team-card-title">Your lender</h3>
                {assignedLender ? (
                  <div className="card dashboard-contact-card client-dashboard__contact-card">
                    <div className="client-dashboard__contact-avatar">
                      <Image
                        src={assignedLender.image}
                        alt=""
                        width={72}
                        height={72}
                        style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="client-dashboard__contact-body">
                      <p className="client-dashboard__contact-name">{assignedLender.name}</p>
                      <p className="client-dashboard__contact-meta">{assignedLender.title} · {assignedLender.company}</p>
                      {(assignedLender.phone || assignedLender.email) && (
                        <ul className="client-dashboard__contact-list">
                          {assignedLender.phone && (
                            <li>
                              <span className="text--muted">Phone </span>
                              <a href={`tel:${assignedLender.phone.replace(/\D/g, '')}`}>{assignedLender.phone}</a>
                            </li>
                          )}
                          {assignedLender.email && (
                            <li>
                              <span className="text--muted">Email </span>
                              <a href={`mailto:${assignedLender.email}`} style={{ wordBreak: 'break-all' }}>{assignedLender.email}</a>
                            </li>
                          )}
                        </ul>
                      )}
                      <div className="dashboard-actions client-dashboard__contact-actions">
                        {assignedLender.phone && (
                          <Button href={`tel:${assignedLender.phone.replace(/\D/g, '')}`} variant="primary">
                            Call
                          </Button>
                        )}
                        <Button href={`mailto:${assignedLender.email}`} variant="outline">
                          Email
                        </Button>
                        {assignedLender.url ? (
                          <Button href={assignedLender.url} variant="text" target="_blank" rel="noopener noreferrer">
                            Website
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card client-dashboard__empty-card">
                    <p>Add a preferred lender for financing. They’ll show here for quick contact.</p>
                    <Button href="/lenders" variant="primary">
                      Choose your lender
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Consultation requests */}
          {linkedLeads.length > 0 && (
            <section className="dashboard-section client-dashboard__activity" aria-labelledby="requests-heading">
              <header className="dashboard-section-header stack--xs">
                <p className="section-tag">Activity</p>
                <h2 id="requests-heading" className="section-title">Consultation requests</h2>
                <p className="section-lead">
                  Your agent will follow up on these. {linkedLeads.length} request{linkedLeads.length !== 1 ? 's' : ''} linked to your account.
                </p>
              </header>
              <div className="card client-dashboard__list-card">
                <ul className="client-dashboard__list">
                  {linkedLeads.map((lead) => (
                    <li key={lead.id} className="client-dashboard__list-item">
                      <span className="client-dashboard__list-email">{lead.email}</span>
                      <time className="text--muted client-dashboard__list-date" dateTime={lead.created_at}>
                        {formatLeadDate(lead.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Saved homes */}
          <section className="dashboard-section client-dashboard__block" aria-labelledby="saved-homes-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Portfolio</p>
              <h2 id="saved-homes-heading" className="section-title">Saved homes</h2>
              <p className="section-lead">
                Properties you’ve saved. Your agent can help narrow down and schedule showings.
              </p>
            </header>
            <div className="empty-state client-dashboard__empty">
              <p>You haven’t saved any homes yet. Browse markets and listings, then save the ones you love.</p>
              <div className="dashboard-actions">
                <Button href="/markets" variant="outline">
                  Explore markets
                </Button>
                <Button href="/listings" variant="primary">
                  Browse listings
                </Button>
              </div>
            </div>
          </section>

          {/* Saved searches */}
          <section className="dashboard-section client-dashboard__block" aria-labelledby="saved-searches-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Alerts</p>
              <h2 id="saved-searches-heading" className="section-title">Saved searches</h2>
              <p className="section-lead">
                Get notified when new listings match your criteria.
              </p>
            </header>
            <div className="empty-state client-dashboard__empty">
              <p>No saved searches yet. Set up a search and we’ll email you when something matches.</p>
              <Button href="/contact" variant="primary">
                Request a consultation
              </Button>
            </div>
          </section>

          {/* Next steps */}
          <section className="dashboard-section client-dashboard__block" aria-labelledby="next-steps-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Resources</p>
              <h2 id="next-steps-heading" className="section-title">Getting started</h2>
              <p className="section-lead">
                Tools and ways to connect with your agent.
              </p>
            </header>
            <div className="dashboard-card-grid">
              <div className="card client-dashboard__resource-card">
                <h3>Schedule a consultation</h3>
                <p>
                  Talk through your goals—buying, selling, or learning the market. We’ll match you with a broker and keep everything in sync here.
                </p>
                <Button href="/contact" variant="primary">
                  Request a consultation
                </Button>
              </div>
              <div className="card client-dashboard__resource-card">
                <h3>Portland condo guide</h3>
                <p>
                  Compare buildings, HOAs, rent caps, and amenities. Refine your search and discuss options with your agent.
                </p>
                <Button href="/resources/portland-condo-guide" variant="outline">
                  Open condo guide
                </Button>
              </div>
              <div className="card client-dashboard__resource-card">
                <h3>Market resources</h3>
                <p>
                  Neighborhood guides and market insights to help you decide.
                </p>
                <Button href="/resources" variant="text">
                  View resources
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
