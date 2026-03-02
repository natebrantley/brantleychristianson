import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/consultation
 * Adds the contact to Mailchimp audience (list) with merge fields.
 * Requires MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID in env.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const messageMergeTag = process.env.MAILCHIMP_MERGE_TAG_MESSAGE ?? 'MMERGE3';

  if (!apiKey || !audienceId) {
    console.error('Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const dc = apiKey.includes('-') ? apiKey.split('-').pop() : 'us2';
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  const mergeFields: Record<string, string> = {
    FNAME: name || '',
    PHONE: phone || '',
  };
  if (messageMergeTag && message) {
    mergeFields[messageMergeTag] = message;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      merge_fields: mergeFields,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (data.title === 'Member Exists') {
      return NextResponse.json(
        { error: 'This email is already on our list.' },
        { status: 409 }
      );
    }
    console.error('Mailchimp error:', res.status, data);
    return NextResponse.json(
      { error: data.detail || 'Failed to add contact' },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
