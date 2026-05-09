import { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { safeJsonLd } from '@/lib/utils';
import DownloadTimer from '@/components/download/DownloadTimer';
import AdSenseDisplay from '@/components/ads/AdSenseDisplay';
import ClassHeader from '@/components/class/ClassHeader';
import DownloadPageContent from '@/components/download/DownloadPageContent';
import { ChevronLeft, Home, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{
    fileId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type FileInfoResult =
  | { ok: true; data: any }
  | { ok: false; status?: number; message?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch file info with related article/post
async function getFileInfo(fileId: string, countryCode: string = 'jo'): Promise<FileInfoResult> {
  const retryStatuses = new Set([429, 500, 502, 503, 504]);
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.FILES.INFO(fileId),
        { database: countryCode },
        { cache: 'no-store' } as any
      );
      const data = response?.data?.data || null;
      if (!data) {
        return { ok: false, message: 'Empty response' };
      }
      return { ok: true, data };
    } catch (err: any) {
      const status = (err as any)?.status;
      const message = (err as any)?.message;

      if (status === 404) {
        return { ok: false, status, message };
      }

      if (status && retryStatuses.has(status) && attempt < maxAttempts) {
        const delayMs = 250 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
        await sleep(delayMs);
        continue;
      }

      console.error('Error fetching file info:', err);
      return { ok: false, status, message };
    }
  }

  return { ok: false, status: 503, message: 'Retry attempts exhausted' };
}

const resolveCountryCode = (codeCookie?: string | null, idCookie?: string | null): string => {
  if (codeCookie && typeof codeCookie === 'string') {
    const normalized = codeCookie.trim().toLowerCase();
    if (['jo', 'sa', 'eg', 'ps'].includes(normalized)) return normalized;
  }
  const id = (idCookie || '').toString().trim();
  return id === '2' ? 'sa' : id === '3' ? 'eg' : id === '4' ? 'ps' : 'jo';
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fileId } = await params;
  const cookieStore = await cookies();
  const countryCode = resolveCountryCode(
    cookieStore.get('country_code')?.value,
    cookieStore.get('country_id')?.value
  );

  const result = await getFileInfo(fileId, countryCode);

  if (!result.ok) {
    return {
      title: 'ملف غير موجود',
      description: 'الملف المطلوب غير متوفر',
    };
  }

  const { file, item } = result.data;

  const title = `تحميل ${file.file_name}${item ? ` - ${item.title}` : ''}`;
  const subjectName = item?.subject?.name ? `التابع لمادة ${item.subject.name}` : '';
  const description = `تحميل ملف ${file.file_name} ${subjectName}. ${item?.meta_description || 'ملف تعليمي عالي الجودة متاح للتحميل المباشر.'}`;

  const ogImage = item?.image_url || '/assets/img/front-pages/icons/articles_default_image.webp';

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 800, height: 600, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `/download/${fileId}`,
    },
  };
}

export default async function DownloadPage({ params, searchParams }: Props) {
  const { fileId } = await params;
  const sp = await searchParams;
  const cookieStore = await cookies();
  const countryCode = resolveCountryCode(
    cookieStore.get('country_code')?.value,
    cookieStore.get('country_id')?.value
  );

  const result = await getFileInfo(fileId, countryCode);

  if (!result.ok && result.status === 404) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className="bg-yellow-50 p-4 rounded-xl mb-6">
              <FileText size={32} className="text-yellow-600 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">عذراً، لم يتم العثور على الملف</h2>
            <p className="text-gray-600 mb-6">
              يبدو أن الملف الذي تبحث عنه غير متوفر حالياً. قد يكون قد تم حذفه أو نقله إلى مكان آخر.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home size={18} />
                الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className="bg-blue-50 p-4 rounded-xl mb-6">
              <FileText size={32} className="text-blue-600 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">تعذّر تحميل بيانات الملف</h2>
            <p className="text-gray-600 mb-6">
              حدث خطأ مؤقت أو ضغط على الخادم. يرجى المحاولة مرة أخرى.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/download/${fileId}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home size={18} />
                الصفحة الرئيسية
              </Link>
            </div>
            {result.status ? (
              <p className="mt-4 text-xs text-gray-400">Code: {result.status}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const { file, item, type } = result.data;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `تحميل ${file.file_name}`,
    description: item ? `صفحة تحميل الملف ${file.file_name} التابع لـ ${item.title}` : `صفحة تحميل الملف ${file.file_name}`,
    mainEntity: {
      '@type': 'DigitalDocument',
      name: file.file_name,
      fileFormat: file.mime_type || 'application/pdf',
      size: `${file.file_size} bytes`,
    }
  };

  const backParamRaw = sp?.back;
  const backParam = Array.isArray(backParamRaw) ? backParamRaw[0] : backParamRaw;

  const backLink = backParam || (item
    ? (type === 'post' ? `/${countryCode}/posts/${item.id}` : `/${countryCode}/lesson/articles/${item.id}`)
    : `/${countryCode}`);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <ClassHeader title={`تحميل: ${file.file_name}`} />

      <div className="container mx-auto px-4 mt-8">

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-8">
          <ol className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                <Home size={16} />
                <span>الرئيسية</span>
              </Link>
            </li>
            <li>
              <ChevronLeft size={16} className="text-gray-400" />
            </li>
            {item && (
              <>
                <li>
                  <Link href={backLink} className="hover:text-blue-600 transition-colors line-clamp-1">
                    {item.title}
                  </Link>
                </li>
                <li>
                  <ChevronLeft size={16} className="text-gray-400" />
                </li>
              </>
            )}
            <li className="font-semibold text-blue-600" aria-current="page">
              تحميل الملف
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8">

            {/* Download Timer Card */}
            <DownloadTimer
              fileId={fileId}
              countryCode={countryCode}
              fileName={file.file_name}
              fileSize={file.file_size}
              fileType={file.file_type}
              viewsCount={file.views_count ?? 0}
              downloadCount={file.download_count ?? 0}
            />

            {/* Rich Content Section - AdSense Compliant */}
            <DownloadPageContent
              fileName={file.file_name}
              fileSize={file.file_size}
              itemTitle={item?.title || 'ملف تعليمي'}
              itemType={type || 'article'}
              subjectName={item?.subject?.name}
              backLink={backLink}
            />

            {/* Bottom Ad - إعلان بعد المحتوى */}
            <div className="mt-8">
              <AdSenseDisplay slotType="download_top" />
            </div>

          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Sidebar Ad - إعلان 2 */}
            <div className="sticky top-20">
              <AdSenseDisplay slotType="download_sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
