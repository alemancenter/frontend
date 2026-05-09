import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

type RevalidateBody = {
  secret?: string;
  paths?: string[];
};

function resolveSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET || process.env.FRONTEND_REVALIDATE_SECRET;
}

export async function POST(request: NextRequest) {
  const secret = resolveSecret();
  const body = (await request.json().catch(() => null)) as RevalidateBody | null;
  const provided = body?.secret || request.headers.get('x-revalidate-secret') || undefined;

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rawPaths = Array.isArray(body?.paths) ? body?.paths : [];
  const uniquePaths = Array.from(
    new Set(
      rawPaths.filter((path) => typeof path === 'string' && path.startsWith('/'))
    )
  );

  for (const path of uniquePaths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated: uniquePaths,
    count: uniquePaths.length,
    timestamp: Date.now(),
  });
}
