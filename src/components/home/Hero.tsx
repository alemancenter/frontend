'use client';

import { motion } from '@/lib/motion-lite';
import Link from 'next/link';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Hero() {
  const pr = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const floaters = Array.from({ length: 6 }, (_, i) => ({
    top: 20 + pr(i * 3.1415) * 60,
    left: 10 + pr(i * 2.7182) * 80,
    duration: 3 + pr(i * 1.618) * 2,
    accent: i % 2 === 0,
    delay: 0.5 + i * 0.1,
    wobbleDelay: i * 0.2,
  }));

  return (
    <section className="min-h-screen relative overflow-hidden flex items-center pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-right"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>منصة رقمية متكاملة</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              نحوّل أفكارك إلى{' '}
              <span className="gradient-text">واقع رقمي</span>{' '}
              مبتكر
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 lg:mr-0"
            >
              نقدم حلولاً تقنية متكاملة تساعدك على النمو والتطور في العالم الرقمي.
              من التصميم إلى التطوير، نحن شريكك المثالي.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/contact">
                <Button size="lg" rightIcon={<ArrowLeft className="w-5 h-5" />}>
                  ابدأ الآن
                </Button>
              </Link>
              <Button variant="outline" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                شاهد الفيديو
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-border"
            >
              {[
                { value: '500+', label: 'مشروع منجز' },
                { value: '150+', label: 'عميل سعيد' },
                { value: '10+', label: 'سنوات خبرة' },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-right">
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Circle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
              />

              {/* Inner Circle */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-8 rounded-full border-2 border-dashed border-accent/30"
              />

              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-64 h-64 rounded-3xl gradient-bg shadow-2xl shadow-primary/30 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="text-6xl font-bold mb-2">R</div>
                    <div className="text-sm opacity-80">المنصة التعليمية</div>
                  </div>
                </motion.div>
              </div>

              {/* Floating Elements */}
              {floaters.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: f.delay }}
                  style={{
                    position: 'absolute',
                    top: `${f.top}%`,
                    left: `${f.left}%`,
                  }}
                >
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: f.duration,
                      repeat: Infinity,
                      delay: f.wobbleDelay,
                    }}
                    className={`w-12 h-12 rounded-xl ${f.accent ? 'bg-primary/20' : 'bg-accent/20'} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${f.accent ? 'bg-primary' : 'bg-accent'}`} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

