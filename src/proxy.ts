import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

const hasClerkKeys =
  process.env.CLERK_SECRET_KEY != null && process.env.CLERK_SECRET_KEY !== '';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/agents/dashboard(.*)',
  '/owners/dashboard(.*)',
  '/clients/dashboard',
  '/lenders/dashboard',
  '/api/favorites',
  '/api/saved-searches',
  '/api/me/agent',
  '/api/me/lender',
  '/api/leads(.*)',
  '/listings/saved',
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (hasClerkKeys) {
    return clerkHandler(request, event);
  }
  return NextResponse.next();
}

export default proxy;

// Clerk best practice: protect routes in proxy (Next.js 16 proxy.ts).
// Matcher skips static assets and _next; runs for API and app routes.
// @see Clerk SDK: server-auth-nextjs (createRouteMatcher + auth.protect)
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
