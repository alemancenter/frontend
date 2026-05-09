import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';

const resolveCountryCode = (codeCookie?: string | null, idCookie?: string | null): string => {
  if (codeCookie && typeof codeCookie === 'string') {
    const normalized = codeCookie.trim().toLowerCase();
    if (['jo', 'sa', 'eg', 'ps'].includes(normalized)) return normalized;
  }
  const id = (idCookie || '').toString().trim();
  return id === '2' ? 'sa' : id === '3' ? 'eg' : id === '4' ? 'ps' : 'jo';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const countryCodeParam = searchParams.get('countryCode') || searchParams.get('database');

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  const cookieStore = await cookies();
  const inferredCountryCode = resolveCountryCode(
    cookieStore.get('country_code')?.value,
    cookieStore.get('country_id')?.value
  );
  const countryCode = (countryCodeParam || inferredCountryCode || 'jo').trim().toLowerCase();

  // Get token from cookies
  const token = cookieStore.get('token')?.value;

  // Construct the backend URL
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, '');
  const endpoint = API_ENDPOINTS.ARTICLES.DOWNLOAD(fileId);
  const backendUrl = new URL(`${baseUrl}${endpoint}`);
  backendUrl.searchParams.set('database', countryCode);
  
  console.log(`[Proxy] Fetching file from: ${backendUrl}`);

  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp =
      forwardedFor?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('true-client-ip') ||
      '127.0.0.1';

    const requestHeaders: Record<string, string> = {
      'Accept': '*/*', // Accept any content type
      'X-Requested-With': 'XMLHttpRequest',
      'X-Forwarded-For': clientIp,
    };
    requestHeaders['X-Real-IP'] = clientIp;

    const incomingUserAgent = request.headers.get('user-agent');
    requestHeaders['User-Agent'] = incomingUserAgent || 'Next.js';

    const incomingOrigin = request.headers.get('origin');
    requestHeaders['Origin'] = incomingOrigin || request.nextUrl.origin;

    const incomingReferer = request.headers.get('referer');
    if (incomingReferer) {
      requestHeaders['Referer'] = incomingReferer;
    }

    const incomingRange = request.headers.get('range');
    if (incomingRange) {
      requestHeaders['Range'] = incomingRange;
    }

    const apiKey = process.env.FRONTEND_API_KEY;
    if (apiKey) {
      requestHeaders['X-Frontend-Key'] = apiKey;
    }

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Fetch from the Laravel backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[Proxy] Backend download error: ${response.status}`);
      // If it's a 404, it might be JSON or HTML.
      const text = await response.text();
      console.error(`[Proxy] Error body preview: ${text.substring(0, 200)}`);
      
      if (response.status === 404) {
        return new NextResponse('File not found', { status: 404 });
      }
      return new NextResponse(`Error fetching file: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    
    // Check if we got HTML instead of a file
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error(`[Proxy] Received HTML instead of file. Preview: ${text.substring(0, 500)}`);
      // This is likely a Laravel error page (404, 500, or Login redirect) that returned 200 OK (unlikely for error, but possible for login page)
      // Or it's a 200 OK but with HTML content (e.g. maintenance mode).
      return new NextResponse('Internal Backend Error: Received HTML instead of file', { status: 502 });
    }

    // Create a new response with the backend's body
    const responseHeaders = new Headers();
    
    if (contentType) responseHeaders.set('Content-Type', contentType);

    const contentLength = response.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    } else {
      // Fallback: try to guess filename from contentType or just use ID
      const ext = contentType?.split('/')[1] || 'bin';
      responseHeaders.set('Content-Disposition', `attachment; filename="file-${fileId}.${ext}"`);
    }

    const passthroughHeaders = [
      'accept-ranges',
      'content-range',
      'etag',
      'last-modified',
      'cache-control',
    ] as const;

    for (const header of passthroughHeaders) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    const body = response.body;
    if (!body) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[Proxy] Internal Server Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
