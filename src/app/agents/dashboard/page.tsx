import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';
import { Button } from '@/components/Button';

export const dynamic = 'force-dynamic';

export default async function AgentsDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null } | null =
    null;

  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading agent user record from Supabase:', { userId, ...formatSupabaseError(error) });
    }

    user = data ?? null;
  } catch (err) {
    console.error('Unexpected error loading agent user record:', { userId, ...formatSupabaseError(err) });
  }

  if (!user || !isBrokerRole(user.role)) {
    redirect('/clients');
  }

  return (
    <main className="section">
      <div className="container stack--lg">
        <header className="stack--sm">
          <p className="section-tag">Agent dashboard</p>
          <h1 className="section-title">Welcome back</h1>
          {user && (
            <p className="section-lead">
              Signed in as <strong>{user.first_name ?? ''} {user.last_name ?? ''}</strong>
              {user.email ? ` (${user.email})` : null}
            </p>
          )}
          {!user && (
            <p className="section-lead">
              Your profile is set up in Clerk. We&apos;ll finish syncing details into the dashboard shortly.
            </p>
          )}
        </header>

        {/* Overview stats – placeholder counts until wired to CRM/data */}
        <section className="dashboard-section" aria-labelledby="overview-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Overview</p>
            <h2 id="overview-heading" className="section-title">Your pipeline</h2>
            <p className="section-lead">
              High-level counts for leads, active clients, and recent activity. Data will sync from your CRM and
              consultations.
            </p>
          </header>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="dashboard-stat-value">—</div>
              <div className="dashboard-stat-label">New leads</div>
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

        {/* Leads */}
        <section className="dashboard-section" aria-labelledby="leads-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Leads</p>
            <h2 id="leads-heading" className="section-title">Recent leads</h2>
            <p className="section-lead">
              Incoming consultation requests and lead sources. Follow up from here or in your CRM.
            </p>
          </header>
          <div className="empty-state">
            <p>Leads from the site and your marketing will appear here. Integration with Repliers or your CRM is coming.</p>
            <Button href="/contact" variant="outline">
              View contact form
            </Button>
          </div>
        </section>

        {/* Active clients */}
        <section className="dashboard-section" aria-labelledby="clients-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Clients</p>
            <h2 id="clients-heading" className="section-title">Active clients</h2>
            <p className="section-lead">
              Clients you&apos;re currently working with—saved homes, searches, and next steps in one place.
            </p>
          </header>
          <div className="empty-state">
            <p>Active client cards will show here once linked to your account. Use your CRM for now; we&apos;ll sync soon.</p>
          </div>
        </section>

        {/* Marketing insights */}
        <section className="dashboard-section" aria-labelledby="marketing-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Marketing</p>
            <h2 id="marketing-heading" className="section-title">Marketing insights</h2>
            <p className="section-lead">
              How your listings and content are performing—views, inquiries, and top markets.
            </p>
          </header>
          <div className="card">
            <h3>Coming soon</h3>
            <p>
              We&apos;re adding views and engagement metrics for your listings and market pages. You&apos;ll see which
              content drives the most consultations and how to prioritize your time.
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
