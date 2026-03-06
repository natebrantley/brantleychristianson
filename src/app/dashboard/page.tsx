import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { ensureUserInSupabase } from '@/lib/sync-clerk-user';
import { isBrokerRole, isLenderRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * /dashboard redirects to the correct dashboard based on role.
 * Agent/broker dashboard: /agents/dashboard (pipeline, leads, clients, marketing).
 * Lender dashboard: /lenders/dashboard (lender-specific tools and resources).
 * Client dashboard: /clients/dashboard (saved homes, searches, next steps).
 * Role is read from Supabase (synced by webhook or sign-in sync); if missing, falls back to Clerk public_metadata.role.
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

    // If no row in Supabase (e.g. webhook missed or user signed in before webhook ran), sync from Clerk now
    if (!user && !error) {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const synced = await ensureUserInSupabase(clerkUser);
          if (synced) roleFromSupabase = synced.role;
        }
      } catch (clerkErr) {
        console.warn('Could not fetch Clerk user for sync:', (clerkErr as Error)?.message ?? clerkErr);
      }
    }

    if (isBrokerRole(roleFromSupabase)) {
      redirect('/agents/dashboard');
    }
    if (isLenderRole(roleFromSupabase)) {
      redirect('/lenders/dashboard');
    }
  } catch (err) {
    console.error('Unexpected error during dashboard routing:', { userId, ...formatSupabaseError(err) });
  }

  // Fallback: if Supabase had no row or no special role, check Clerk public_metadata (e.g. before sync ran)
  let roleFromClerk: string | undefined;
  try {
    const clerkUser = await currentUser();
    roleFromClerk = typeof clerkUser?.publicMetadata?.role === 'string' ? clerkUser.publicMetadata.role : undefined;
  } catch (clerkErr) {
    console.warn('Could not fetch Clerk user for role fallback:', (clerkErr as Error)?.message ?? clerkErr);
  }
  if (typeof roleFromClerk === 'string' && isBrokerRole(roleFromClerk)) {
    redirect('/agents/dashboard');
  }
  if (typeof roleFromClerk === 'string' && isLenderRole(roleFromClerk)) {
    redirect('/lenders/dashboard');
  }

  redirect('/clients/dashboard');
}

