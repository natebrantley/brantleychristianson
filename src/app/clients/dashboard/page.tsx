import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';
import { Button } from '@/components/Button';

export const dynamic = 'force-dynamic';

export default async function ClientsDashboardPage() {
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
      console.error('Error loading client user record from Supabase:', { userId, error });
    }

    user = data ?? null;
  } catch (err) {
    console.error('Unexpected error loading client user record:', { userId, error: err });
  }

  if (isBrokerRole(user?.role)) {
    redirect('/agents');
  }

  return (
    <main className="section">
      <div className="container stack--lg">
        <header className="stack--sm">
          <p className="section-tag">Client dashboard</p>
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

        {/* Saved homes */}
        <section className="dashboard-section" aria-labelledby="saved-homes-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Your portfolio</p>
            <h2 id="saved-homes-heading" className="section-title">Saved homes</h2>
            <p className="section-lead">
              Properties you&apos;ve saved while browsing. Your agent can help you narrow down and schedule showings.
            </p>
          </header>
          <div className="empty-state">
            <p>You haven&apos;t saved any homes yet. Browse our markets and listings, then save the ones you love.</p>
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
              Get notified when new listings match your criteria—neighborhood, price range, or building.
            </p>
          </header>
          <div className="empty-state">
            <p>No saved searches yet. Set up your first search and we&apos;ll email you when something matches.</p>
            <Button href="/contact" variant="outline">
              Request a consultation
            </Button>
          </div>
        </section>

        {/* Activity & next steps */}
        <section className="dashboard-section" aria-labelledby="next-steps-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Next steps</p>
            <h2 id="next-steps-heading" className="section-title">Getting started</h2>
            <p className="section-lead">
              Resources and ways to connect with your Brantley Christianson agent.
            </p>
          </header>
          <div className="card">
            <h3>Connect with your agent</h3>
            <p>
              Schedule a consultation to discuss your goals—buying, selling, or learning the market. We&apos;ll match you
              with a broker and keep your saved homes and searches in sync here.
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
              Compare buildings, HOAs, rent caps, and amenities across Portland condos. Use it to refine your saved
              searches and talk through options with your agent.
            </p>
            <Button href="/resources/portland-condo-guide" variant="text">
              Open Portland Condo Guide
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
