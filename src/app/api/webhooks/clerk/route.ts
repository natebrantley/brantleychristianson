import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

const SUPPORTED_EVENTS = ['user.created', 'user.updated', 'user.deleted'] as const;
type SupportedEventType = (typeof SUPPORTED_EVENTS)[number];

/** Row we write to public.users. Role is always set (agent | broker | user). */
interface UsersRow {
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'agent' | 'broker' | 'user';
}

/** Standard error response for 4xx/5xx */
function errResponse(
  message: string,
  status: number,
  extra?: { code?: string; details?: string }
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Standard success: 200 with no body (Clerk expects 2xx) */
function okResponse(): NextResponse {
  return new NextResponse(null, { status: 200 });
}

/** Structured log for success (durationMs, eventType, svixId) — helps tracing in Vercel Logs */
function logSuccess(logContext: Record<string, unknown>, durationMs: number): void {
  console.log('Clerk webhook: success', { ...logContext, durationMs, status: 'ok' });
}

function getEnvError(): string | null {
  if (!process.env.CLERK_WEBHOOK_SECRET?.trim()) return 'Missing CLERK_WEBHOOK_SECRET';
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) return 'Missing NEXT_PUBLIC_SUPABASE_URL';
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return 'Missing SUPABASE_SERVICE_ROLE_KEY';
  return null;
}

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, key);
}

function formatSupabaseError(error: unknown): { message?: string; code?: string; details?: string } {
  if (error == null) return {};
  if (typeof error === 'object' && 'message' in error) {
    const e = error as { message?: string; code?: string; details?: string };
    return { message: e.message, code: e.code, details: e.details };
  }
  return { message: String(error) };
}

/** Extract primary email from Clerk user payload */
function getPrimaryEmail(data: WebhookEvent['data']): string | null {
  if (!data || typeof data !== 'object' || !('email_addresses' in data)) return null;
  const list = Array.isArray(data.email_addresses) ? data.email_addresses : [];
  const first = list[0];
  if (!first || typeof first !== 'object' || first === null) return null;
  const email = 'email_address' in first ? (first as { email_address?: string }).email_address : undefined;
  return typeof email === 'string' && email.trim().length > 0 ? email.trim() : null;
}

/** Extract dashboard role from public_metadata (agent | broker only); undefined = not set */
function getRoleFromMetadata(data: WebhookEvent['data']): 'agent' | 'broker' | null | undefined {
  if (!data || typeof data !== 'object' || !('public_metadata' in data)) return undefined;
  const meta = (data as { public_metadata?: unknown }).public_metadata;
  if (meta == null || typeof meta !== 'object' || !('role' in meta)) return undefined;
  const r = (meta as { role?: unknown }).role;
  if (typeof r !== 'string') return undefined;
  const lower = r.trim().toLowerCase();
  if (lower === 'agent' || lower === 'broker') return lower;
  return null;
}

/** Build users row from Clerk user payload; clerkId required. Role falls back to 'user'. */
function buildUsersRow(clerkId: string, data: WebhookEvent['data']): UsersRow {
  if (!data || typeof data !== 'object') {
    return { clerk_id: clerkId, email: null, first_name: null, last_name: null, role: 'user' };
  }
  const d = data as unknown as Record<string, unknown>;
  const firstName =
    typeof d.first_name === 'string' && d.first_name.trim().length > 0 ? d.first_name.trim() : null;
  const lastName =
    typeof d.last_name === 'string' && d.last_name.trim().length > 0 ? d.last_name.trim() : null;
  const roleFromMeta = getRoleFromMetadata(data);
  const role: 'agent' | 'broker' | 'user' =
    roleFromMeta === 'agent' || roleFromMeta === 'broker' ? roleFromMeta : 'user';
  return {
    clerk_id: clerkId,
    email: getPrimaryEmail(data),
    first_name: firstName,
    last_name: lastName,
    role,
  };
}

/** Handle user.deleted: remove from Supabase by clerk_id */
async function handleUserDeleted(
  admin: SupabaseClient,
  data: WebhookEvent['data'],
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  if (!data || typeof data !== 'object' || !('id' in data)) return okResponse();
  const clerkId = typeof (data as { id?: unknown }).id === 'string' ? (data as { id: string }).id.trim() : null;
  if (!clerkId) return okResponse();

  const { error } = await admin.from('users').delete().eq('clerk_id', clerkId);

  if (error) {
    const detail = formatSupabaseError(error);
    console.error('Clerk webhook: user.deleted failed', { ...logContext, clerkId, supabaseError: detail });
    return errResponse(detail.message ?? 'Database delete failed', 500, { code: detail.code });
  }

  return okResponse();
}

/** Sync user to MailerLite (best-effort; never fails the webhook). Uses MAILERLITE_API_KEY. */
async function syncMailerLite(
  email: string,
  firstName: string | null,
  lastName: string | null,
  eventType: string,
  logContext: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  if (!apiKey || !groupId) return;

  const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email: email.toLowerCase(),
      fields: { name: firstName ?? '', last_name: lastName ?? '' },
      groups: [groupId],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn('Clerk webhook: MailerLite sync skipped (non-fatal)', {
      ...logContext,
      eventType,
      status: res.status,
      mailerliteResponse: body,
    });
  }
}

