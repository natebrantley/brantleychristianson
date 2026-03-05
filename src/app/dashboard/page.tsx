import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * /dashboard redirects to the correct dashboard based on role.
 * Agent dashboard: /agents (pipeline, leads, clients, marketing).
 * Client dashboard: /clients (saved homes, searches, next steps).
 * Role is read from Supabase (synced by webhook); if missing (e.g. webhook not run yet), falls back to Clerk public_metadata.role so agents still get the agent dashboard.
 */
export default async function DashboardRouterPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let roleFromSupabase: string | null | undefined;

  try {
    const supabase = await createClerkSupabaseClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user for dashboard routing:', { userId, ...formatSupabaseError(error) });
    }

    roleFromSupabase = user?.role;
    if (isBrokerRole(roleFromSupabase)) {
      redirect('/agents');
    }
  } catch (err) {
    console.error('Unexpected error during dashboard routing:', { userId, ...formatSupabaseError(err) });
  }

  // Fallback: if Supabase had no row or no broker role, check Clerk public_metadata (e.g. before webhook sync)
  const clerkUser = await currentUser();
  const roleFromClerk = clerkUser?.publicMetadata?.role;
  if (typeof roleFromClerk === 'string' && isBrokerRole(roleFromClerk)) {
    redirect('/agents');
  }

  redirect('/clients');
}

