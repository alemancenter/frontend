'use client';

import { motion } from '@/lib/motion-lite';
import { Check, Zap, HeartHandshake, Award, Users } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'سرعة التنفيذ',
    description: 'نلتزم بالمواعيد النهائية ونسلم المشاريع في الوقت المحدد',
  },
  {
    icon: Award,
    title: 'جودة عالية',
    description: 'نستخدم أفضل الممارسات وأحدث التقنيات لضمان جودة العمل',
  },
  {
    icon: HeartHandshake,
    title: 'دعم مستمر',
    description: 'نقدم دعماً فنياً متواصلاً بعد تسليم المشروع',
  },
  {
    icon: Users,
    title: 'فريق متخصص',
    description: 'فريقنا يضم خبراء في مختلف مجالات التقنية',
  },
];

export default function Features() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary font-medium">لماذا نحن؟</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
              نتميز بتقديم <span className="gradient-text">حلول مبتكرة</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              نحن نؤمن بأن النجاح يأتي من خلال الشراكة الحقيقية مع عملائنا.
              نستمع لاحتياجاتك ونعمل معك لتحقيق أهدافك.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Background shapes */}
              <div className="absolute inset-0 rounded-3xl gradient-bg opacity-20 blur-2xl" />

              {/* Main content */}
              <div className="relative h-full rounded-3xl bg-card border border-border p-8 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-2xl gradient-bg mx-auto flex items-center justify-center mb-4"
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">+500</h3>
                  <p className="text-muted-foreground">مشروع ناجح</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '99%', label: 'رضا العملاء' },
                    { value: '24/7', label: 'دعم فني' },
                    { value: '150+', label: 'عميل نشط' },
                    { value: '10+', label: 'سنوات خبرة' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className="bg-muted rounded-xl p-4 text-center"
                    >
                      <div className="text-xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

