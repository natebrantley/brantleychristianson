import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';

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
 * Requires MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID in env.
 * Rate limiting: best-effort in-memory limiter allowing up to 5 requests
 * per 15 minutes per client IP (see src/lib/rateLimit.ts).
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const messageMergeTag = process.env.MAILCHIMP_MERGE_TAG_MESSAGE ?? 'MMERGE3';

  if (!apiKey || !audienceId) {
    console.error('Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID');
    return NextResponse.json(
      {
        error:
          "We're unable to process your request right now. Please try again later or email us directly at info@brantleychristianson.com.",
      },
      { status: 500 }
    );
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(`consultation:${clientIp}`)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 100_000) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body: ConsultationRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 50) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
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

  try {
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

    const memberData = (await memberRes.json().catch(() => ({}))) as {
      detail?: string;
      title?: string;
      [key: string]: unknown;
    };

    if (!memberRes.ok) {
      console.error('Mailchimp member error:', {
        status: memberRes.status,
        data: memberData,
        subscriberHash,
        source: body.source,
        market: body.market,
        buildingSlug: body.buildingSlug,
      });

      return NextResponse.json(
        {
          error:
            "We're unable to process your request right now. Please try again later or email us directly at info@brantleychristianson.com.",
        },
        { status: 502 }
      );
    }

    const tags: string[] = ['Consultation'];
    const tagVal = (s: unknown, max = 100) =>
      typeof s === 'string' ? s.trim().slice(0, max) : '';
    if (tagVal(body.source)) tags.push(`Source: ${tagVal(body.source)}`);
    if (tagVal(body.market)) tags.push(`Market: ${tagVal(body.market)}`);
    if (tagVal(body.buildingName)) tags.push(`Building: ${tagVal(body.buildingName)}`);

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
        console.error('Mailchimp tags error:', {
          status: tagsRes.status,
          data: tagsData,
          subscriberHash,
          source: body.source,
          market: body.market,
          buildingSlug: body.buildingSlug,
        });
        // Do not surface tag errors to the user; contact was still captured.
      }
    }
  } catch (error) {
    console.error('Mailchimp request failed:', {
      error,
      subscriberHash,
      source: body.source,
      market: body.market,
      buildingSlug: body.buildingSlug,
    });

    return NextResponse.json(
      {
        error:
          "We're unable to process your request right now. Please try again later or email us directly at info@brantleychristianson.com.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
