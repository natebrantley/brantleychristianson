import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole, isLenderRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * /dashboard redirects to the correct dashboard based on role.
 * Agent dashboard: /agents (pipeline, leads, clients, marketing).
 * Lender dashboard: /lenders/dashboard (lender-specific tools and resources).
 * Client dashboard: /clients (saved homes, searches, next steps).
 * Role is read from Supabase (synced by webhook); if missing, falls back to Clerk public_metadata.role.
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
    if (isLenderRole(roleFromSupabase)) {
      redirect('/lenders/dashboard');
    }
  } catch (err) {
    console.error('Unexpected error during dashboard routing:', { userId, ...formatSupabaseError(err) });
  }

  // Fallback: if Supabase had no row or no special role, check Clerk public_metadata (e.g. before webhook sync)
  const clerkUser = await currentUser();
  const roleFromClerk = clerkUser?.publicMetadata?.role;
  if (typeof roleFromClerk === 'string' && isBrokerRole(roleFromClerk)) {
    redirect('/agents');
  }
  if (typeof roleFromClerk === 'string' && isLenderRole(roleFromClerk)) {
    redirect('/lenders/dashboard');
  }

  redirect('/clients');
}

