import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_MAX_AGE = 60 * 60 * 24;      // 1 day  (matches JWT expiry)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (matches refresh JWT expiry)

// GET — restore in-memory token from HttpOnly cookie (called on page refresh)
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value ?? '';
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? '';

  if (!token || token.length < 20 || token.length > 4096) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    token,
    refresh_token: refreshToken || null,
  });
}

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  return request.nextUrl.protocol === 'https:' || forwardedProto === 'https' || process.env.NODE_ENV === 'production';
}

function cookieBase(request: NextRequest) {
  return {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const token = obj.token;
  const refreshToken = obj.refresh_token;

  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
  }

  const base = cookieBase(request);
  const response = NextResponse.json({ success: true });

  response.cookies.set({ name: ACCESS_COOKIE, value: token, ...base, maxAge: ACCESS_MAX_AGE });

  if (typeof refreshToken === 'string' && refreshToken.length >= 20 && refreshToken.length <= 4096) {
    response.cookies.set({ name: REFRESH_COOKIE, value: refreshToken, ...base, maxAge: REFRESH_MAX_AGE });
  }

  return response;
}

export async function DELETE(request: NextRequest) {
  const base = cookieBase(request);
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: ACCESS_COOKIE,  value: '', ...base, maxAge: 0 });
  response.cookies.set({ name: REFRESH_COOKIE, value: '', ...base, maxAge: 0 });
  return response;
}
