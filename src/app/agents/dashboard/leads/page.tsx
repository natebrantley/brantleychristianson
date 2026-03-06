import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { Hero } from '@/components/Hero';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export const metadata: Metadata = {
  title: 'All leads | Agent dashboard',
  description: 'All assigned leads – CRM view. BCRE agent dashboard.',
};

type AgentUser = { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null };
type LeadRow = {
  id: string;
  email: string;
  created_at: string;
  assigned_broker_id?: string | null;
  clerk_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  last_login?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
};

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

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const page = Math.max(1, parseInt((await searchParams).page ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let user: AgentUser | null = null;
  let leads: LeadRow[] = [];
  let totalCount = 0;

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      try {
        await ensureUserInSupabase(clerkUser);
      } catch {
        // ignore
      }
    }

    const supabase = await createClerkSupabaseClient();

    const [userRes, leadsRes] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, last_name, email, role')
        .eq('clerk_id', userId)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries', { count: 'exact' })
        .eq('assigned_broker_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
    ]);

    user = userRes.data ?? null;
    if (!leadsRes.error && Array.isArray(leadsRes.data)) {
      leads = leadsRes.data as LeadRow[];
    }
    totalCount = typeof leadsRes.count === 'number' ? leadsRes.count : leads.length;

    const forFallback = user ?? (clerkUser ? { first_name: clerkUser.firstName, last_name: clerkUser.lastName, email: clerkUser.emailAddresses?.[0]?.emailAddress } : null);
    if (leads.length === 0 && totalCount === 0 && forFallback) {
      const fullName = [forFallback.first_name, forFallback.last_name].filter(Boolean).join(' ').trim();
      const slug = getAgentSlugByEmail(forFallback.email ?? undefined);
      const possibleIds: string[] = [userId];
      if (forFallback.email) possibleIds.push(String(forFallback.email).trim());
      if (fullName) possibleIds.push(fullName);
      if (slug) possibleIds.push(slug);
      const uniq = [...new Set(possibleIds)];
      const uniqWithCase = [...new Set([...uniq, ...uniq.map((s) => s.toLowerCase())])];

      const admin = supabaseAdmin();
      const { data: fallbackLeads, count: fallbackCount } = await admin
        .from('leads')
        .select('id, email, created_at, assigned_broker_id, clerk_id, first_name, last_name, phone, last_login, property_views, property_inquiries', { count: 'exact' })
        .in('assigned_broker_id', uniqWithCase)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (Array.isArray(fallbackLeads)) {
        leads = fallbackLeads as LeadRow[];
        totalCount = typeof fallbackCount === 'number' ? fallbackCount : leads.length;
      }
    }
  } catch (err) {
    console.error('Error loading agent leads:', formatSupabaseError(err));
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    clerkUser = await currentUser();
  } catch {
    // ignore
  }
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  function leadDisplayName(lead: LeadRow): string {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
    return name || lead.email || '—';
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <main className="dashboard-page">
      <Hero
        variant="short"
        title="All leads"
        lead="All assigned leads in one place. CRM view."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads – CRM"
      />
      <div className="section">
        <div className="container stack--lg">
          <header className="dashboard-section-header stack--xs">
            <Link href="/agents/dashboard" className="text--muted" style={{ fontSize: '0.875rem' }}>
              ← Back to dashboard
            </Link>
            <h1 className="section-title">Leads</h1>
            <p className="section-lead">
              {totalCount} lead{totalCount !== 1 ? 's' : ''} assigned to you. Sorted by most recent.
            </p>
          </header>

          {leads.length > 0 ? (
            <>
              <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Name</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Email</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Phone</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Last active</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Views</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Inquiries</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Created</th>
                      <th style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 600, fontSize: '0.8125rem' }}>Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontWeight: 500 }}>{leadDisplayName(lead)}</td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text--muted" style={{ fontSize: '0.875rem' }}>{lead.email}</a>
                          ) : '—'}
                        </td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: '0.875rem' }}>
                          {lead.phone ? (
                            <a href={`tel:${lead.phone.replace(/\D/g, '')}`}>{lead.phone}</a>
                          ) : '—'}
                        </td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: '0.875rem' }}>{formatLastActive(lead.last_login)}</td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: '0.875rem' }}>{lead.property_views ?? '—'}</td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: '0.875rem' }}>{lead.property_inquiries ?? '—'}</td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: '0.875rem' }}>{formatLeadDate(lead.created_at)}</td>
                        <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                          {lead.clerk_id ? <span style={{ fontWeight: 500 }}>Yes</span> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav aria-label="Leads pagination" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <span className="text--muted" style={{ fontSize: '0.875rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  {hasPrev && (
                    <Link href={`/agents/dashboard/leads?page=${page - 1}`} className="button button--outline" style={{ fontSize: '0.875rem' }}>
                      Previous
                    </Link>
                  )}
                  {hasNext && (
                    <Link href={`/agents/dashboard/leads?page=${page + 1}`} className="button button--outline" style={{ fontSize: '0.875rem' }}>
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No leads assigned to you yet.</p>
              <Link href="/agents/dashboard" className="button button--outline" style={{ marginTop: '0.5rem' }}>
                Back to dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
