/**
 * NLP natural language search: proxy to Repliers POST /nlp.
 * Body: { prompt: string, nlpId?: string }. Max prompt length 500.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { apiErrorResponse, API_ERROR_CODES } from '@/lib/api-errors';

const REPLIERS_BASE = 'https://api.repliers.io';
const NLP_PROMPT_MAX = 500;

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(NLP_PROMPT_MAX),
  nlpId: z.string().trim().max(100).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const clientIp = getClientIp(request);
  if (isRateLimited(`nlp:${clientIp}`)) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.TOO_MANY_REQUESTS);
    return NextResponse.json(body, { status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.INVALID_INPUT);
    return NextResponse.json(body, { status });
  }

  const apiKey = process.env.REPLIERS_API_KEY?.trim();
  if (!apiKey) {
    const { body, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
    return NextResponse.json(body, { status });
  }

  const url = `${REPLIERS_BASE}/nlp`;
  const body = JSON.stringify({
    prompt: parsed.data.prompt,
    ...(parsed.data.nlpId && { nlpId: parsed.data.nlpId }),
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': apiKey,
      },
      body,
    });

    if (res.status === 429) {
      const { body: errBody, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_RATE_LIMIT);
      return NextResponse.json(errBody, { status });
    }

    if (res.status === 406) {
      const { body: errBody, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_NLP_NOT_SEARCH);
      return NextResponse.json(errBody, { status });
    }

    if (!res.ok) {
      const { body: errBody, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
      return NextResponse.json(errBody, { status });
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(data);
  } catch {
    const { body: errBody, status } = apiErrorResponse(API_ERROR_CODES.REPLIERS_UNAVAILABLE);
    return NextResponse.json(errBody, { status });
  }
}
