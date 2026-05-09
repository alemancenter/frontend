'use client';

import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import { Home, Mail, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DisclaimerPage() {
  const { siteName, siteEmail, siteUrl } = useSettingsStore();
  const contactEmail = siteEmail || 'info@alemedu.com';
  const contactSiteUrl = siteUrl || 'https://alemedu.com';

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans">
      {/* Hero Section */}
      <section
        className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 overflow-hidden"
        style={{ background: 'linear-gradient(226deg, #202c45 0%, #286aad 100%)' }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[150px] -right-[150px] w-[500px] h-[500px] rounded-full border border-white/5 opacity-30 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-sm leading-tight">
              إخلاء المسؤولية
            </h1>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="relative block w-[calc(100%+2px)] -ml-[1px] h-[60px] md:h-[100px]"
            style={{ transform: 'scaleY(-1)' }}
            shapeRendering="geometricPrecision"
          >
            <path
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
              className="fill-[#f8f9fa]"
            />
          </svg>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-sm border border-white/50">
          <Link href="/" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">إخلاء المسؤولية</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="lead">آخر تحديث: 18 يناير 2025</p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. الغرض من الموقع</h2>
            <p>
              موقع <strong>{siteName || 'الايمان التعليمي'}</strong> (<a href={contactSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contactSiteUrl}</a>) هو منصة تعليمية تهدف إلى تقديم محتوى تعليمي محدث ومصمم لدعم العملية التعليمية وفقًا للمنهاج الأردني. جميع المعلومات والمحتويات المقدمة على هذا الموقع هي لأغراض تعليمية وإرشادية فقط.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. دقة المعلومات</h2>
            <p>
              نحن نسعى لضمان دقة وصحة جميع المعلومات المقدمة على الموقع. ومع ذلك، لا نضمن أن تكون جميع المواد والمحتويات خالية تمامًا من الأخطاء أو محدثة بشكل كامل. يتحمل المستخدم مسؤولية التحقق من المعلومات قبل الاعتماد عليها.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. حدود المسؤولية</h2>
            <p>موقع {siteName || 'الايمان التعليمي'} غير مسؤول عن:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>أي أضرار مباشرة أو غير مباشرة قد تنجم عن استخدامك للموقع أو الاعتماد على محتوياته.</li>
              <li>أي خسائر أو أضرار تتعلق بتنزيل المرفقات أو المستندات التعليمية من الموقع.</li>
              <li>أي انقطاع في الخدمة بسبب مشكلات تقنية أو خارجية.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. الروابط الخارجية</h2>
            <p>
              قد يحتوي الموقع على روابط لمواقع إلكترونية خارجية. هذه الروابط توفرها موقع {siteName || 'الايمان التعليمي'} لتسهيل الوصول إلى مصادر إضافية. نحن غير مسؤولين عن محتوى أو سياسات الخصوصية الخاصة بهذه المواقع الخارجية.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. الاستخدام الشخصي وغير التجاري</h2>
            <p>
              جميع المحتويات والمواد التعليمية المقدمة على الموقع مصممة للاستخدام الشخصي وغير التجاري. يُحظر نسخ أو إعادة توزيع أي محتوى دون إذن كتابي مسبق.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. تحديث إخلاء المسؤولية</h2>
            <p>
              قد يتم تحديث هذه الصفحة من وقت لآخر لتعكس تغييرات في السياسات أو اللوائح. يُنصح المستخدمون بمراجعة هذه الصفحة بانتظام للتأكد من فهمهم لأحدث النسخ.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">التواصل معنا</h2>
            <p className="text-slate-600 mb-6">
              إذا كانت لديك أي أسئلة أو اقتراحات، يسعدنا أن نتواصل معك عبر:
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
                >
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <a
                  href={contactSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
                >
                  {contactSiteUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

