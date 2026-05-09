'use client';

import { motion } from '@/lib/motion-lite';
import { Code2, Palette, Smartphone, Globe, Database, Shield } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

const services = [
  {
    icon: Code2,
    title: 'تطوير الويب',
    description: 'نبني مواقع وتطبيقات ويب متطورة باستخدام أحدث التقنيات',
    features: ['React & Next.js', 'Node.js & Express', 'قواعد بيانات متقدمة'],
    color: 'bg-blue-500',
  },
  {
    icon: Smartphone,
    title: 'تطبيقات الموبايل',
    description: 'تطوير تطبيقات أصلية وهجينة لـ iOS و Android',
    features: ['React Native', 'Flutter', 'تصميم UX/UI'],
    color: 'bg-green-500',
  },
  {
    icon: Palette,
    title: 'التصميم الإبداعي',
    description: 'نصمم هويات بصرية فريدة وواجهات مستخدم جذابة',
    features: ['تصميم UI/UX', 'الهوية البصرية', 'موشن جرافيك'],
    color: 'bg-purple-500',
  },
  {
    icon: Globe,
    title: 'التسويق الرقمي',
    description: 'استراتيجيات تسويق فعالة لزيادة الوصول والمبيعات',
    features: ['SEO', 'إعلانات مدفوعة', 'التسويق بالمحتوى'],
    color: 'bg-orange-500',
  },
  {
    icon: Database,
    title: 'الحوسبة السحابية',
    description: 'حلول سحابية آمنة وقابلة للتوسع',
    features: ['AWS & Azure', 'DevOps', 'CI/CD'],
    color: 'bg-cyan-500',
  },
  {
    icon: Shield,
    title: 'الأمن السيبراني',
    description: 'حماية بياناتك وأنظمتك من التهديدات الإلكترونية',
    features: ['اختبار الاختراق', 'التشفير', 'مراقبة الأمان'],
    color: 'bg-red-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section className="py-20 bg-muted/50" id="services">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium">خدماتنا</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            حلول رقمية <span className="gradient-text">متكاملة</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نقدم مجموعة شاملة من الخدمات الرقمية المصممة لتلبية احتياجات عملك
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card hover className="h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full ${service.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

