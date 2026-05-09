import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/api/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = request.cookies.get('token')?.value;

  // This route only runs server-side, so use the internal URL to hit Go Fiber
  // directly (plain HTTP on 127.0.0.1:8081, bypasses Nginx/SSL overhead).
  const base = API_CONFIG.INTERNAL_URL;
  const backendRoot = /\/api\/?$/.test(base) ? base.replace(/\/api\/?$/, '') : base;

  const requestedPath = `/${(path || []).join('/')}`;
  const backendPath = requestedPath.startsWith('/storage/')
    ? requestedPath
    : `/storage${requestedPath}`;

  const backendUrl = new URL(`${backendRoot}${backendPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const headers: HeadersInit = {
    Accept: '*/*',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const apiKey = process.env.FRONTEND_API_KEY;
  if (apiKey) {
    (headers as Record<string, string>)['X-Frontend-Key'] = apiKey;
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(backendUrl.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const outHeaders = new Headers();
  const contentType = resp.headers.get('content-type');
  if (contentType) outHeaders.set('content-type', contentType);

  const contentDisposition = resp.headers.get('content-disposition');
  if (contentDisposition) outHeaders.set('content-disposition', contentDisposition);

  const etag = resp.headers.get('etag');
  if (etag) outHeaders.set('etag', etag);

  const lastModified = resp.headers.get('last-modified');
  if (lastModified) outHeaders.set('last-modified', lastModified);

  const contentLength = resp.headers.get('content-length');
  if (contentLength) outHeaders.set('content-length', contentLength);

  if (resp.ok) {
    outHeaders.set('cache-control', 'public, max-age=31536000, immutable');
  }

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: outHeaders,
  });
}