/**
 * Link leads by email to clerk_id when not already linked.
 * Tries column email_address first (CRM schema), then email (repo migration schema).
 * Ensure leads has: ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS clerk_id TEXT;
 */
async function bridgeLeads(
  admin: SupabaseClient,
  clerkId: string,
  email: string,
  logContext: Record<string, unknown>
): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  for (const column of ['email_address', 'email'] as const) {
    try {
      const { error } = await admin
        .from('leads')
        .update({ clerk_id: clerkId })
        .eq(column, normalizedEmail)
        .is('clerk_id', null);

      if (error) {
        if (column === 'email_address') continue; // try email next
        console.warn('Clerk webhook: lead bridge skipped', {
          ...logContext,
          clerkId,
          supabaseError: formatSupabaseError(error),
        });
        return;
      }

      console.log('Clerk webhook: lead bridged', { ...logContext, clerkId, column });
      return;
    } catch (err) {
      if (column === 'email_address') continue;
      console.warn('Clerk webhook: lead bridge threw', { ...logContext, clerkId, err });
    }
  }
}

/** Handle user.created / user.updated: upsert users, optional MailerLite, optional lead bridge */
async function handleUserUpsert(
  admin: SupabaseClient,
  data: WebhookEvent['data'],
  eventType: SupportedEventType,
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  if (!data || typeof data !== 'object' || !('id' in data)) return okResponse();
  const clerkId = typeof (data as { id?: unknown }).id === 'string' ? (data as { id: string }).id.trim() : null;
  if (!clerkId) return okResponse();

  const row = buildUsersRow(clerkId, data);

  const apiKey = process.env.MAILERLITE_API_KEY?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  // Only sync to MailerLite on user.created to avoid duplicate API calls and "already subscribed" noise
  const mailerlitePromise =
    eventType === 'user.created' && row.email && apiKey && groupId
      ? syncMailerLite(row.email, row.first_name, row.last_name, eventType, logContext)
      : Promise.resolve();

  const supabasePromise = admin.from('users').upsert(
    {
      clerk_id: row.clerk_id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
    },
    { onConflict: 'clerk_id' }
  );

  const [supabaseResult] = await Promise.all([supabasePromise, mailerlitePromise]);
  const { error } = supabaseResult;

  if (error) {
    const detail = formatSupabaseError(error);
    console.error('Clerk webhook: Supabase upsert failed', {
      ...logContext,
      eventType,
      clerkId,
      supabaseError: detail,
    });
    return errResponse(detail.message ?? 'Database sync failed', 500, {
      code: detail.code,
      details: detail.details,
    });
  }

  if (row.email) {
    await bridgeLeads(admin, clerkId, row.email, logContext);
  }

  return okResponse();
}

/**
 * Clerk webhook: full and robust handler for user lifecycle.
 *
 * Supported events: user.created, user.updated, user.deleted.
 * - user.deleted: delete row in public.users by clerk_id.
 * - user.created / user.updated: upsert into public.users (role: agent | broker | user); optional MailerLite sync on user.created only; optional lead bridge (leads.clerk_id by email).
 *
 * Env: CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Optional: MAILERLITE_API_KEY, MAILERLITE_GROUP_ID.
 *
 * Returns 200 for success or for unsupported event types. Returns 4xx/5xx with JSON { error, code?, details? } on failure.
 */

/** GET /api/webhooks/clerk — health check for monitoring (env configured, route live). Does not reveal secrets. */
export async function GET() {
  const envError = getEnvError();
  const body = envError
    ? { status: 'error', message: envError }
    : { status: 'ok', webhook: 'clerk', env: 'configured' };
  return NextResponse.json(body, { status: envError ? 503 : 200 });
}
export async function POST(request: NextRequest) {
  const envError = getEnvError();
  if (envError) {
    console.error('Clerk webhook: env check failed', { error: envError });
    return errResponse(envError, 500);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('Clerk webhook: failed to read body', { err });
    return errResponse('Failed to read request body', 400);
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return errResponse('Missing Svix headers (svix-id, svix-timestamp, svix-signature)', 400);
  }

  let evt: WebhookEvent;
  try {
    evt = new Webhook(process.env.CLERK_WEBHOOK_SECRET!).verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Clerk webhook: signature verification failed', { err });
    return errResponse('Invalid signature', 400);
  }

  const eventType = evt.type;
  const data = evt.data;
  const logContext = { eventType, svixId };

  if (!SUPPORTED_EVENTS.includes(eventType as SupportedEventType)) {
    return okResponse();
  }

  const admin = createSupabaseAdmin();
  const start = Date.now();

  if (eventType === 'user.deleted') {
    const res = await handleUserDeleted(admin, data, logContext);
    if (res.status === 200) logSuccess(logContext, Date.now() - start);
    return res;
  }

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const res = await handleUserUpsert(admin, data, eventType, logContext);
    if (res.status === 200) logSuccess(logContext, Date.now() - start);
    return res;
  }

  return okResponse();
}
