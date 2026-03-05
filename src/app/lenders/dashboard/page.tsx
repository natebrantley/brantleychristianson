import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lender dashboard',
  description: 'Dashboard for BCRE preferred lenders. Resources, partner links, and referrals.',
  robots: { index: false, follow: true },
};

type LenderUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null };

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
      .select('first_name, last_name, email, role')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading lender user from Supabase:', { userId, ...formatSupabaseError(error) });
    }
    user = data ?? null;
  } catch (err) {
    console.error('Unexpected error loading lender dashboard:', { userId, ...formatSupabaseError(err) });
  }

  // Allow access if Supabase has lender role, or if Clerk public_metadata has it (e.g. before webhook sync)
  const clerkUser = await currentUser();
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isLender = isLenderRole(user?.role) || isLenderRole(roleFromClerk);

  if (!isLender) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) {
      redirect('/agents');
    }
    redirect('/clients');
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null
    : null;

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
