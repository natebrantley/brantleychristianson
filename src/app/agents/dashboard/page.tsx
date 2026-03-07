import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { deriveUserSlug } from '@/lib/user-slug';
import { LEADS_SELECT_PREVIEW } from '@/lib/leads-fields';
import { Button } from '@/components/Button';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Agent dashboard',
  description: 'Your leads, client activity, and CRM. BCRE agent dashboard. Oregon and Washington.',
  path: '/agents/dashboard',
  ogImageAlt: 'BCRE agent dashboard',
  robots: { index: false, follow: false },
});

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null; slug?: string | null; assigned_broker_id?: string | null; assigned_lender_id?: string | null };
type LeadRow = {
  id: string;
  email_address: string | null;
  assigned_broker_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};
type SavedSearchRow = { id: string; clerk_id: string; name: string | null; criteria: Record<string, unknown>; created_at: string };

function formatLeadDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatLastActive(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default async function AgentsDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: AgentUser | null = null;
  let leads: LeadRow[] = [];
  let savedSearches: SavedSearchRow[] = [];
  let totalAssignedCount = 0;

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

    const userRes = await supabase
      .from('users')
      .select('first_name, last_name, email, role, slug, assigned_broker_id, assigned_lender_id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (userRes.error) {
      console.error('Error loading agent user from Supabase:', { userId, ...formatSupabaseError(userRes.error) });
    }
    user = userRes.data ?? null;

    const brokerIds: string[] = [userId];
    if (user?.slug?.trim()) brokerIds.push(user.slug.trim());
    const derived = deriveUserSlug(user?.first_name, user?.last_name) ?? deriveUserSlug(clerkUser?.firstName, clerkUser?.lastName);
    if (derived) brokerIds.push(derived);
    const agentSlug = getAgentSlugByEmail(user?.email ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined);
    if (agentSlug) brokerIds.push(agentSlug);
    const uniqBrokerIds = [...new Set(brokerIds)];
    const uniqWithCase = [...new Set([...uniqBrokerIds, ...uniqBrokerIds.map((s) => s.toLowerCase())])];

    const [leadsRes, countRes] = await Promise.all([
      supabase.from('leads').select(LEADS_SELECT_PREVIEW).in('assigned_broker_id', uniqWithCase).limit(10),
      supabase.from('leads').select('*', { count: 'exact', head: true }).in('assigned_broker_id', uniqWithCase),
    ]);

    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
    }
    totalAssignedCount = typeof countRes.count === 'number' ? countRes.count : 0;

    const canonicalBrokerId = (user?.slug?.trim()) ? user.slug!.trim() : (agentSlug ?? userId);
    const idsToNormalize = leads.filter((l) => l.assigned_broker_id !== canonicalBrokerId).map((l) => l.id);
    if (idsToNormalize.length > 0) {
      await supabaseAdmin().from('leads').update({ assigned_broker_id: canonicalBrokerId }).in('id', idsToNormalize);
    }

    // Saved searches: leads no longer have clerk_id; skip fetching by lead client
    const clientClerkIds: string[] = [];
    if (clientClerkIds.length > 0) {
      const admin = supabaseAdmin();
      const { data: searches } = await admin
        .from('saved_searches')
        .select('id, clerk_id, name, criteria, created_at')
        .in('clerk_id', clientClerkIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (Array.isArray(searches)) {
        savedSearches = searches as SavedSearchRow[];
      }
    }
  } catch (err) {
    console.error('Unexpected error loading agent dashboard:', { userId, ...formatSupabaseError(err) });
  }

  // Allow access if Supabase has broker role, or if Clerk public_metadata has it (e.g. before webhook sync)
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role:', (clerkErr as Error)?.message ?? clerkErr);
  }
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

  function leadDisplayName(lead: LeadRow): string {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
    return name || (lead.email_address ?? '') || '—';
  }

  // Map clerk_id → lead display name for saved searches (leads no longer have clerk_id; map stays empty)
  const clerkIdToName = new Map<string, string>();

  return (
    <main className="dashboard-page agent-dashboard" aria-label="Agent dashboard">
      <Hero
        variant="short"
        title="Agent dashboard"
        lead="Your leads database and quick links."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Agent dashboard – assigned leads and activity"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="agent-welcome">
            <div className="agent-welcome__bg" aria-hidden />
            <div className="agent-welcome__inner">
              <div className="agent-welcome__content">
                <p className="agent-welcome__tag">Welcome back</p>
                <h1 className="agent-welcome__title">
                  {displayName ? `${displayName.split(' ')[0]}` : 'Dashboard'}
                </h1>
                {displayName && (
                  <p className="agent-welcome__sub">
                    Signed in as <strong>{displayName}</strong>
                    {user?.email ? ` · ${user.email}` : ''}
                  </p>
                )}
                {!displayName && (
                  <p className="agent-welcome__sub">
                    Your profile is syncing from Clerk. Refresh in a moment.
                  </p>
                )}
                <p style={{ marginTop: '0.5rem' }}>
                  <a href="/dashboard" className="text--muted" style={{ fontSize: '0.8125rem' }}>Refresh role from Clerk</a>
                </p>
              </div>
              <span className="agent-welcome__role" title="Synced from Clerk">Role: {user?.role ?? '—'}</span>
            </div>
          </div>

          {/* Leads database — primary action */}
          <section className="dashboard-section" aria-labelledby="leads-db-heading">
            <header className="dashboard-section-header stack--xs">
              <p className="section-tag">Leads</p>
              <h2 id="leads-db-heading" className="section-title">Leads database</h2>
              <p className="section-lead">
                Search, sort, and manage your assigned leads. View contact info and follow up in one place.
              </p>
            </header>
            <div className="dashboard-actions">
              <Link href="/agents/dashboard/leads" className="button button--primary">
                Open leads database
              </Link>
            </div>
          </section>

        {/* Client saved searches */}
        <section className="dashboard-section" aria-labelledby="saved-searches-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Searches</p>
            <h2 id="saved-searches-heading" className="section-title">Client saved searches</h2>
            <p className="section-lead">
              Saved searches created by your assigned clients. Stay aligned on what they’re looking for.
            </p>
          </header>
          {savedSearches.length > 0 ? (
            <ul className="agent-searches-list">
              {savedSearches.map((search) => (
                <li key={search.id} className="agent-search-card">
                  <div className="agent-search-card__row">
                    <span className="agent-search-card__title">{search.name || 'Untitled search'}</span>
                    <span className="agent-search-card__date">{formatLeadDate(search.created_at)}</span>
                  </div>
                  <p className="agent-search-card__client">
                    Client: {clerkIdToName.get(search.clerk_id) ?? '—'}
                  </p>
                  {search.criteria && typeof search.criteria === 'object' && Object.keys(search.criteria).length > 0 && (
                    <p className="agent-search-card__criteria" title={JSON.stringify(search.criteria)}>
                      {JSON.stringify(search.criteria)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No saved searches from your clients yet. When assigned clients save a search on the site, it will appear here.</p>
            </div>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="marketing-heading">
          <header className="dashboard-section-header stack--xs">
            <p className="section-tag">Marketing</p>
            <h2 id="marketing-heading" className="section-title">Marketing insights</h2>
            <p className="section-lead">
              Listings and content performance—views, inquiries, top markets.
            </p>
          </header>
          <div className="agent-upsell">
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
