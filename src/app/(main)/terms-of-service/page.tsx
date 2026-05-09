'use client';

import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import { Home, Mail, Globe } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
              شروط الاستخدام
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
          <span className="text-slate-900">شروط الاستخدام</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="lead">آخر تحديث: 18 يناير 2025</p>
            <p>
              يرجى قراءة شروط وأحكام الاستخدام بعناية قبل استخدام موقع <strong>{siteName || 'الايمان التعليمي'}</strong> (<a href={contactSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contactSiteUrl}</a>). باستخدامك لهذا الموقع، فإنك توافق على الالتزام بالشروط والأحكام التالية.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. مقدمة</h2>
            <p>
              يهدف موقع {siteName || 'الايمان التعليمي'} إلى توفير محتوى تعليمي متكامل ومحدث يتماشى مع المنهاج الأردني. يتم تقسيم المحتوى إلى صفوف دراسية، مواد تعليمية، وأقسام مرفقات تهدف لدعم العملية التعليمية. يوفر الموقع أيضًا مقالات تعليمية وأخبار مخصصة للمعلمين والإدارة المدرسية.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. التعريفات</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>&quot;الموقع&quot;:</strong> يشير إلى موقع {siteName || 'الايمان التعليمي'} (<a href={contactSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contactSiteUrl}</a>).</li>
              <li><strong>&quot;الخدمة&quot;:</strong> تعني جميع المحتويات، المواد التعليمية، والمرفقات التي يوفرها الموقع.</li>
              <li><strong>&quot;المستخدم&quot;:</strong> أي شخص يصل إلى الموقع أو يستخدمه، سواء كان مديرًا، مشرفًا، أو عضوًا.</li>
              <li><strong>&quot;العضوية&quot;:</strong> تعني الحساب المسجل الذي يمكن للمستخدم الوصول من خلاله إلى ميزات محددة.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. الأدوار والصلاحيات</h2>
            <p>يقسم الموقع صلاحيات المستخدمين إلى ثلاث فئات:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>المدير:</strong> يتمتع بكامل الصلاحيات لإدارة المحتوى، المستخدمين، والإعدادات.</li>
              <li><strong>المشرف:</strong> يقتصر دوره على إدارة المقالات (إضافة، تعديل، حذف).</li>
              <li><strong>العضو:</strong> يمكنه التعليق على المقالات وتحميل المرفقات فقط.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. استخدام الخدمة</h2>
            <p>باستخدامك للموقع، فإنك توافق على:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>عدم استخدام الموقع لأي غرض غير قانوني أو ينتهك القوانين الأردنية.</li>
              <li>عدم محاولة اختراق أو تعطيل عمل الموقع.</li>
              <li>استخدام المحتوى المتاح فقط للأغراض التعليمية الشخصية وعدم إعادة توزيعه دون إذن مسبق.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. الملكية الفكرية</h2>
            <p>
              جميع المحتويات المنشورة على الموقع، بما في ذلك النصوص، الصور، والشعارات، هي ملك لموقع {siteName || 'الايمان التعليمي'} وتحميها قوانين حقوق الملكية الفكرية. يُحظر نسخ أو استخدام أي جزء من الموقع دون إذن كتابي مسبق.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. سياسة المرفقات</h2>
            <p>يحتوي الموقع على مرفقات تعليمية تشمل:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>الخطة الدراسية.</li>
              <li>أوراق العمل وكورسات المواد.</li>
              <li>الاختبارات الشهرية والنهائية.</li>
              <li>الكتب الرسمية ودليل المعلم.</li>
            </ul>
            <p className="mt-2">يُسمح بتنزيل المرفقات للاستخدام الشخصي فقط، ويحظر توزيعها أو استخدامها لأغراض تجارية.</p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. حدود المسؤولية</h2>
            <p>لا يتحمل الموقع أي مسؤولية عن:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدامك للمحتوى أو المرفقات.</li>
              <li>أي معلومات غير دقيقة أو غير محدثة على الموقع.</li>
              <li>أي انقطاع في الخدمة بسبب عوامل خارجة عن إرادتنا.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. التعديلات</h2>
            <p>
              يحتفظ موقع {siteName || 'الايمان التعليمي'} بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين بأي تغييرات من خلال تحديث هذه الصفحة. استمرارك في استخدام الموقع يعني قبولك للشروط المعدلة.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">9. القانون الحاكم</h2>
            <p>تُفسر هذه الشروط والأحكام وفقًا لقوانين المملكة الأردنية الهاشمية.</p>
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

