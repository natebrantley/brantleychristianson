import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

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
 * Adds/updates the contact in MailerLite with fields and optional group.
 * Requires MAILERLITE_API_TOKEN in env. Optional: MAILERLITE_GROUP_ID.
 * Rate limiting: best-effort in-memory limiter allowing up to 5 requests
 * per 15 minutes per client IP (see src/lib/rateLimit.ts).
 */
export async function POST(request: NextRequest) {
  const apiToken = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim() || undefined;

  if (!apiToken) {
    console.error('Missing MAILERLITE_API_TOKEN');
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

  const tagVal = (s: unknown, max = 100) =>
    typeof s === 'string' ? s.trim().slice(0, max) : '';

  const fields: Record<string, string> = {};
  if (name) fields.name = name;
  if (phone) fields.phone = phone;
  if (message) fields.message = message;
  if (tagVal(body.source)) fields.source = tagVal(body.source);
  if (tagVal(body.market)) fields.market = tagVal(body.market);
  if (tagVal(body.buildingName)) fields.building_name = tagVal(body.buildingName);

  const payload: {
    email: string;
    fields: Record<string, string>;
    groups?: string[];
  } = {
    email: email.toLowerCase(),
    fields,
  };
  if (groupId) {
    payload.groups = [groupId];
  }

  try {
    const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
      [key: string]: unknown;
    };

    if (!res.ok) {
      console.error('MailerLite subscriber error:', {
        status: res.status,
        data,
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

    // Best-effort: create/update lead in Supabase so agents see consultation in dashboard.
    const [leadFirst, ...leadLastParts] = name ? name.trim().split(/\s+/) : [];
    const leadLastName = leadLastParts.length > 0 ? leadLastParts.join(' ').slice(0, 200) : null;
    try {
      const admin = supabaseAdmin();
      const { data: existing } = await admin
        .from('leads')
        .select('id')
        .ilike('email_address', email.toLowerCase())
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        await admin
          .from('leads')
          .update({
            first_name: leadFirst?.slice(0, 200) || null,
            last_name: leadLastName,
            phone: phone || null,
          })
          .eq('id', existing.id);
      } else {
        await admin.from('leads').insert({
          email_address: email.toLowerCase(),
          first_name: leadFirst?.slice(0, 200) || null,
          last_name: leadLastName,
          phone: phone || null,
          crmc_score: null,
          address: null,
          city: null,
          state: null,
          zip: null,
          assigned_broker_id: null,
          assigned_lender_id: null,
        });
      }
    } catch (leadErr) {
      console.warn('Consultation: lead upsert skipped (non-fatal)', { email: email.slice(0, 3) + '…', err: leadErr });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('MailerLite request failed:', {
      error,
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
}
