import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

const SUPPORTED_EVENTS = ['user.created', 'user.updated', 'user.deleted'] as const;
type SupportedEventType = (typeof SUPPORTED_EVENTS)[number];

/** Clerk user payload (user.created / user.updated). See https://clerk.com/docs/integration/webhooks */
interface ClerkUserPayload {
  id?: string;
  email_addresses?: Array<{ email_address?: string; id?: string }>;
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

/** Row we write to public.users */
interface UsersRow {
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role?: 'agent' | 'broker' | null;
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
function getPrimaryEmail(data: ClerkUserPayload): string | null {
  const list = Array.isArray(data.email_addresses) ? data.email_addresses : [];
  const first = list[0];
  if (!first || typeof first !== 'object' || first === null) return null;
  const email = first.email_address;
  return typeof email === 'string' && email.trim().length > 0 ? email.trim() : null;
}

/** Extract dashboard role from public_metadata (agent | broker only) */
function getRole(data: ClerkUserPayload): 'agent' | 'broker' | null | undefined {
  const meta = data.public_metadata;
  if (meta == null || typeof meta !== 'object' || !('role' in meta)) return undefined;
  const r = (meta as { role?: unknown }).role;
  if (typeof r !== 'string') return undefined;
  const lower = r.trim().toLowerCase();
  if (lower === 'agent' || lower === 'broker') return lower;
  return null; // explicit but invalid role
}

/** Build users row from Clerk user payload; clerkId required */
function buildUsersRow(clerkId: string, data: ClerkUserPayload): UsersRow {
  const firstName =
    typeof data.first_name === 'string' && data.first_name.trim().length > 0
      ? data.first_name.trim()
      : null;
  const lastName =
    typeof data.last_name === 'string' && data.last_name.trim().length > 0
      ? data.last_name.trim()
      : null;
  const role = getRole(data);
  const row: UsersRow = {
    clerk_id: clerkId,
    email: getPrimaryEmail(data),
    first_name: firstName,
    last_name: lastName,
  };
  if (role !== undefined) row.role = role;
  return row;
}

/** Handle user.deleted: remove from Supabase by clerk_id */
async function handleUserDeleted(
  admin: SupabaseClient,
  data: Record<string, unknown>,
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  const clerkId = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : null;
  if (!clerkId) {
    return okResponse();
  }

  const { error } = await admin.from('users').delete().eq('clerk_id', clerkId);

  if (error) {
    const detail = formatSupabaseError(error);
    console.error('Clerk webhook: user.deleted failed', { ...logContext, clerkId, supabaseError: detail });
    return errResponse(detail.message ?? 'Database delete failed', 500, { code: detail.code });
  }

  return okResponse();
}

/** Sync user to MailerLite (best-effort; never fails the webhook) */
async function syncMailerLite(
  email: string,
  firstName: string | null,
  lastName: string | null,
  eventType: string,
  logContext: Record<string, unknown>
): Promise<void> {
  const apiToken = process.env.MAILERLITE_API_TOKEN?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  if (!apiToken || !groupId) return;

  const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiToken}`,
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

/** Link leads by email to clerk_id when not already linked */
async function bridgeLeads(
  admin: SupabaseClient,
  clerkId: string,
  email: string,
  logContext: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await admin
      .from('leads')
      .update({ clerk_id: clerkId })
      .eq('email', email.toLowerCase())
      .is('clerk_id', null);

    if (error) {
      console.warn('Clerk webhook: lead bridge skipped', {
        ...logContext,
        clerkId,
        supabaseError: formatSupabaseError(error),
      });
    }
  } catch (err) {
    console.warn('Clerk webhook: lead bridge threw', { ...logContext, clerkId, err });
  }
}

/** Handle user.created / user.updated: upsert users, optional MailerLite, optional lead bridge */
async function handleUserUpsert(
  admin: SupabaseClient,
  data: ClerkUserPayload,
  eventType: SupportedEventType,
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  const clerkId = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : null;
  if (!clerkId) {
    return okResponse();
  }

  const row = buildUsersRow(clerkId, data);

  const apiToken = process.env.MAILERLITE_API_TOKEN?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  const mailerlitePromise =
    row.email && apiToken && groupId
      ? syncMailerLite(row.email, row.first_name, row.last_name, eventType, logContext)
      : Promise.resolve();

  const supabasePromise = admin
    .from('users')
    .upsert(
      {
        clerk_id: row.clerk_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        ...(row.role !== undefined && { role: row.role }),
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
 * - user.created / user.updated: upsert into public.users; optional MailerLite sync; optional lead bridge (leads.clerk_id by email).
 *
 * Env: CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Optional: MAILERLITE_API_TOKEN, MAILERLITE_GROUP_ID.
 *
 * Returns 200 for success or for unsupported event types (e.g. role.*). Returns 4xx/5xx with JSON { error, code?, details? } on failure.
 */
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

  let payload: { type: string; data?: Record<string, unknown> };
  try {
    payload = new Webhook(process.env.CLERK_WEBHOOK_SECRET!).verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data?: Record<string, unknown> };
  } catch (err) {
    console.error('Clerk webhook: signature verification failed', { err });
    return errResponse('Invalid signature', 400);
  }

  const eventType = payload.type;
  const data = payload.data ?? {};
  const logContext = { eventType, svixId };

  if (!SUPPORTED_EVENTS.includes(eventType as SupportedEventType)) {
    return okResponse();
  }

  const admin = createSupabaseAdmin();

  if (eventType === 'user.deleted') {
    return handleUserDeleted(admin, data, logContext);
  }

  if (eventType === 'user.created' || eventType === 'user.updated') {
    if (!data || typeof data !== 'object') {
      return okResponse();
    }
    return handleUserUpsert(admin, data as ClerkUserPayload, eventType, logContext);
  }

  return okResponse();
}
