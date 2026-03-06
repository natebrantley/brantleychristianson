import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, formatSupabaseError } from '@/lib/supabase';
import { isBodySizeAllowed, MAX_WEBHOOK_BODY_BYTES } from '@/lib/webhook-utils';

/**
 * MailerLite webhook: keeps Supabase aligned with MailerLite subscriber state.
 * - Opt-out events (unsubscribe, bounce, spam, deleted) → users.marketing_opt_in = false, leads.opted_in_email = 'false'
 * - Opt-in events (created, updated/confirmed, added_to_group, active) → users.marketing_opt_in = true, leads.opted_in_email = 'true'
 * Handles both single-event payloads (root event/type + email or subscriber) and batched payloads (events[]).
 * Requires MAILERLITE_WEBHOOK_SECRET. Signature: HMAC-SHA256 of raw body (Signature header).
 */
const MAILERLITE_WEBHOOK_SECRET = process.env.MAILERLITE_WEBHOOK_SECRET;

const OPT_OUT_EVENTS = new Set([
  'subscriber.unsubscribed',
  'subscriber.bounced',
  'subscriber.spam_reported',
  'subscriber.deleted',
]);

const OPT_IN_EVENTS = new Set([
  'subscriber.created',
  'subscriber.updated',
  'subscriber.added_to_group',
  'subscriber.active',
  'subscriber.form_submitted',
]);

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  if (signature.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/** Normalized event for processing: event type + lowercase email */
type NormalizedEvent = { type: string; email: string };

/**
 * MailerLite sends either:
 * - Single: { event: "subscriber.created", email: "..." } or { type: "...", subscriber: { email: "..." } }
 * - Batched: { events: [ { type: "...", subscriber: { email: "..." } }, ... ], total?: N }
 */
function normalizePayload(payload: unknown): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  if (!payload || typeof payload !== 'object') return out;

  const obj = payload as Record<string, unknown>;

  // Batched format
  if (Array.isArray(obj.events)) {
    for (const item of obj.events) {
      if (!item || typeof item !== 'object') continue;
      const t = (item as Record<string, unknown>).type;
      const type = typeof t === 'string' ? t : '';
      const sub = (item as Record<string, unknown>).subscriber;
      const email =
        typeof (item as Record<string, unknown>).email === 'string'
          ? (item as Record<string, unknown>).email
          : sub && typeof sub === 'object' && typeof (sub as Record<string, unknown>).email === 'string'
            ? (sub as Record<string, unknown>).email
            : '';
      if (type && email) out.push({ type, email: String(email).trim().toLowerCase() });
    }
    return out;
  }

  // Single-event: root has "event" or "type", and "email" or "subscriber.email"
  const type =
    typeof obj.event === 'string' ? obj.event : typeof obj.type === 'string' ? obj.type : '';
  const emailFromRoot = typeof obj.email === 'string' ? obj.email : '';
  const sub = obj.subscriber;
  const emailFromSub =
    sub && typeof sub === 'object' && typeof (sub as Record<string, unknown>).email === 'string'
      ? (sub as Record<string, unknown>).email as string
      : '';
  const email = (emailFromRoot || emailFromSub || '').trim().toLowerCase();
  if (type && email) out.push({ type, email });
  return out;
}

async function applyMarketingOpt(
  admin: ReturnType<typeof supabaseAdmin>,
  email: string,
  optIn: boolean,
  logContext: { type: string }
): Promise<void> {
  const value = optIn;
  const { error: userError } = await admin
    .from('users')
    .update({ marketing_opt_in: value })
    .eq('email', email);

  if (userError) {
    console.warn('MailerLite webhook: users update', {
      ...logContext,
      email,
      supabaseError: formatSupabaseError(userError),
    });
  }

  // Align leads.opted_in_email by email (best-effort; column must exist on leads)
  try {
    const val = value ? 'true' : 'false';
    await admin.from('leads').update({ opted_in_email: val }).eq('email', email);
    await admin.from('leads').update({ opted_in_email: val }).eq('email_address', email);
  } catch {
    // Ignore (e.g. column missing or RLS); users table is source of truth
  }
}

/** GET /api/webhooks/mailerlite — health check. Does not reveal secret. */
export async function GET() {
  const body = MAILERLITE_WEBHOOK_SECRET
    ? { status: 'ok', webhook: 'mailerlite', env: 'configured' }
    : { status: 'error', message: 'Missing MAILERLITE_WEBHOOK_SECRET' };
  return NextResponse.json(body, { status: MAILERLITE_WEBHOOK_SECRET ? 200 : 503 });
}

export async function POST(request: NextRequest) {
  if (!MAILERLITE_WEBHOOK_SECRET) {
    console.error('MailerLite webhook: missing MAILERLITE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('signature');
  if (!signature?.trim()) {
    return NextResponse.json({ error: 'Missing Signature header' }, { status: 400 });
  }

  if (!isBodySizeAllowed(request)) {
    return NextResponse.json(
      { error: `Request body exceeds ${MAX_WEBHOOK_BODY_BYTES} bytes` },
      { status: 413 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!verifySignature(rawBody, signature.trim(), MAILERLITE_WEBHOOK_SECRET)) {
    console.error('MailerLite webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const events = normalizePayload(payload);
  if (events.length === 0) {
    return NextResponse.json({ success: true, processed: 0 }, { status: 200 });
  }

  const admin = supabaseAdmin();
  for (const { type, email } of events) {
    const logContext = { type, email };
    if (OPT_OUT_EVENTS.has(type)) {
      await applyMarketingOpt(admin, email, false, logContext);
    } else if (OPT_IN_EVENTS.has(type)) {
      await applyMarketingOpt(admin, email, true, logContext);
    }
    // campaign.*, subscriber.removed_from_group, subscriber.automation_*: no Supabase change
  }

  return NextResponse.json({ success: true, processed: events.length }, { status: 200 });
}
