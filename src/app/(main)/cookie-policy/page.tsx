'use client';

import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import { Home, Mail, Globe } from 'lucide-react';
import Link from 'next/link';

export default function CookiePolicyPage() {
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
              سياسة ملفات تعريف الارتباط
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
          <span className="text-slate-900">سياسة الكوكيز</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="lead">آخر تحديث: 18 يناير 2025</p>
            <p>
              توضح سياسة ملفات تعريف الارتباط هذه كيفية استخدام موقع <strong>{siteName || 'الايمان التعليمي'}</strong> (<a href={contactSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contactSiteUrl}</a>) ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وتقديم خدمات مخصصة.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. ما هي ملفات تعريف الارتباط؟</h2>
            <p>
              ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقعنا. تُستخدم هذه الملفات لتذكر تفضيلاتك وتحسين تجربتك على الموقع.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. كيفية استخدامنا لملفات تعريف الارتباط</h2>
            <p>نستخدم ملفات تعريف الارتباط للأغراض التالية:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>ملفات تعريف الارتباط الضرورية:</strong> تُستخدم لتمكين الميزات الأساسية مثل التنقل في الموقع والوصول الآمن.</li>
              <li><strong>ملفات تعريف الارتباط التحليلية:</strong> تساعدنا في فهم كيفية استخدام الزوار للموقع لتحسين أدائه.</li>
              <li><strong>ملفات تعريف الارتباط الوظيفية:</strong> تُستخدم لتذكر تفضيلاتك مثل اللغة أو الإعدادات المخصصة.</li>
              <li><strong>ملفات تعريف الارتباط الإعلانية:</strong> تُستخدم لعرض الإعلانات ذات الصلة بناءً على اهتماماتك.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. أنواع ملفات تعريف الارتباط التي نستخدمها</h2>
            <p>يمكن تصنيف ملفات تعريف الارتباط التي نستخدمها إلى نوعين:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>ملفات تعريف الارتباط الدائمة:</strong> تظل هذه الملفات مخزنة على جهازك حتى تنتهي صلاحيتها أو تقوم بحذفها يدويًا.</li>
              <li><strong>ملفات تعريف الارتباط المؤقتة (الجلسات):</strong> تُحذف هذه الملفات تلقائيًا عند إغلاق متصفحك.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. التحكم في ملفات تعريف الارتباط</h2>
            <p>
              يمكنك التحكم في استخدام ملفات تعريف الارتباط أو إيقافها بالكامل من خلال إعدادات متصفحك. ومع ذلك، قد يؤدي ذلك إلى عدم تمكنك من استخدام بعض ميزات الموقع.
            </p>
            <p>للتحكم في ملفات تعريف الارتباط، اتبع الإرشادات الموجودة في إعدادات متصفحك:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>لـ Google Chrome: <a href="https://support.google.com/chrome/answer/95647?hl=ar" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">إرشادات كروم</a></li>
              <li>لـ Mozilla Firefox: <a href="https://support.mozilla.org/ar/kb/حظر-ملفات-تعريف-الارتباط" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">إرشادات فايرفوكس</a></li>
              <li>لـ Safari: <a href="https://support.apple.com/ar-sa/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">إرشادات سفاري</a></li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. ملفات تعريف الارتباط الخارجية</h2>
            <p className="mb-4">
              قد نستخدم خدمات خارجية مثل Google Analytics لتحليل أداء الموقع، وGoogle AdSense لعرض الإعلانات.
              هذه الخدمات قد تضع ملفات تعريف ارتباط خاصة بها لجمع البيانات حول استخدامك للموقع. نحن لا نتحكم في ملفات تعريف الارتباط التي يتم وضعها بواسطة الجهات الخارجية.
            </p>
            <p className="mb-2">
              <strong>Google AdSense:</strong> يستخدم ملف تعريف ارتباط DART لعرض إعلانات مخصصة بناءً على زيارات
              المستخدم السابقة لهذا الموقع ومواقع أخرى. يمكنك إلغاء الاشتراك عبر:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4 mr-4">
              <li>
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  إعدادات إعلانات Google
                </a>
              </li>
              <li>
                <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  aboutads.info
                </a>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. تحديث سياسة ملفات تعريف الارتباط</h2>
            <p>
              قد يتم تحديث سياسة ملفات تعريف الارتباط من وقت لآخر لتلبية المتطلبات القانونية أو التكنولوجية. يُنصح بمراجعة هذه الصفحة بانتظام للحصول على أحدث المعلومات.
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

