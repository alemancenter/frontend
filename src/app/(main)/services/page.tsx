'use client';

import { motion } from '@/lib/motion-lite';
import Link from 'next/link';
import { ArrowLeft, School, BookOpen, Newspaper, Filter, Users, Globe, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const services = [
  {
    icon: School,
    title: 'المحتوى التعليمي للصفوف',
    description: 'تغطية شاملة لجميع الصفوف والمواد وفق المنهاج الأردني',
    features: [
      'صفوف من التمهيدي حتى الصف الثاني عشر',
      'مواد منظمة حسب الصف والمبحث',
      'تحديث مستمر للمحتوى الدراسي',
      'توافق مع منهاج وزارة التربية والتعليم',
    ],
    price: 'مجاني للطلاب',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: BookOpen,
    title: 'بنك الامتحانات والملفات',
    description: 'مجموعة واسعة من الامتحانات والملفات التعليمية الجاهزة للطباعة',
    features: [
      'امتحانات شهرية ونهائية',
      'أوراق عمل ودوسيات',
      'خطط وتحاضير دروس',
      'الكتب الرسمية ودليل المعلم',
    ],
    price: 'اشتراك خاص بالمعلمين',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Newspaper,
    title: 'الأخبار والمقالات التربوية',
    description: 'متابعة آخر أخبار التربية والتعليم والمقالات الإرشادية',
    features: [
      'أخبار وزارة التربية والتعليم',
      'أخبار المعلمين والطلبة',
      'مقالات تربوية وإرشادية',
      'تنبيهات وتعليمات مهمة',
    ],
    price: 'متاح مجاناً',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Filter,
    title: 'البحث والتصفية المتقدمة',
    description: 'أدوات بحث ذكية للوصول السريع إلى المحتوى المناسب',
    features: [
      'بحث سريع عن الملفات والمواد',
      'تصفية حسب الصف والمبحث والفصل',
      'تصنيف حسب نوع الملف والمحتوى',
      'واجهة سهلة للمستخدمين من مختلف الفئات',
    ],
    price: 'مضمن في المنصة',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Users,
    title: 'خدمات الأعضاء والمعلمين',
    description: 'مساحة للتواصل والتعاون مع فريق المنصة والمعلمين',
    features: [
      'عرض ملفات أعضاء الفريق المسؤولين عن المحتوى',
      'مراسلة الإدارة وطلب المساعدة',
      'استقبال الاقتراحات والاستفسارات التعليمية',
      'إمكانية طلب ملفات ومواد خاصة',
    ],
    price: 'حسب نوع العضوية',
    color: 'from-cyan-500 to-sky-500',
  },
  {
    icon: Globe,
    title: 'شراكات المدارس والإعلان',
    description: 'حلول خاصة للمدارس والمراكز التعليمية وأصحاب الإعلانات',
    features: [
      'باقات مخصصة للمدارس والمراكز التعليمية',
      'مساحات إعلانية داخل المنصة التعليمية',
      'ترويج للمعاهد والدورات والأنشطة التعليمية',
      'مرونة في اختيار الخطة الأنسب لاحتياجاتك',
    ],
    price: 'بالاتفاق مع الإدارة',
    color: 'from-red-500 to-rose-600',
  },
];

export default function ServicesPage() {
  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-primary font-medium">خدمات المنصة</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-6">
            خدمات تعليمية <span className="gradient-text">متكاملة</span> للطلاب والمعلمين
          </h1>
          <p className="text-lg text-muted-foreground">
            توفر المنصة محتوى تعليميًا منظمًا، وبنك امتحانات وملفات، وأدوات بحث متقدمة، وخدمات خاصة
            للأعضاء والمدارس لدعم العملية التعليمية من مكان واحد.
          </p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full flex flex-col">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-4`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border flex-col items-stretch gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نظام الاشتراك</span>
                    <span className="font-bold text-primary">{service.price}</span>
                  </div>
                  <Link href="/contact">
                    <Button className="w-full" rightIcon={<ArrowLeft className="w-4 h-4" />}>
                      اطلب الخدمة
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl gradient-bg p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">لم تجد الخدمة التعليمية التي تبحث عنها؟</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            يمكنك التواصل معنا لطلب ملفات خاصة، أو باقات للمدارس والمراكز التعليمية، أو اقتراح خدمات
            جديدة تناسب احتياجاتك التعليمية.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              rightIcon={<ArrowLeft className="w-5 h-5" />}
            >
              تواصل معنا
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

