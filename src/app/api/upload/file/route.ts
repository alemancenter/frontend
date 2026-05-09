import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api/config';
import { forwardToBackend, getServerApiHeaders, getServerToken, readJsonSafe } from '@/lib/api/server-route';

async function hasUploadPermission(token: string): Promise<boolean> {
  const response = await forwardToBackend(API_ENDPOINTS.AUTH.ME, {
    method: 'GET',
    headers: getServerApiHeaders({ token, contentType: false }),
  });

  if (!response.ok) return false;

  const userData = await readJsonSafe(response);
  const user = userData?.data || userData;

  return Boolean(
    user?.roles?.some((role: any) => ['admin', 'super_admin'].includes(role.name)) ||
    user?.permissions?.some((permission: any) => permission.name === 'manage files')
  );
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const token = await getServerToken();

    if (!token) {
      return NextResponse.json({ message: 'غير مصرح لك بالقيام بهذه العملية' }, { status: 401 });
    }

    const allowed = await hasUploadPermission(token);
    if (!allowed) {
      return NextResponse.json({ message: 'ليس لديك صلاحية رفع الملفات' }, { status: 403 });
    }

    const response = await forwardToBackend(API_ENDPOINTS.FILES.UPLOAD_FILE, {
      method: 'POST',
      body: fd,
      headers: getServerApiHeaders({ token, contentType: false }),
    });

    const data = await readJsonSafe(response);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'حدث خطأ ما', errors: data?.errors ?? null },
        { status: response.status }
      );
    }

    return NextResponse.json(data ?? { success: true }, { status: 200 });
  } catch (error) {
    console.error('[UploadFile] Server error:', error);
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم' }, { status: 500 });
  }
}
