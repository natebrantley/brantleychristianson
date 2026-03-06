/**
 * Push public.leads to MailerLite as subscribers (upsert by email).
 * Trigger: Vercel Cron or manual GET with CRON_SECRET in Authorization: Bearer <CRON_SECRET>.
 * Env: MAILERLITE_API_TOKEN (required), MAILERLITE_GROUP_ID (optional), CRON_SECRET or x-vercel-cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncLeadsToMailerLite } from '@/lib/mailerlite-leads';
import { secureCompare } from '@/lib/webhook-utils';

function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return secureCompare(auth.slice(7).trim(), secret);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiToken = process.env.MAILERLITE_API_TOKEN?.trim();
  if (!apiToken) {
    return NextResponse.json(
      { error: 'MAILERLITE_API_TOKEN not set' },
      { status: 503 }
    );
  }

  const groupId = process.env.MAILERLITE_GROUP_ID?.trim() || undefined;
  const limit = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get('limit') ?? '500', 10) || 500, 1),
    2000
  );

  try {
    const admin = supabaseAdmin();
    const result = await syncLeadsToMailerLite(admin, apiToken, groupId, { limit });

    return NextResponse.json({
      ok: true,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors.slice(0, 20) : undefined,
      errorCount: result.errors.length,
    });
  } catch (err) {
    console.error('sync-leads-to-mailerlite failed', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
