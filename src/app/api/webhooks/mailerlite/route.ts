import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, formatSupabaseError } from '@/lib/supabase';

/**
 * MailerLite webhook: when subscribers unsubscribe, bounce, report spam, or are deleted,
 * updates Supabase users.marketing_opt_in to false so the app doesn’t email them.
 * Requires MAILERLITE_WEBHOOK_SECRET. Requires users.marketing_opt_in column (see migration).
 */
const MAILERLITE_WEBHOOK_SECRET = process.env.MAILERLITE_WEBHOOK_SECRET;

/** Events that mean "do not send marketing" – we set users.marketing_opt_in = false in Supabase. */
const OPT_OUT_EVENTS = new Set([
  'subscriber.unsubscribed',
  'subscriber.bounced',
  'subscriber.spam_reported',
  'subscriber.deleted',
]);

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  if (signature.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

type MailerLiteEvent = {
  type?: string;
  data?: { subscriber?: { email?: string } };
};

export async function POST(request: NextRequest) {
  if (!MAILERLITE_WEBHOOK_SECRET) {
    console.error('Missing MAILERLITE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('signature');
  if (!signature || !signature.trim()) {
    return NextResponse.json({ error: 'Missing Signature header' }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!verifySignature(rawBody, signature.trim(), MAILERLITE_WEBHOOK_SECRET)) {
    console.error('MailerLite webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: { events?: MailerLiteEvent[] };
  try {
    payload = JSON.parse(rawBody) as { events?: MailerLiteEvent[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  const admin = supabaseAdmin();

  for (const event of events) {
    const type = typeof event?.type === 'string' ? event.type : '';
    if (!OPT_OUT_EVENTS.has(type)) {
      continue;
    }

    const email =
      typeof event?.data?.subscriber?.email === 'string'
        ? event.data.subscriber.email.trim()
        : '';
    if (!email) {
      continue;
    }

    const { error } = await admin
      .from('users')
      .update({ marketing_opt_in: false })
      .eq('email', email);

    if (error) {
      console.error('MailerLite webhook: failed to update user', {
        email,
        supabaseError: formatSupabaseError(error),
      });
      // Continue processing other events; return 200 so MailerLite doesn’t retry
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
