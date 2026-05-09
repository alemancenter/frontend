'use client';

import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import { Home, Mail, Globe } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const { siteName, siteEmail, siteUrl } = useSettingsStore();
  const contactEmail = siteEmail || 'info@alemedu.com';
  const contactSiteUrl = siteUrl || 'https://alemedu.com';

  const openConsentPreferences = () => {
    const win = window as Window & {
      ckyShowPreferenceCenter?: () => void;
      ckyShowConsent?: () => void;
      CookieYes?: {
        renew?: () => void;
        show?: () => void;
      };
    };

    if (typeof win.ckyShowPreferenceCenter === 'function') {
      win.ckyShowPreferenceCenter();
      return;
    }
    if (typeof win.ckyShowConsent === 'function') {
      win.ckyShowConsent();
      return;
    }
    if (typeof win.CookieYes?.renew === 'function') {
      win.CookieYes.renew();
      return;
    }
    if (typeof win.CookieYes?.show === 'function') {
      win.CookieYes.show();
      return;
    }

    window.location.href = '/cookie-policy';
  };

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
              سياسة الخصوصية
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
          <span className="text-slate-900">سياسة الخصوصية</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="lead">آخر تحديث: 2 مايو 2026</p>
            <p>
              توضح سياسة الخصوصية هذه سياساتنا وإجراءاتنا بشأن جمع معلوماتك واستخدامها والإفصاح عنها عند
              استخدامك للخدمة وتخبرك بحقوق الخصوصية الخاصة بك وكيف يحميك القانون.
            </p>
            <p>
              نحن نستخدم بياناتك الشخصية لتوفير الخدمة وتحسينها. باستخدام الخدمة، فإنك توافق على جمع
              المعلومات واستخدامها وفقًا لسياسة الخصوصية هذه.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">التفسير والتعريفات</h2>
            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">التفسير</h3>
            <p>
              الكلمات التي يبدأ الحرف الأول منها بأحرف كبيرة لها معاني محددة وفقًا للشروط التالية. يجب
              أن يكون للتعريفات التالية نفس المعنى بغض النظر عما إذا كانت تظهر في صيغة المفرد أو الجمع.
            </p>

            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">التعاريف</h3>
            <p>لأغراض سياسة الخصوصية هذه:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>الحساب</strong> يعني حسابًا فريدًا تم إنشاؤه لك للوصول إلى خدمتنا أو أجزاء من
                خدمتنا.
              </li>
              <li>
                <strong>الشركة</strong> (المشار إليها باسم &quot;الشركة&quot; أو &quot;نحن&quot; أو &quot;خاصتنا&quot; في هذه
                الاتفاقية) تشير إلى موقع {siteName || 'الايمان التعليمي'}.
              </li>
              <li>
                <strong>ملفات تعريف الارتباط</strong> هي ملفات صغيرة يتم وضعها على جهاز الكمبيوتر الخاص بك
                أو الجهاز المحمول أو أي جهاز آخر بواسطة موقع ويب، وتحتوي على تفاصيل سجل تصفحك على هذا
                الموقع من بين العديد من استخداماته.
              </li>
              <li>
                <strong>البلد</strong> يشير إلى: الأردن
              </li>
              <li>
                <strong>الجهاز</strong> يعني أي جهاز يمكنه الوصول إلى الخدمة مثل الكمبيوتر أو الهاتف
                المحمول أو الجهاز الرقمي الكمبيوتر اللوحي.
              </li>
              <li>
                <strong>البيانات الشخصية</strong> هي أي معلومات تتعلق بشخص محدد أو يمكن تحديده.
              </li>
              <li>
                <strong>الخدمة</strong> تشير إلى الموقع الإلكتروني.
              </li>
              <li>
                <strong>الموقع الإلكتروني</strong> يشير إلى موقع {siteName || 'الايمان التعليمي'}، الذي يمكن الوصول
                إليه من <a href={contactSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contactSiteUrl}</a>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">جمع بياناتك الشخصية واستخدامها</h2>
            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">أنواع البيانات التي يتم جمعها</h3>
            
            <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2">البيانات الشخصية</h4>
            <p>
              أثناء استخدام خدمتنا، قد نطلب منك تزويدنا ببعض المعلومات الشخصية التي يمكن استخدامها للاتصال
              بك أو تحديد هويتك. قد تتضمن المعلومات الشخصية القابلة للتحديد، على سبيل المثال لا الحصر:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>الاسم الأول والأخير</li>
              <li>رقم الهاتف</li>
              <li>بيانات الاستخدام</li>
            </ul>

            <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2">بيانات الاستخدام</h4>
            <p>يتم جمع بيانات الاستخدام تلقائيًا عند استخدام الخدمة.</p>
            <p>
              قد تتضمن بيانات الاستخدام معلومات مثل عنوان بروتوكول الإنترنت الخاص بجهازك (على سبيل المثال،
              عنوان IP)، ونوع المتصفح، وإصدار المتصفح، وصفحات الخدمة التي تزورها، ووقت وتاريخ زيارتك،
              والوقت الذي تقضيه في تلك الصفحات، ومعرفات الأجهزة الفريدة وغيرها من بيانات التشخيص.
            </p>

            <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2">تقنيات التتبع وملفات تعريف الارتباط</h4>
            <p>
              نحن نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتتبع النشاط على خدمتنا وتخزين
              معلومات معينة. تقنيات التتبع المستخدمة هي إشارات وعلامات وبرامج نصية لجمع المعلومات وتتبعها
              وتحسين خدمتنا وتحليلها.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">استخدام بياناتك الشخصية</h2>
            <p>يجوز للشركة استخدام البيانات الشخصية للأغراض التالية:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>لتوفير خدمتنا وصيانتها</strong>، بما في ذلك مراقبة استخدام خدمتنا.</li>
              <li><strong>لإدارة حسابك:</strong> لإدارة تسجيلك كمستخدم للخدمة.</li>
              <li><strong>للتواصل معك:</strong> للتواصل معك عبر البريد الإلكتروني أو المكالمات الهاتفية أو الرسائل القصيرة.</li>
              <li><strong>لتزويدك بالأخبار:</strong> والعروض الخاصة والمعلومات العامة حول السلع والخدمات.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">أمان بياناتك الشخصية</h2>
            <p>
              أمان بياناتك الشخصية مهم بالنسبة لنا، ولكن تذكر أنه لا توجد طريقة نقل عبر الإنترنت أو طريقة
              تخزين إلكتروني آمنة بنسبة 100%. وبينما نسعى جاهدين لاستخدام وسائل مقبولة تجاريًا لحماية
              بياناتك الشخصية، لا يمكننا ضمان أمانها المطلق.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">التغييرات على سياسة الخصوصية هذه</h2>
            <p>
              قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنعلمك بأي تغييرات من خلال نشر سياسة
              الخصوصية الجديدة على هذه الصفحة.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">استخدام Google للبيانات والإعلانات</h2>
            <div className="space-y-4 text-slate-600">
              <p>
                قد نستخدم خدمات Google الإعلانية، بما في ذلك Google AdSense، لعرض الإعلانات على موقعنا.
                تستخدم Google وشركاؤها ملفات تعريف الارتباط أو تقنيات مشابهة لعرض الإعلانات وقياسها وتحسينها،
                وقد تعتمد هذه الإعلانات على زيارات المستخدم لهذا الموقع أو مواقع وتطبيقات أخرى.
              </p>
              <p>
                يمكن للمستخدم تعطيل تخصيص الإعلانات أو إدارة طريقة استخدام Google للبيانات الإعلانية من خلال
                إعدادات الإعلانات لدى Google. وقد تستمر بعض الإعلانات غير المخصصة في الظهور بناءً على عوامل
                مثل محتوى الصفحة أو الموقع الجغرافي العام.
              </p>
              <p>
                قد تستخدم شبكات إعلانية أو مزودون آخرون ملفات تعريف ارتباط أو معرفات مشابهة لأغراض قياس
                أداء الإعلانات، منع الاحتيال، تحديد عدد مرات الظهور، وتحسين جودة الإعلانات المعروضة.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  إدارة أو تعطيل تخصيص الإعلانات:{' '}
                  <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Google Ads Settings
                  </a>
                </li>
                <li>
                  معرفة كيفية استخدام Google للبيانات عند استخدام مواقع أو تطبيقات شركائها:{' '}
                  <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    How Google uses data when you use our partners’ sites or apps
                  </a>
                </li>
                <li>
                  مراجعة سياسة ملفات تعريف الارتباط الخاصة بنا:{' '}
                  <Link href="/cookie-policy" className="text-blue-600 hover:underline">
                    Cookie policy
                  </Link>
                </li>
                <li>
                  معرفة المزيد عن ملفات تعريف الارتباط لدى Google:{' '}
                  <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    How Google uses cookies
                  </a>
                </li>
              </ul>
              <button
                type="button"
                onClick={openConsentPreferences}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Consent preferences
              </button>
            </div>
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

