import Link from 'next/link';
import {
  FileText,
  Download,
  Shield,
  Clock,
  CheckCircle,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  Home,
  AlertCircle
} from 'lucide-react';

interface DownloadPageContentProps {
  fileName: string;
  fileSize: number;
  itemTitle: string;
  itemType: 'article' | 'post';
  subjectName?: string;
  backLink: string;
}

/**
 * Download Page Content Component
 *
 * Provides rich, valuable content for the download page to comply with
 * Google AdSense content policies. This ensures the page has meaningful
 * text content alongside the download functionality.
 */
export default function DownloadPageContent({
  fileName,
  fileSize,
  itemTitle,
  itemType,
  subjectName,
  backLink
}: DownloadPageContentProps) {
  const currentYear = new Date().getFullYear();

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
    }
    return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  };

  return (
    <div className="mt-8 space-y-6">

      {/* File Information Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-xl">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">معلومات الملف</h2>
            <p className="text-sm text-gray-500">تفاصيل الملف الذي تقوم بتحميله</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">اسم الملف</p>
            <p className="font-semibold text-gray-900 break-words bidi-plaintext" dir="auto">{fileName}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">حجم الملف</p>
            <p className="font-semibold text-gray-900">{formatFileSize(fileSize)}</p>
          </div>

          {subjectName && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">المادة الدراسية</p>
              <p className="font-semibold text-gray-900">{subjectName}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">المصدر</p>
            <p className="font-semibold text-gray-900">{itemType === 'post' ? 'منشور تعليمي' : 'مقال تعليمي'}</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-600">
          <p>
            هذا الملف جزء من {itemType === 'post' ? 'المنشور' : 'المقال'} التعليمي
            <Link href={backLink} className="text-blue-600 hover:underline font-medium mx-1">
              &quot;{itemTitle}&quot;
            </Link>
            {subjectName && <span>ضمن مادة {subjectName}</span>}. تم إعداد هذا المحتوى بعناية
            لمساعدة الطلاب في رحلتهم التعليمية للعام الدراسي {currentYear}-{currentYear + 1}.
          </p>
        </div>
      </div>

      {/* Features & Benefits Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-green-50 p-3 rounded-xl">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">مميزات التحميل</h2>
            <p className="text-sm text-gray-500">لماذا نقدم لك أفضل تجربة تحميل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
              <Download size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">تحميل مباشر</h3>
              <p className="text-sm text-gray-600">
                روابط تحميل مباشرة وسريعة بدون إعادة توجيه أو انتظار طويل
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-50 p-2 rounded-lg flex-shrink-0">
              <Shield size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">ملفات آمنة</h3>
              <p className="text-sm text-gray-600">
                جميع الملفات يتم فحصها للتأكد من خلوها من الفيروسات والبرامج الضارة
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-50 p-2 rounded-lg flex-shrink-0">
              <Clock size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">متاح دائماً</h3>
              <p className="text-sm text-gray-600">
                الملفات متاحة للتحميل على مدار الساعة من خوادم سريعة ومستقرة
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-orange-50 p-2 rounded-lg flex-shrink-0">
              <BookOpen size={18} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">محتوى تعليمي</h3>
              <p className="text-sm text-gray-600">
                ملفات تعليمية منتقاة بعناية تتوافق مع المناهج الدراسية الحديثة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Value Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">القيمة التعليمية</h2>
            <p className="text-sm text-gray-600">كيف سيساعدك هذا الملف في دراستك</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            نحن في منصتنا التعليمية نسعى جاهدين لتوفير أفضل المصادر والملفات التعليمية
            التي تساعد الطلاب على التفوق والنجاح. يتضمن هذا الملف محتوى تعليمي قيّم
            تم إعداده بواسطة متخصصين في المجال التعليمي.
          </p>

          <div className="bg-white/60 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-blue-600" />
              نصيحة للطلاب
            </h3>
            <p className="text-sm text-gray-600 mb-0">
              للاستفادة القصوى من هذا الملف، ننصح بقراءته بتمعن ومحاولة حل التمارين
              بنفسك قبل مراجعة الإجابات. كما يُفضل مراجعة المادة الأصلية في الكتاب
              المدرسي للحصول على فهم شامل.
            </p>
          </div>

          <p>
            إذا واجهت أي صعوبة في فهم المحتوى، لا تتردد في العودة إلى
            {itemType === 'post' ? ' المنشور ' : ' المقال '}
            الأصلي للاطلاع على الشرح التفصيلي والأمثلة الإضافية.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-yellow-50 p-3 rounded-xl">
            <HelpCircle size={24} className="text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">أسئلة شائعة</h2>
            <p className="text-sm text-gray-500">إجابات على الأسئلة الأكثر شيوعاً</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">هل التحميل مجاني؟</h3>
            <p className="text-sm text-gray-600">
              نعم، جميع الملفات متاحة للتحميل مجاناً بدون أي رسوم أو اشتراكات.
            </p>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">كيف أحصل على الملف؟</h3>
            <p className="text-sm text-gray-600">
              اضغط على زر &quot;تحميل الملف الآن&quot; للحصول على الملف مباشرةً. التحميل مجاني وفوري بدون أي خطوات إضافية.
            </p>
          </div>

          <div className="pb-2">
            <h3 className="font-semibold text-gray-900 mb-2">ماذا أفعل إذا لم يعمل التحميل؟</h3>
            <p className="text-sm text-gray-600">
              جرب تحديث الصفحة أو استخدام متصفح آخر. إذا استمرت المشكلة،
              يمكنك التواصل معنا عبر صفحة الاتصال.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            <span>العودة إلى {itemType === 'post' ? 'المنشور' : 'المقال'}</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
          >
            <Home size={16} />
            <span>الصفحة الرئيسية</span>
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center px-4">
        <p>
          إخلاء مسؤولية: جميع الحقوق محفوظة لأصحابها. يتم توفير هذا المحتوى للأغراض التعليمية فقط.
          إذا كنت تعتقد أن هناك انتهاكاً لحقوق الملكية الفكرية، يرجى التواصل معنا.
        </p>
      </div>

    </div>
  );
}
