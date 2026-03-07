import { redirect, notFound } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isOwnerRole, isBrokerRole, isLenderRole } from '@/lib/roles';
import { LEADS_SELECT } from '@/lib/leads-fields';
import { Hero } from '@/components/Hero';
import { LeadContactForm } from '@/app/agents/dashboard/leads/[id]/LeadContactForm';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lead detail | Owner dashboard',
  description: 'View and edit lead contact information. BCRE owner dashboard.',
};

type LeadRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  crmc_score?: number | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  assigned_broker_id?: string | null;
  assigned_lender_id?: string | null;
};

export default async function OwnerLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  if (!id) notFound();

  let user: { role?: string | null } | null = null;
  let lead: LeadRow | null = null;

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      try {
        await ensureUserInSupabase(clerkUser);
      } catch {
        // ignore
      }
    }

    const admin = supabaseAdmin();
    const [userRes, leadRes] = await Promise.all([
      admin.from('users').select('role').eq('clerk_id', userId).maybeSingle(),
      admin.from('leads').select(LEADS_SELECT).eq('id', id).maybeSingle(),
    ]);

    user = userRes.data ?? null;
    lead = leadRes.data as LeadRow | null;

    if (leadRes.error) {
      console.error('Lead detail load error:', formatSupabaseError(leadRes.error));
      notFound();
    }
    if (!lead) notFound();
  } catch (err) {
    console.error('Lead detail page error:', formatSupabaseError(err));
    notFound();
  }

  const clerkUser = await currentUser();
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isOwner = isOwnerRole(user?.role) || isOwnerRole(roleFromClerk);

  if (!isOwner) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) redirect('/agents/dashboard');
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  // Agents list for reassign dropdown (owner only)
  let agents: { value: string; label: string }[] = [];
  try {
    const admin = supabaseAdmin();
    const { data: users } = await admin
      .from('users')
      .select('clerk_id, slug, first_name, last_name')
      .in('role', ['broker', 'agent', 'owner']);
    const raw = (users ?? []).map((u) => {
      const label = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.slug || u.clerk_id || '—';
      return { clerk_id: u.clerk_id, slug: u.slug, label };
    });
    const seen = new Set<string>();
    for (const u of raw) {
      if (u.clerk_id && !seen.has(u.clerk_id)) {
        agents.push({ value: u.clerk_id, label: u.label });
        seen.add(u.clerk_id);
      }
      if (u.slug && u.slug !== u.clerk_id && !seen.has(u.slug)) {
        agents.push({ value: u.slug, label: u.label });
        seen.add(u.slug);
      }
    }
  } catch {
    // ignore
  }

  return (
    <main className="dashboard-page lead-detail-page owner-dashboard" aria-label="Lead detail">
      <Hero variant="short" title="Lead detail" lead="View and edit contact information." imageSrc={`${assetPaths.stock}/table.jpeg`} imageAlt="Lead detail" />
      <div className="section owner-dashboard__section">
        <div className="container owner-dashboard__container stack--lg">
          <LeadContactForm lead={lead} backHref="/owners/dashboard/leads" showReassign agents={agents} />
        </div>
      </div>
    </main>
  );
}
