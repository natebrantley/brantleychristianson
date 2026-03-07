import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isOwnerRole, isBrokerRole, isLenderRole } from '@/lib/roles';
import { buildMyLeadsBrokerIds } from '@/lib/owner-my-leads-ids';
import { LEADS_SELECT_PREVIEW } from '@/lib/leads-fields';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Owner dashboard',
  description: 'Full access to all leads and team CRM. BCRE owner dashboard.',
};

type OwnerUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; slug?: string | null };
type LeadRow = {
  id: string;
  email_address: string | null;
  assigned_broker_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

export default async function OwnersDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: OwnerUser | null = null;
  let leads: LeadRow[] = [];
  let totalCount = 0;
  let myLeadsCount = 0;

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

    const [userRes, leadsRes, countRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role, slug')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase.from('leads').select(LEADS_SELECT_PREVIEW).limit(10),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
    ]);

    user = userRes.data ?? null;
    if (userRes.error) {
      console.error('Error loading owner user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
    }
    totalCount = typeof countRes.count === 'number' ? countRes.count : 0;

    const clerkUserForBrokerIds = await currentUser();
    const brokerIds = buildMyLeadsBrokerIds(user, userId, clerkUserForBrokerIds);
    if (brokerIds.length > 0) {
      const { count: myCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('assigned_broker_id', brokerIds);
      myLeadsCount = typeof myCount === 'number' ? myCount : 0;
    }
  } catch (err) {
    console.error('Unexpected error loading owner dashboard:', { userId, ...formatSupabaseError(err) });
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role:', (clerkErr as Error)?.message ?? clerkErr);
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isOwner = isOwnerRole(user?.role) || isOwnerRole(roleFromClerk);

  if (!isOwner) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) redirect('/agents/dashboard');
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  if (!user && clerkUser) {
    user = {
      first_name: clerkUser.firstName ?? null,
      last_name: clerkUser.lastName ?? null,
      email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
      role: roleFromClerk ?? 'owner',
    };
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || null
    : null;

  return (
    <main className="dashboard-page owner-dashboard" aria-label="Owner dashboard">
      <Hero
        variant="short"
        title="Owner dashboard"
        lead="Full access to all leads. Search, sort, and manage any lead; view assigned brokers."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Owner dashboard – all leads and CRM"
      />
      <div className="section owner-dashboard__section">
        <div className="container owner-dashboard__container stack--lg">
          <div className="agent-welcome">
            <div className="agent-welcome__bg" aria-hidden />
            <div className="agent-welcome__inner">
              <div className="agent-welcome__content">
                <p className="agent-welcome__tag">Welcome back</p>
                <h1 className="agent-welcome__title">
                  {displayName ? `${displayName.split(' ')[0]}` : 'Owner'}
                </h1>
                {displayName && (
                  <p className="agent-welcome__sub">
                    Signed in as <strong>{displayName}</strong>
                    {user?.email ? ` · ${user.email}` : ''}
                  </p>
                )}
                <p style={{ marginTop: '0.5rem' }}>
                  <a href="/dashboard" className="text--muted" style={{ fontSize: '0.8125rem' }}>Refresh role from Clerk</a>
                </p>
              </div>
              <span className="agent-welcome__role" title="Synced from Clerk">Role: owner</span>
            </div>
          </div>

          <section className="dashboard-section" aria-labelledby="leads-db-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Leads</p>
              <h2 id="leads-db-heading" className="section-title">CRM</h2>
              <p className="section-lead">
                View all leads or only yours. Search, sort, and manage any lead; view and reassign assigned brokers.
              </p>
            </header>
            <div className="dashboard-actions owner-dashboard__leads-actions">
              <Link href="/owners/dashboard/leads?scope=mine" className="button button--outline">
                My leads ({myLeadsCount.toLocaleString()})
              </Link>
              <Link href="/owners/dashboard/leads" className="button button--primary">
                All leads ({totalCount.toLocaleString()})
              </Link>
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="marketing-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Resources</p>
              <h2 id="marketing-heading" className="section-title">Quick links</h2>
              <p className="section-lead">
                Share resources and browse team profiles.
              </p>
            </header>
            <div className="dashboard-actions">
              <Button href="/resources" variant="outline">
                Share resources with clients
              </Button>
              <Button href="/agents" variant="text">
                Browse team profiles
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
