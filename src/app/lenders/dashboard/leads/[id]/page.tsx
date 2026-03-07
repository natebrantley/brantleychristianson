import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';
import { LEADS_SELECT } from '@/lib/leads-fields';
import { Hero } from '@/components/Hero';
import { LeadContactButtons } from '@/components/LeadContactButtons';
import { getBrokerDisplayNamesByClerkId } from '@/lib/broker-names';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Referral detail | Lender dashboard',
  description: 'View referral contact and notes. BCRE lender dashboard.',
  path: '/lenders/dashboard',
  ogImageAlt: 'BCRE lender dashboard – referral',
  robots: { index: false, follow: false },
});

type LeadRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  assigned_broker_id?: string | null;
  assigned_lender_id?: string | null;
  notes?: string | null;
};

export default async function LenderLeadDetailPage({
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
  let agentName = '—';

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
        .select(LEADS_SELECT)
        .eq('id', id)
        .eq('assigned_lender_id', userId)
        .maybeSingle(),
    ]);

    user = userRes.data ?? null;
    lead = leadRes.data as LeadRow | null;

    if (leadRes.error) {
      console.error('Lender lead detail load error:', formatSupabaseError(leadRes.error));
      notFound();
    }
    if (!lead) notFound();

    if (lead.assigned_broker_id) {
      const names = await getBrokerDisplayNamesByClerkId(supabase, [lead.assigned_broker_id]);
      agentName = names.get(lead.assigned_broker_id) ?? lead.assigned_broker_id;
    }
  } catch (err) {
    console.error('Lender lead detail page error:', formatSupabaseError(err));
    notFound();
  }

  const clerkUser = await currentUser();
  const roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : null;
  const isLender = isLenderRole(user?.role) || isLenderRole(roleFromClerk);

  if (!isLender) {
    if (isBrokerRole(user?.role) || isBrokerRole(roleFromClerk)) redirect('/agents/dashboard');
    redirect('/clients/dashboard');
  }

  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email_address || 'Referral';

  return (
    <main className="dashboard-page lead-detail-page lender-dashboard" aria-label="Referral detail">
      <Hero
        variant="short"
        title="Referral detail"
        lead="View contact and notes. Editing is done by the assigned agent."
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Referral detail"
      />
      <div className="section">
        <div className="container stack--lg">
          <div className="lead-detail">
            <nav className="lead-detail__back" aria-label="Back to dashboard">
              <Link href="/lenders/dashboard" className="lead-detail__back-link">
                ← Back to dashboard
              </Link>
            </nav>

            <header className="lead-detail__header">
              <h1 className="lead-detail__title">{displayName}</h1>
            </header>

            <section className="lead-detail__section" aria-label="Contact">
              <h2 className="lead-detail__section-title">Contact</h2>
              <LeadContactButtons
                phone={lead.phone}
                email={lead.email_address}
                marketingOptedOutAt={null}
                variant="table"
              />
            </section>

            {(lead.address || lead.city || lead.state || lead.zip) && (
              <section className="lead-detail__section" aria-label="Location">
                <h2 className="lead-detail__section-title">Location</h2>
                <p className="lead-detail__meta-list">
                  {[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}
                  {lead.zip ? ` ${lead.zip}` : ''}
                </p>
              </section>
            )}

            <section className="lead-detail__section" aria-label="Assigned agent">
              <h2 className="lead-detail__section-title">Assigned agent</h2>
              <p className="lead-detail__meta-list">{agentName}</p>
            </section>

            {(lead.notes ?? '').trim() && (
              <section className="lead-detail__section" aria-label="Notes">
                <h2 className="lead-detail__section-title">Notes</h2>
                <pre className="lead-detail__notes-readonly">{lead.notes}</pre>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
