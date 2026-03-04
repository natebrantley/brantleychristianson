import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient, formatSupabaseError } from '@/lib/supabase';
import { isBrokerRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function DashboardRouterPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

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

    if (isBrokerRole(user?.role)) {
      redirect('/agents');
    }
  } catch (err) {
    console.error('Unexpected error during dashboard routing:', { userId, ...formatSupabaseError(err) });
  }

  redirect('/clients');
}

