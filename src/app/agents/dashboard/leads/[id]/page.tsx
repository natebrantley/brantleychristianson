import { redirect, notFound } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
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
  email?: string | null;
  email_address?: string | null;
  phone?: string | null;
  notes?: string | null;
  source?: string | null;
  timeframe?: string | null;
  city?: string | null;
  state?: string | null;
  clerk_id?: string | null;
  created_at?: string | null;
  last_login?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
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

    const supabase = await createClerkSupabaseClient();
    const [userRes, leadRes] = await Promise.all([
      supabase.from('users').select('role').eq('clerk_id', userId).maybeSingle(),
      supabase
        .from('leads')
        .select(
          'id, first_name, last_name, email, email_address, phone, notes, source, timeframe, city, state, clerk_id, created_at, last_login, property_views, property_inquiries'
        )
        .eq('id', id)
        .maybeSingle(),
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
  const isAgent = isBrokerRole(user?.role) || isBrokerRole(roleFromClerk);

  if (!isAgent) {
    if (isLenderRole(user?.role) || isLenderRole(roleFromClerk)) redirect('/lenders/dashboard');
    redirect('/clients/dashboard');
  }

  return (
    <main className="dashboard-page lead-detail-page agent-dashboard">
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
