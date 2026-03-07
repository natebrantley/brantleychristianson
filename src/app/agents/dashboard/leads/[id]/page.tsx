import { redirect, notFound } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError, supabaseAdmin } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { getAgentSlugByEmail } from '@/data/agents';
import { deriveUserSlug } from '@/lib/user-slug';
import { LEADS_SELECT } from '@/lib/leads-fields';
import { Hero } from '@/components/Hero';
import { LeadContactForm } from './LeadContactForm';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Client detail | Agent dashboard',
  description: 'View and edit client contact information. BCRE agent dashboard.',
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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  if (!id) notFound();

  let user: { role?: string | null; slug?: string | null; first_name?: string | null; last_name?: string | null } | null = null;
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

    const supabase = await createClerkSupabaseClient();
    const [userRes, leadRes] = await Promise.all([
      supabase.from('users').select('role, slug, first_name, last_name').eq('clerk_id', userId).maybeSingle(),
      supabase
        .from('leads')
        .select(LEADS_SELECT)
        .eq('id', id)
        .maybeSingle(),
    ]);

    user = userRes.data ?? null;
    lead = leadRes.data as LeadRow | null;

    if (leadRes.error) {
      console.error('Lead detail load error:', formatSupabaseError(leadRes.error));
      notFound();
    }
    if (!lead) {
      // Rescue: lead may have assigned_broker_id = email/name/slug (legacy), or null (unassigned).
      // Use fresh currentUser for possibleIds in case of stale closure.
      const currentClerkUser = await currentUser();
      if (currentClerkUser) {
        const fullName = [currentClerkUser.firstName, currentClerkUser.lastName].filter(Boolean).join(' ').trim();
        const email = currentClerkUser.emailAddresses?.[0]?.emailAddress ?? '';
        const slug = getAgentSlugByEmail(email);
        const possibleIds: string[] = [userId];
        if (email) possibleIds.push(String(email).trim());
        if (fullName) possibleIds.push(fullName);
        if (slug) possibleIds.push(slug);
        if (user?.slug) possibleIds.push(user.slug);
        const derivedSlug = deriveUserSlug(user?.first_name, user?.last_name) ?? deriveUserSlug(currentClerkUser.firstName, currentClerkUser.lastName);
        if (derivedSlug) possibleIds.push(derivedSlug);
        const uniq = [...new Set(possibleIds)];
        const uniqWithCase = new Set([...uniq, ...uniq.map((s) => s.toLowerCase())]);
        const admin = supabaseAdmin();
        const { data: rescueRow } = await admin
          .from('leads')
          .select('id, assigned_broker_id')
          .eq('id', id)
          .maybeSingle();
        const assignedTrimmed = rescueRow?.assigned_broker_id?.trim();
        const isLegacyMatch =
          assignedTrimmed &&
          (uniqWithCase.has(assignedTrimmed) || uniqWithCase.has(assignedTrimmed.toLowerCase()));
        const isUnassigned = rescueRow && !assignedTrimmed;
        const canonicalBrokerId = (user?.slug && user.slug.trim()) ? user.slug.trim() : (getAgentSlugByEmail(currentClerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined) ?? userId);
        if (rescueRow && (isLegacyMatch || isUnassigned)) {
          await admin.from('leads').update({ assigned_broker_id: canonicalBrokerId }).eq('id', id);
          const { data: refetched } = await supabase
            .from('leads')
            .select(LEADS_SELECT)
            .eq('id', id)
            .maybeSingle();
          if (refetched) lead = refetched as unknown as LeadRow;
        }
      }
      if (!lead) notFound();
    }
  } catch (err) {
    console.error('Lead detail page error:', formatSupabaseError(err));
    notFound();
  }

  const clerkUser = await currentUser();
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  return (
    <main className="dashboard-page lead-detail-page agent-dashboard" aria-label="Lead detail – contact and profile">
      <Hero
        variant="short"
        title="Client detail"
        lead="View and edit contact information."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Client detail"
      />
      <div className="section">
        <div className="container stack--lg">
          <LeadContactForm lead={lead} backHref="/agents/dashboard/leads" />
        </div>
      </div>
    </main>
  );
}
