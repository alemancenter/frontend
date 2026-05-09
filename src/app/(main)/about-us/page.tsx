'use client';

import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import {
  Eye,
  Target,
  Gift,
  School,
  BookOpen,
  Newspaper, // for 'news'
  Filter,
  Heart,
  Award,
  Users,
  Lightbulb,
  Mail,
  Globe,
} from 'lucide-react';

export default function AboutUsPage() {
  const { siteName, siteEmail, siteUrl } = useSettingsStore();
  const resolvedSiteName = siteName?.trim() || '';
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
              من نحن
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-0 max-w-2xl mx-auto font-light">
              مرحبًا بكم في موقع {resolvedSiteName}، المنصة التعليمية المميزة المصممة لدعم الطلاب
              والمعلمين في رحلتهم التعليمية.
            </p>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 -mt-20 relative z-20">
        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full hover:shadow-md transition-shadow">
            <div className="flex align-items-center mb-4 gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">رؤيتنا</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              نسعى إلى أن نكون المصدر الأول للمحتوى التعليمي الموثوق والشامل، متماشين مع المنهاج
              الأردني، مع تسهيل الوصول إلى المواد التعليمية والاختبارات والمقالات الإرشادية للطلاب
              والمعلمين على حد سواء.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full hover:shadow-md transition-shadow">
            <div className="flex align-items-center mb-4 gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">رسالتنا</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              تقديم تجربة تعليمية متكاملة تعتمد على توفير موارد تعليمية عالية الجودة تساهم في تحسين
              أداء الطلاب والمعلمين وتطوير البيئة التعليمية بشكل عام.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-12">
          <div className="flex align-items-center mb-6 gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Gift className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">ماذا نقدم؟</h2>
          </div>
          <p className="text-slate-600 mb-8">
            يقدم موقع {resolvedSiteName} مجموعة واسعة من الخدمات التعليمية المصممة بعناية، بما في
            ذلك:
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">صفوف دراسية</h3>
                <p className="text-slate-600 text-sm">
                  تغطي جميع الصفوف من التمهيدي حتى الصف الثاني عشر.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">مواد دراسية</h3>
                <ul className="text-slate-600 text-sm list-disc list-inside space-y-1">
                  <li>الخطة الدراسية</li>
                  <li>أوراق العمل والكورسات</li>
                  <li>الاختبارات الشهرية والنهائية</li>
                  <li>الكتب الرسمية ودليل المعلم</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">أخبار تربوية</h3>
                <p className="text-slate-600 text-sm">
                  تشمل آخر أخبار وزارة التربية والتعليم، وأخبار المعلمين، والمقالات الإرشادية.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">تصفية المحتوى</h3>
                <p className="text-slate-600 text-sm">
                  أدوات بحث وتصنيف متقدمة تتيح للمستخدمين الوصول إلى المحتوى المناسب بسهولة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-12">
          <div className="flex align-items-center mb-6 gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">قيمنا</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">الجودة</h3>
                <p className="text-slate-600 text-sm">تقديم محتوى تعليمي متميز ودقيق.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">التعاون</h3>
                <p className="text-slate-600 text-sm">
                  تعزيز بيئة تعليمية تدعم الشراكة بين الطلاب والمعلمين.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">الإبداع</h3>
                <p className="text-slate-600 text-sm">
                  استخدام أدوات وتقنيات حديثة لتحسين تجربة المستخدم.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info (Reusable) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex align-items-center mb-6 gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">التواصل معنا</h2>
          </div>
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
  );
}

