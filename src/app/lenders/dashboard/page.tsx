import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import { getAgentBySlug } from '@/data/agents';
import type { Metadata } from 'next';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lender dashboard',
  description: 'Dashboard for BCRE preferred lenders. Resources, partner links, and referrals.',
  robots: { index: false, follow: true },
};

type LenderUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; assigned_broker_id?: string | null };

export default async function LendersDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: LenderUser | null = null;

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, email, role, assigned_broker_id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading lender user from Supabase:', { userId, ...formatSupabaseError(error) });
    }
    user = data ?? null;

    // If no row in Supabase, sync from Clerk so future requests see the user
    if (!user && !error) {
      const clerkUser = await currentUser();
      if (clerkUser) await ensureUserInSupabase(clerkUser);
    }
  } catch (err) {
    console.error('Unexpected error loading lender dashboard:', { userId, ...formatSupabaseError(err) });
  }

  // Allow access if Supabase has lender role, or if Clerk public_metadata has it (e.g. before webhook sync)
  const clerkUser = await currentUser();
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

  const agentContact = user?.assigned_broker_id ? getAgentBySlug(user.assigned_broker_id) : null;

  if (!user && clerkUser) {
    user = {
      first_name: clerkUser.firstName ?? null,
      last_name: clerkUser.lastName ?? null,
      email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
      role: roleFromClerk ?? 'lender',
    };
  }

  return (
    <main>
      <Hero
        variant="short"
        title="Lender dashboard"
        lead="Resources and tools for BCRE preferred lending partners."
        imageSrc={`${assetPaths.stock}/office.jpeg`}
        imageAlt="Lender dashboard – preferred lending partners"
      />
      <div className="section">
        <div className="container stack--lg">
          <header className="stack--sm">
            <p className="section-tag">Welcome back</p>
            <h1 className="section-title">
              {displayName ? `Hi, ${displayName.split(' ')[0]}` : 'Lender dashboard'}
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
            <span
              className="text--muted"
              style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
              title="Synced from Clerk (Public metadata role)"
            >
              Role: {user?.role ?? 'lender'}
            </span>
          </header>

          {/* Agent contact for easy referral follow-up */}
          <section className="dashboard-section" aria-labelledby="agent-contact-heading">
            <h2 id="agent-contact-heading" className="section-title" style={{ marginBottom: '0.5rem' }}>
              Your agent contact
            </h2>
            {agentContact ? (
              <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src={agentContact.image}
                    alt=""
                    width={80}
                    height={80}
                    style={{ borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '1.125rem' }}>{agentContact.name}</p>
                  <p className="text--muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9375rem' }}>{agentContact.title}</p>
                  {(agentContact.phone || agentContact.email) && (
                    <ul style={{ margin: 'var(--space-sm) 0 0 0', padding: 0, listStyle: 'none', fontSize: '0.9375rem' }}>
                      {agentContact.phone && (
                        <li style={{ marginTop: '0.25rem' }}>
                          <span className="text--muted">Phone: </span>
                          <a href={`tel:${agentContact.phone.replace(/\D/g, '')}`} style={{ fontWeight: 500 }}>
                            {agentContact.phone}
                          </a>
                        </li>
                      )}
                      {agentContact.email && (
                        <li style={{ marginTop: '0.25rem' }}>
                          <span className="text--muted">Email: </span>
                          <a href={`mailto:${agentContact.email}`} style={{ fontWeight: 500, wordBreak: 'break-all' }}>
                            {agentContact.email}
                          </a>
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)', gap: '0.5rem' }}>
                    {agentContact.phone && (
                      <Button href={`tel:${agentContact.phone.replace(/\D/g, '')}`} variant="primary">
                        Call {agentContact.name}
                      </Button>
                    )}
                    <Button href={`mailto:${agentContact.email}`} variant="outline">
                      Email
                    </Button>
                    <Button href={agentContact.url} variant="text">
                      View profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <p style={{ margin: 0 }}>
                  Add a primary BCRE agent contact for referrals and follow-up. They&apos;ll appear here for quick call and email.
                </p>
                <div className="dashboard-actions" style={{ marginTop: 'var(--space-md)' }}>
                  <Button href="/agents" variant="primary">
                    Choose your agent contact
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="dashboard-section" aria-labelledby="lenders-partners-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Preferred lenders</p>
              <h2 id="lenders-partners-heading" className="section-title">
                Your profile & partners
              </h2>
              <p className="section-lead">
                View the preferred lenders page as clients see it. Your profile appears there when your account is linked to a lender entry.
              </p>
            </header>
            <div className="dashboard-actions">
              <Button href="/lenders" variant="primary">
                View preferred lenders
              </Button>
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="resources-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Resources</p>
              <h2 id="resources-heading" className="section-title">
                Partner resources
              </h2>
              <p className="section-lead">
                Guides and market information to share with clients and use in your workflow.
              </p>
            </header>
            <div className="card">
              <div className="dashboard-actions" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <Button href="/resources" variant="outline">
                  Browse resources
                </Button>
                <Button href="/resources/portland-condo-guide" variant="outline">
                  Portland condo guide
                </Button>
                <Button href="/markets" variant="text">
                  Explore markets
                </Button>
              </div>
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="contact-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Get in touch</p>
              <h2 id="contact-heading" className="section-title">
                BCRE team
              </h2>
              <p className="section-lead">
                Questions about referrals, program updates, or your lender profile? Reach out to the team.
              </p>
            </header>
            <Button href="/contact" variant="primary">
              Contact BCRE
            </Button>
          </section>
        </div>
      </div>
    </main>
  );
}
