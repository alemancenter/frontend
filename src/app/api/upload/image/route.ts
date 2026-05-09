import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api/config';
import { forwardToBackend, getServerApiHeaders, getServerToken, readJsonSafe } from '@/lib/api/server-route';

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const token = await getServerToken();

    if (!token) {
      return NextResponse.json({ message: 'غير مصرح لك بالقيام بهذه العملية' }, { status: 401 });
    }

    const response = await forwardToBackend(API_ENDPOINTS.FILES.UPLOAD, {
      method: 'POST',
      body: fd,
      headers: getServerApiHeaders({ token, contentType: false }),
    });

    const data = await readJsonSafe(response);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'حدث خطأ أثناء رفع الصورة', errors: data?.errors ?? null },
        { status: response.status }
      );
    }

    return NextResponse.json(data ?? { success: true }, { status: 200 });
  } catch (error) {
    console.error('[UploadImage] Server error:', error);
    return NextResponse.json({ message: 'خطأ في الاتصال بالخادم' }, { status: 500 });
  }
}
