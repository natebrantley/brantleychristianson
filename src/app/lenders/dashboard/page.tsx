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
import { getBrokerDisplayNamesByClerkId, resolveLeadAssignedAgentName } from '@/lib/broker-names';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lender dashboard',
  description: 'Your referrals, agent contact, and resources. BCRE preferred lender dashboard.',
  robots: { index: false, follow: true },
};

type LenderUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_broker_id?: string | null; assigned_lender_id?: string | null };
type LeadRow = { id: string; email: string; created_at: string; assigned_broker_id?: string | null };

function formatLeadDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Lead is "priority" if created in the last 7 days */
function isPriorityLead(createdAt: string): boolean {
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= sevenDaysAgo;
  } catch {
    return false;
  }
}

export default async function LendersDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: LenderUser | null = null;
  let assignedLeads: LeadRow[] = [];
  let brokerNamesByClerkId = new Map<string, string>();
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
        .select('id, email, created_at, assigned_broker_id')
        .eq('assigned_lender_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (userRes.error) {
      console.error('Error loading lender user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      assignedLeads = leadsRes.data as LeadRow[];
    }

    const brokerIds = assignedLeads.map((l) => l.assigned_broker_id).filter(Boolean) as string[];
    if (brokerIds.length > 0) {
      brokerNamesByClerkId = await getBrokerDisplayNamesByClerkId(supabase, brokerIds);
    }

    // Resolve assigned agent/lender when stored as Clerk ID (user_xxx)
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
    console.error('Unexpected error loading lender dashboard:', { userId, ...formatSupabaseError(err) });
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role:', (clerkErr as Error)?.message ?? clerkErr);
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isLender = isLenderRole(user?.role) || isLenderRole(roleFromClerk);

  if (!isLender) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) {
      redirect('/agents/dashboard');
    }
    redirect('/clients/dashboard');
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null
    : null;
  const firstName = displayName?.split(' ')[0] ?? 'there';

  const agentContact = user?.assigned_broker_id
    ? (getAgentByEmail(brokerUserEmail ?? undefined) ?? getAgentBySlug(user.assigned_broker_id))
    : null;
  const preferredLender = user?.assigned_lender_id
    ? (getLenderByEmail(lenderUserEmail ?? undefined) ?? getLenderBySlug(user.assigned_lender_id))
    : null;
  const hasTeam = !!(agentContact || preferredLender);

  const priorityLeads = assignedLeads.filter((l) => isPriorityLead(l.created_at));
  const otherLeads = assignedLeads.filter((l) => !isPriorityLead(l.created_at));

  if (!user && clerkUser) {
    user = {
      first_name: clerkUser.firstName ?? null,
      last_name: clerkUser.lastName ?? null,
      email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
      role: roleFromClerk ?? 'lender',
    };
  }

  return (
    <main className="dashboard-page lender-dashboard">
      <Hero
        variant="short"
        title="Lender dashboard"
        lead="Your referrals, contacts, and partner resources."
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Lender dashboard – preferred lending partners"
      />
      <div className="section lender-dashboard__section">
        <div className="container stack--lg lender-dashboard__container">
          {/* Welcome + quick actions */}
          <header className="lender-dashboard__welcome" aria-labelledby="welcome-heading">
            <p className="section-tag lender-dashboard__welcome-tag">Your home base</p>
            <h1 id="welcome-heading" className="section-title lender-dashboard__welcome-title">
              Welcome back{displayName ? `, ${firstName}` : ''}
            </h1>
            {displayName && user?.email && (
              <p className="section-lead lender-dashboard__welcome-lead">
                Signed in as <strong>{displayName}</strong> · {user.email}
              </p>
            )}
            {!displayName && (
              <p className="section-lead lender-dashboard__welcome-lead">
                Your profile is syncing. Refresh in a moment if needed.
              </p>
            )}
            <div className="lender-dashboard__quick-actions">
              <Button href="/contact" variant="primary">
                Contact BCRE
              </Button>
              <Button href="/lenders" variant="outline">
                View preferred lenders
              </Button>
              <Button href="/resources" variant="outline">
                Browse resources
              </Button>
            </div>
          </header>

          {/* Leads needing attention – top priority */}
          <section className="lender-dashboard__leads" aria-labelledby="leads-heading">
            <h2 id="leads-heading" className="lender-dashboard__leads-heading">
              Leads needing attention
            </h2>
            <p className="lender-dashboard__leads-lead">
              {assignedLeads.length > 0
                ? `Referrals assigned to you. Follow up with the agent or client. ${priorityLeads.length > 0 ? `${priorityLeads.length} new in the last 7 days.` : ''}`
                : 'Referrals assigned to you by agents will appear here. Connect with your agent contact to receive leads.'}
            </p>
            {assignedLeads.length > 0 ? (
              <div className="card lender-dashboard__list-card">
                {priorityLeads.length > 0 && (
                  <div className="lender-dashboard__priority-block">
                    <h3 className="lender-dashboard__priority-title">New (last 7 days)</h3>
                    <ul className="lender-dashboard__list">
                      {priorityLeads.map((lead) => (
                        <li key={lead.id} className="lender-dashboard__list-item lender-dashboard__list-item--priority">
                          <span className="lender-dashboard__list-email">{lead.email}</span>
                          <time className="text--muted lender-dashboard__list-date" dateTime={lead.created_at}>
                            {formatLeadDate(lead.created_at)}
                          </time>
                          <p className="text--muted lender-dashboard__list-meta" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                            Agent: {resolveLeadAssignedAgentName(lead.assigned_broker_id, null, brokerNamesByClerkId)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {otherLeads.length > 0 && (
                  <div className="lender-dashboard__priority-block">
                    <h3 className="lender-dashboard__priority-title">
                      {priorityLeads.length > 0 ? 'Older' : 'Assigned to you'}
                    </h3>
                    <ul className="lender-dashboard__list">
                      {otherLeads.map((lead) => (
                        <li key={lead.id} className="lender-dashboard__list-item">
                          <span className="lender-dashboard__list-email">{lead.email}</span>
                          <time className="text--muted lender-dashboard__list-date" dateTime={lead.created_at}>
                            {formatLeadDate(lead.created_at)}
                          </time>
                          <p className="text--muted lender-dashboard__list-meta" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                            Agent: {resolveLeadAssignedAgentName(lead.assigned_broker_id, null, brokerNamesByClerkId)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state lender-dashboard__empty">
                <p>No referrals assigned yet. Your agent contact can assign leads to you for follow-up.</p>
                <Button href="/agents" variant="primary">
                  Choose your agent contact
                </Button>
              </div>
            )}
          </section>

          {/* Your team: Agent + Lender */}
          <section className="lender-dashboard__team" aria-labelledby="team-heading">
            <h2 id="team-heading" className="lender-dashboard__team-heading">
              Your team
            </h2>
            <p className="lender-dashboard__team-lead">
              {hasTeam
                ? 'Your BCRE agent contact and preferred lender partner. Reach out anytime.'
                : 'Add an agent contact and optional lender partner. They’ll appear here for quick contact.'}
            </p>
            <div className="lender-dashboard__team-grid">
              <div className="lender-dashboard__team-card">
                <h3 className="lender-dashboard__team-card-title">Your agent contact</h3>
                {agentContact ? (
                  <div className="card dashboard-contact-card lender-dashboard__contact-card">
                    <div className="lender-dashboard__contact-avatar">
                      <Image
                        src={agentContact.image}
                        alt=""
                        width={72}
                        height={72}
                        style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="lender-dashboard__contact-body">
                      <p className="lender-dashboard__contact-name">{agentContact.name}</p>
                      <p className="lender-dashboard__contact-meta">{agentContact.title}</p>
                      {(agentContact.phone || agentContact.email) && (
                        <ul className="lender-dashboard__contact-list">
                          {agentContact.phone && (
                            <li>
                              <span className="text--muted">Phone </span>
                              <a href={`tel:${agentContact.phone.replace(/\D/g, '')}`}>{agentContact.phone}</a>
                            </li>
                          )}
                          {agentContact.email && (
                            <li>
                              <span className="text--muted">Email </span>
                              <a href={`mailto:${agentContact.email}`} style={{ wordBreak: 'break-all' }}>{agentContact.email}</a>
                            </li>
                          )}
                        </ul>
                      )}
                      <div className="dashboard-actions lender-dashboard__contact-actions">
                        {agentContact.phone && <Button href={`tel:${agentContact.phone.replace(/\D/g, '')}`} variant="primary">Call</Button>}
                        <Button href={`mailto:${agentContact.email}`} variant="outline">Email</Button>
                        <Button href={agentContact.url} variant="text">Profile</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card lender-dashboard__empty-card">
                    <p>Add a primary BCRE agent for referrals and follow-up.</p>
                    <Button href="/agents" variant="primary">
                      Choose agent contact
                    </Button>
                  </div>
                )}
              </div>
              <div className="lender-dashboard__team-card">
                <h3 className="lender-dashboard__team-card-title">Your preferred lender</h3>
                {preferredLender ? (
                  <div className="card dashboard-contact-card lender-dashboard__contact-card">
                    <div className="lender-dashboard__contact-avatar">
                      <Image
                        src={preferredLender.image}
                        alt=""
                        width={72}
                        height={72}
                        style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="lender-dashboard__contact-body">
                      <p className="lender-dashboard__contact-name">{preferredLender.name}</p>
                      <p className="lender-dashboard__contact-meta">{preferredLender.title} · {preferredLender.company}</p>
                      {(preferredLender.phone || preferredLender.email) && (
                        <ul className="lender-dashboard__contact-list">
                          {preferredLender.phone && (
                            <li>
                              <span className="text--muted">Phone </span>
                              <a href={`tel:${preferredLender.phone.replace(/\D/g, '')}`}>{preferredLender.phone}</a>
                            </li>
                          )}
                          {preferredLender.email && (
                            <li>
                              <span className="text--muted">Email </span>
                              <a href={`mailto:${preferredLender.email}`} style={{ wordBreak: 'break-all' }}>{preferredLender.email}</a>
                            </li>
                          )}
                        </ul>
                      )}
                      <div className="dashboard-actions lender-dashboard__contact-actions">
                        {preferredLender.phone && <Button href={`tel:${preferredLender.phone.replace(/\D/g, '')}`} variant="primary">Call</Button>}
                        <Button href={`mailto:${preferredLender.email}`} variant="outline">Email</Button>
                        {preferredLender.url ? (
                          <Button href={preferredLender.url} variant="text" target="_blank" rel="noopener noreferrer">Website</Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card lender-dashboard__empty-card">
                    <p>Add a lender partner for co-loans or referrals.</p>
                    <Button href="/lenders" variant="primary">
                      Choose preferred lender
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Your profile & resources */}
          <section className="dashboard-section lender-dashboard__block" aria-labelledby="profile-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Profile</p>
              <h2 id="profile-heading" className="section-title">Your profile & partners</h2>
              <p className="section-lead">
                View the preferred lenders page as clients see it. Your profile appears when your account is linked to a lender entry.
              </p>
            </header>
            <div className="lender-dashboard__block-actions">
              <Button href="/lenders" variant="primary">
                View preferred lenders
              </Button>
            </div>
          </section>

          <section className="dashboard-section lender-dashboard__block" aria-labelledby="resources-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Resources</p>
              <h2 id="resources-heading" className="section-title">Partner resources</h2>
              <p className="section-lead">
                Guides and market information to share with clients and use in your workflow.
              </p>
            </header>
            <div className="dashboard-card-grid lender-dashboard__resource-grid">
              <div className="card lender-dashboard__resource-card">
                <h3>Resources</h3>
                <p>Market guides and content to share with clients.</p>
                <Button href="/resources" variant="outline">
                  Browse resources
                </Button>
              </div>
              <div className="card lender-dashboard__resource-card">
                <h3>Portland condo guide</h3>
                <p>Compare buildings, HOAs, and amenities for client conversations.</p>
                <Button href="/resources/portland-condo-guide" variant="outline">
                  Open condo guide
                </Button>
              </div>
              <div className="card lender-dashboard__resource-card">
                <h3>Contact BCRE</h3>
                <p>Questions about referrals, program updates, or your lender profile?</p>
                <Button href="/contact" variant="primary">
                  Contact BCRE
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
