import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  repliersClient,
  findClientByEmail,
  createClient,
  updateClient,
  normalizePhoneForRepliers,
  parseNameToFnameLname,
} from '@/lib/repliers';

interface ConsultationRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  market?: string;
  buildingName?: string;
  buildingSlug?: string;
}

/**
 * POST /api/consultation
 * Adds/updates the contact in the Mailchimp audience with merge fields and tags.
 * If Repliers is configured, also creates or updates the Repliers client (best-effort).
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

  let body: ConsultationRequestBody;
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

  const mergeFields: Record<string, string> = {
    FNAME: name || '',
    PHONE: phone || '',
  };
  if (messageMergeTag && message) {
    mergeFields[messageMergeTag] = message;
  }

  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  const memberRes = await fetch(memberUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: mergeFields,
    }),
  });

  const memberData = await memberRes.json().catch(() => ({}));

  if (!memberRes.ok) {
    console.error('Mailchimp member error:', memberRes.status, memberData);
    const detail =
      (memberData && (memberData.detail as string)) ||
      'Failed to add or update contact';
    return NextResponse.json({ error: detail }, { status: memberRes.status });
  }

  const tags: string[] = ['Consultation'];

  if (body.source) {
    tags.push(`Source: ${body.source}`);
  }
  if (body.market) {
    tags.push(`Market: ${body.market}`);
  }
  if (body.buildingName) {
    tags.push(`Building: ${body.buildingName}`);
  }

  if (tags.length > 0) {
    const tagsUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}/tags`;
    const tagsRes = await fetch(tagsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        tags: tags.map((name) => ({ name, status: 'active' as const })),
      }),
    });

    if (!tagsRes.ok) {
      const tagsData = await tagsRes.json().catch(() => ({}));
      console.error('Mailchimp tags error:', tagsRes.status, tagsData);
      // Do not surface tag errors to the user; contact was still captured.
    }
  }

  // Repliers lead sync (best-effort; do not fail the request)
  const repliers = repliersClient();
  if (repliers) {
    try {
      const { fname, lname } = parseNameToFnameLname(name);
      const phoneNormalized = phone ? normalizePhoneForRepliers(phone) : null;
      const tags: string[] = ['Consultation'];
      if (body.source) tags.push(`Source: ${body.source}`);
      if (body.market) tags.push(`Market: ${body.market}`);
      if (body.buildingName) tags.push(`Building: ${body.buildingName}`);

      const existing = await findClientByEmail(repliers, email);
      if (existing) {
        await updateClient(repliers, existing.clientId, {
          fname,
          lname,
          phone: phoneNormalized,
          tags,
        });
      } else {
        await createClient(repliers, {
          agentId: repliers.agentId,
          fname,
          lname,
          email,
          phone: phoneNormalized,
          tags,
          externalId: subscriberHash,
        });
      }
    } catch (err) {
      console.error('Repliers lead sync error:', err);
      // Do not return error to user; Mailchimp capture succeeded.
    }
  }

  return NextResponse.json({ ok: true });
}
