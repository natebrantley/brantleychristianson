import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseAdmin, formatSupabaseError } from '@/lib/supabase';

/**
 * Clerk webhook: syncs user.created / user.updated to Supabase (users) and MailerLite (Master Audience).
 * On user.deleted, removes the user from Supabase by clerk_id.
 * Requires CLERK_WEBHOOK_SECRET. Optional: MAILERLITE_API_TOKEN + MAILERLITE_GROUP_ID for list sync.
 */
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

export async function POST(request: NextRequest) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing Svix headers' },
      { status: 400 }
    );
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let payload: { type: string; data?: Record<string, unknown> };

  try {
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data?: Record<string, unknown> };
  } catch (err) {
    console.error('Clerk webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = payload.type;
  const data = payload.data;

  // user.deleted: remove from Supabase by clerk_id
  if (eventType === 'user.deleted') {
    const clerkId =
      data && typeof data === 'object' && typeof data.id === 'string'
        ? data.id
        : null;
    if (!clerkId) {
      return new NextResponse(null, { status: 200 });
    }
    const admin = supabaseAdmin();
    const { error } = await admin
      .from('users')
      .delete()
      .eq('clerk_id', clerkId);
    if (error) {
      const errDetail = formatSupabaseError(error);
      console.error('Clerk webhook: Supabase delete failed', {
        event: eventType,
        clerkId,
        supabaseError: errDetail,
      });
      return NextResponse.json(
        { error: 'Database delete failed', code: errDetail?.code ?? undefined },
        { status: 500 }
      );
    }
    return new NextResponse(null, { status: 200 });
  }

  if (eventType !== 'user.created' && eventType !== 'user.updated') {
    return new NextResponse(null, { status: 200 });
  }

  if (!data || typeof data !== 'object') {
    return new NextResponse(null, { status: 200 });
  }

  const clerkId = typeof data.id === 'string' ? data.id : null;
  const emailAddresses = Array.isArray(data.email_addresses)
    ? data.email_addresses
    : [];
  const primaryEmail =
    emailAddresses[0] &&
    typeof emailAddresses[0] === 'object' &&
    emailAddresses[0] !== null &&
    'email_address' in emailAddresses[0]
      ? String((emailAddresses[0] as { email_address: unknown }).email_address)
      : null;
  const firstName =
    typeof data.first_name === 'string' ? data.first_name : null;
  const lastName =
    typeof data.last_name === 'string' ? data.last_name : null;

  const publicMetadata = data.public_metadata;
  const hasRoleKey =
    typeof publicMetadata === 'object' &&
    publicMetadata !== null &&
    'role' in publicMetadata &&
    typeof (publicMetadata as { role: unknown }).role === 'string';
  const metadataRole = hasRoleKey
    ? ((publicMetadata as { role: string }).role as string).toLowerCase()
    : null;
  const role =
    metadataRole === 'agent' || metadataRole === 'broker'
      ? metadataRole
      : hasRoleKey
        ? null
        : undefined;

  if (!clerkId) {
    return new NextResponse(null, { status: 200 });
  }

  const admin = supabaseAdmin();
  // Omit id so Supabase auto-generates UUID; use clerk_id for upsert conflict.
  const row: Record<string, unknown> = {
    clerk_id: clerkId,
    email: primaryEmail,
    first_name: firstName,
    last_name: lastName,
  };
  if (role !== undefined) row.role = role;

  const apiToken = process.env.MAILERLITE_API_TOKEN;
  const masterGroupId = process.env.MAILERLITE_GROUP_ID?.trim();

  const supabasePromise = admin.from('users').upsert(row, {
    onConflict: 'clerk_id',
  });

  const mailerlitePromise =
    primaryEmail && apiToken && masterGroupId
      ? fetch(`${MAILERLITE_API_BASE}/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            email: primaryEmail,
            fields: {
              name: firstName ?? '',
              last_name: lastName ?? '',
            },
            groups: [masterGroupId],
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(`MailerLite: ${JSON.stringify(data)}`);
          }
        })
      : Promise.resolve();

  try {
    const [supabaseResult] = await Promise.all([
      supabasePromise,
      mailerlitePromise,
    ]);

    const { error } = supabaseResult;
    if (error) {
      const errDetail = formatSupabaseError(error);
      console.error('Clerk webhook: Supabase upsert failed', {
        event: eventType,
        clerkId,
        supabaseError: errDetail,
      });
      return NextResponse.json(
        { error: 'Database sync failed', code: errDetail?.code ?? undefined },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('Clerk webhook: MailerLite add failed', {
      event: eventType,
      clerkId,
      primaryEmail,
      err,
    });
    return NextResponse.json(
      { error: 'Marketing list sync failed' },
      { status: 500 }
    );
  }
}
