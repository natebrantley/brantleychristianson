import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { bridgeLeadsByEmail } from '@/lib/bridge-leads';
import { deriveUserSlug } from '@/lib/user-slug';
import { repliersClient, createClient as createRepliersClient, parseNameToFnameLname } from '@/lib/repliers';
import { isBodySizeAllowed, MAX_WEBHOOK_BODY_BYTES } from '@/lib/webhook-utils';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

/** Email domain treated as agent when public_metadata.role is missing (e.g. webhook ran before metadata was set). */
const AGENT_EMAIL_DOMAIN = 'brantleychristianson.com';

const SUPPORTED_EVENTS = ['user.created', 'user.updated', 'user.deleted'] as const;
type SupportedEventType = (typeof SUPPORTED_EVENTS)[number];

/** Row we write to public.users. Role is always set (agent | broker | lender | user). */
interface UsersRow {
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'agent' | 'broker' | 'lender' | 'user';
}

/** App-managed columns we must preserve on webhook upsert (set by client or other flows). */
const USERS_PRESERVE_COLUMNS = ['assigned_broker_id', 'assigned_lender_id', 'repliers_client_id', 'marketing_opt_in'] as const;

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
  return typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;
}

/** Extract dashboard role from public_metadata (agent | broker | lender); undefined = not set */
function getRoleFromMetadata(data: WebhookEvent['data']): 'agent' | 'broker' | 'lender' | null | undefined {
  if (!data || typeof data !== 'object' || !('public_metadata' in data)) return undefined;
  const meta = (data as { public_metadata?: unknown }).public_metadata;
  if (meta == null || typeof meta !== 'object' || !('role' in meta)) return undefined;
  const r = (meta as { role?: unknown }).role;
  if (typeof r !== 'string') return undefined;
  const lower = r.trim().toLowerCase();
  if (lower === 'agent' || lower === 'broker' || lower === 'lender') return lower;
  return null;
}

/** Log role resolution for debugging (no PII). Call when processing user.created / user.updated. */
function logRoleResolution(
  logContext: Record<string, unknown>,
  resolvedRole: 'agent' | 'broker' | 'lender' | 'user',
  fromMetadata: 'agent' | 'broker' | 'lender' | null | undefined
): void {
  console.log('Clerk webhook: role resolved', {
    ...logContext,
    resolvedRole,
    fromMetadata: fromMetadata ?? 'none',
  });
}

