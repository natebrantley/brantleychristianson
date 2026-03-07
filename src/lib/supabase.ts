import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/** Serialize Supabase or Error for logging (avoids empty {} in console) */
export function formatSupabaseError(error: unknown): Record<string, unknown> {
  if (error == null) return { error: null };
  if (error instanceof Error) return { message: error.message, name: error.name };
  if (typeof error === 'object' && 'message' in error) {
    const e = error as { message?: string; code?: string; details?: string };
    return { message: e.message, code: e.code, details: e.details };
  }
  return { message: String(error) };
}

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function createClerkSupabaseClient(): Promise<SupabaseClient<Database>> {
  if (typeof window !== 'undefined') {
    throw new Error('createClerkSupabaseClient must not be used in client-side components.');
  }

  const { getToken } = await auth();
  /** Template name in Clerk (e.g. "supabase"). See docs/CLERK-JWT-SUPABASE.md for required claims (sub, aud, role). */
  const template = process.env.CLERK_JWT_TEMPLATE_SUPABASE?.trim();
  let token: string | null = null;

  if (template) {
    try {
      token = await getToken({ template });
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      if (msg !== 'Not Found' && !msg.toLowerCase().includes('not found')) {
        console.warn('Clerk JWT template not available, using default token:', msg);
      }
    }
  }
  if (!token) {
    token = await getToken();
  }

  if (!token) {
    throw new Error('No Clerk session token available for Supabase client.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        return fetch(input, {
          ...init,
          headers,
        });
      },
    },
  });
}

let cachedAdminClient: SupabaseClient<Database> | null = null;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin must not be used in client-side components.');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey as string);
  }

  return cachedAdminClient;
}

