import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FEED_ALIAS_PATHS = new Set([
  '/feed',
  '/feed.xml',
  '/feed/posts/default',
  '/blog/feed',
  '/blog/feed.xml',
  '/blog/rss',
  '/blog/rss.xml',
  '/articles/feed',
]);

function normalizePathname(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower === '/') return '/';
  return lower.replace(/\/+$/, '');
}

function shouldRedirectToFeed(pathname: string): boolean {
  if (pathname === '/rss') return true;
  if (pathname.startsWith('/rss/')) return true;
  return FEED_ALIAS_PATHS.has(pathname);
}

/**
 * Decodes the JWT payload section (base64url → JSON) without verifying the signature.
 * Returns null for any malformed token (wrong number of parts, invalid base64, bad JSON).
 */
function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Returns true when the token is malformed or its `exp` claim is in the past.
 * Tokens without an `exp` claim are treated as valid (never-expiring).
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false;
  return Date.now() >= payload.exp * 1000;
}

export function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const format = request.nextUrl.searchParams.get('format')?.toLowerCase();

  // Feed/RSS redirects → /rss.xml
  if (
    pathname !== '/rss.xml' &&
    (shouldRedirectToFeed(pathname) || (pathname === '/' && format === 'feed'))
  ) {
    const feedUrl = request.nextUrl.clone();
    const nextSearchParams = new URLSearchParams(request.nextUrl.searchParams);

    nextSearchParams.delete('format');
    feedUrl.pathname = '/rss.xml';
    feedUrl.search = nextSearchParams.toString();

    return NextResponse.redirect(feedUrl, 308);
  }

  // Dashboard auth protection
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value;
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('return', request.nextUrl.pathname);

    if (!token) {
      return NextResponse.redirect(loginUrl);
    }

    if (isTokenExpired(token)) {
      loginUrl.searchParams.set('reason', 'expired');
      const redirect = NextResponse.redirect(loginUrl);
      // Clear the stale cookie so it doesn't keep triggering this branch
      redirect.cookies.set({ name: 'token', value: '', path: '/', maxAge: 0 });
      return redirect;
    }
  }

  const response = NextResponse.next();

  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cache static assets aggressively
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Never cache API responses (upload, search, dynamic endpoints)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