/** Build users row from Clerk user payload; clerkId required. Role falls back to 'user'. */
function buildUsersRow(
  clerkId: string,
  data: WebhookEvent['data'],
  logContext?: Record<string, unknown>
): UsersRow {
  if (!data || typeof data !== 'object') {
    return { clerk_id: clerkId, email: null, first_name: null, last_name: null, role: 'user' };
  }
  const d = data as unknown as Record<string, unknown>;
  const firstName =
    typeof d.first_name === 'string' && d.first_name.trim().length > 0 ? d.first_name.trim() : null;
  const lastName =
    typeof d.last_name === 'string' && d.last_name.trim().length > 0 ? d.last_name.trim() : null;
  const roleFromMeta = getRoleFromMetadata(data);
  const email = getPrimaryEmail(data);
  const isAgentDomain =
    typeof email === 'string' &&
    email.trim().toLowerCase().endsWith('@' + AGENT_EMAIL_DOMAIN);
  const role: 'agent' | 'broker' | 'lender' | 'user' =
    roleFromMeta === 'agent' || roleFromMeta === 'broker' || roleFromMeta === 'lender'
      ? roleFromMeta
      : isAgentDomain
        ? 'agent'
        : 'user';
  if (logContext) logRoleResolution(logContext, role, roleFromMeta);
  return {
    clerk_id: clerkId,
    email,
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

/** Sync user to MailerLite (best-effort; never fails the webhook). Uses MAILERLITE_API_TOKEN (or MAILERLITE_API_KEY for backward compatibility). */
async function syncMailerLite(
  email: string,
  firstName: string | null,
  lastName: string | null,
  eventType: string,
  logContext: Record<string, unknown>
): Promise<void> {
  const apiToken =
    process.env.MAILERLITE_API_TOKEN?.trim() || process.env.MAILERLITE_API_KEY?.trim();
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

/** Uses shared bridge so leads are claimed by email when user is created/updated. */
async function bridgeLeads(
  admin: SupabaseClient,
  clerkId: string,
  email: string,
  logContext: Record<string, unknown>
): Promise<void> {
  await bridgeLeadsByEmail(admin, clerkId, email);
}

/** Handle user.created / user.updated: upsert users, optional MailerLite, optional lead bridge.
 * Preserves app-managed columns (assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in) so
 * client agent/lender selection and other app flows are never overwritten by Clerk sync. */
async function handleUserUpsert(
  admin: SupabaseClient,
  data: WebhookEvent['data'],
  eventType: SupportedEventType,
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  if (!data || typeof data !== 'object' || !('id' in data)) return okResponse();
  const clerkId = typeof (data as { id?: unknown }).id === 'string' ? (data as { id: string }).id.trim() : null;
  if (!clerkId) return okResponse();

  const row = buildUsersRow(clerkId, data, logContext);

  const mailerliteToken =
    process.env.MAILERLITE_API_TOKEN?.trim() || process.env.MAILERLITE_API_KEY?.trim();
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim();
  // Only sync to MailerLite on user.created to avoid duplicate API calls and "already subscribed" noise
  const mailerlitePromise =
    eventType === 'user.created' && row.email && mailerliteToken && groupId
      ? syncMailerLite(row.email, row.first_name, row.last_name, eventType, logContext)
      : Promise.resolve();

  // Preserve app-managed columns: assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in.
  // Do not overwrite when Clerk sends user.updated.
  const isAgentOrLender = row.role === 'agent' || row.role === 'broker' || row.role === 'lender';
  let upsertPayload: Record<string, unknown> = {
    clerk_id: row.clerk_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    slug: isAgentOrLender ? deriveUserSlug(row.first_name, row.last_name) : null,
    assigned_broker_id: null,
    assigned_lender_id: null,
    marketing_opt_in: null,
    repliers_client_id: null,
    updated_at: null,
  };
  const { data: existing } = await admin
    .from('users')
    .select(USERS_PRESERVE_COLUMNS.join(','))
    .eq('clerk_id', clerkId)
    .maybeSingle();
  if (existing && typeof existing === 'object') {
    for (const key of USERS_PRESERVE_COLUMNS) {
      if (key in existing && (existing as Record<string, unknown>)[key] !== undefined) {
        upsertPayload[key] = (existing as Record<string, unknown>)[key];
      }
    }
  }

  const supabasePromise = admin.from('users').upsert(upsertPayload, { onConflict: 'clerk_id' });

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
      code: detail.code ?? 'SUPABASE_ERROR',
      details: detail.details,
    });
  }

  if (row.email) {
    await bridgeLeads(admin, clerkId, row.email, logContext);
  }

  if (eventType === 'user.created') {
    syncRepliersClientIfNeeded(admin, clerkId, row, logContext).catch((err) => {
      console.warn('Clerk webhook: Repliers client sync failed (non-fatal)', { ...logContext, clerkId, err });
    });
  }

  return okResponse();
}

/** On user.created: create Repliers client and set users.repliers_client_id. Do not block webhook 200. */
async function syncRepliersClientIfNeeded(
  admin: SupabaseClient,
  clerkId: string,
  row: UsersRow,
  logContext: Record<string, unknown>
): Promise<void> {
  const { data: existing } = await admin
    .from('users')
    .select('repliers_client_id')
    .eq('clerk_id', clerkId)
    .maybeSingle();
  if (existing && (existing as { repliers_client_id?: number }).repliers_client_id != null) {
    return;
  }
  if (!row.email?.trim()) return;

  const repliers = repliersClient();
  if (!repliers) return;

  const { fname, lname } = parseNameToFnameLname([row.first_name, row.last_name].filter(Boolean).join(' '));
  const { clientId } = await createRepliersClient(repliers, {
    agentId: repliers.agentId,
    fname: fname || row.first_name || 'User',
    lname: lname || row.last_name || '',
    email: row.email,
  });

  if (clientId != null) {
    const { error } = await admin
      .from('users')
      .update({ repliers_client_id: clientId })
      .eq('clerk_id', clerkId);
    if (!error) {
      console.log('Clerk webhook: Repliers client created and linked', { ...logContext, clerkId });
    }
  }
}

/**
 * Clerk webhook: full and robust handler for user lifecycle.
 *
 * Supported events: user.created, user.updated, user.deleted.
 * - user.deleted: delete row in public.users by clerk_id.
 * - user.created / user.updated: upsert into public.users (role: agent | broker | lender | user); optional MailerLite sync on user.created only; optional lead bridge (no-op: leads table has no clerk_id).
 *
 * Env: CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Optional: MAILERLITE_API_TOKEN (or MAILERLITE_API_KEY), MAILERLITE_GROUP_ID.
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
    return errResponse(envError, 500, { code: 'ENV_MISSING' });
  }

  if (!isBodySizeAllowed(request)) {
    return errResponse(`Request body exceeds ${MAX_WEBHOOK_BODY_BYTES} bytes`, 413, { code: 'PAYLOAD_TOO_LARGE' });
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
    return errResponse('Invalid signature — check CLERK_WEBHOOK_SECRET matches Clerk dashboard', 400, {
      code: 'INVALID_SIGNATURE',
    });
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
