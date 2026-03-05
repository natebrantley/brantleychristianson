/**
 * RMLS 12-hour data refresh requirement.
 * Vercel Cron invokes this route every 12 hours. Syncs IDX feed from Repliers.io and marks off-market listings Expired.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { repliersClient } from '@/lib/repliers';
import { syncRepliersListingsToSupabase } from '@/lib/repliers-listings';
import { secureCompare } from '@/lib/webhook-utils';

/** Validate Vercel Cron or CRON_SECRET (set in Vercel project → Settings → Environment Variables). Uses constant-time compare for secret. */
function isAuthorized(request: NextRequest): boolean {
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron === '1') return true;
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  return secureCompare(token, secret);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  try {
    const supabase = supabaseAdmin();

    // 1. Mark listings past expiration_date as Expired (RMLS: do not display to public)
    const today = new Date().toISOString().split('T')[0];
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'Expired', updated_at: new Date().toISOString() })
      .in('status', ['Active', 'Pending'])
      .lt('expiration_date', today);

    if (updateError) {
      if (updateError.code === '42P01') {
        const durationMs = Date.now() - start;
        return NextResponse.json({
          ok: true,
          durationMs,
          message: 'Listings table not yet created. Run migration 20260308000000_create_listings_table_rmls.sql.',
        });
      }
      console.error('sync-mls: failed to expire old listings', updateError);
      return NextResponse.json(
        { error: 'Failed to update expired listings', details: updateError.message },
        { status: 500 }
      );
    }

    // 2. Sync IDX feed from Repliers.io (upsert active listings, mark missing as Expired)
    let repliersResult: { upserted: number; expired: number } | null = null;
    const repliers = repliersClient();
    if (repliers) {
      repliersResult = await syncRepliersListingsToSupabase(repliers, supabase);
    }

    const durationMs = Date.now() - start;
    console.log('sync-mls: success', {
      correlationId: crypto.randomUUID(),
      route: '/api/cron/sync-mls',
      statusCode: 200,
      durationMs,
      repliers: repliersResult ?? 'not configured',
    });
    return NextResponse.json({
      ok: true,
      durationMs,
      expirationUpdate: true,
      repliers: repliersResult ?? null,
      message: repliers
        ? `MLS sync completed. Repliers: ${repliersResult!.upserted} upserted, ${repliersResult!.expired} marked expired.`
        : 'MLS sync completed (expiration only). Set REPLIERS_API_KEY and REPLIERS_DEFAULT_AGENT_ID for IDX feed sync.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('sync-mls: error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
