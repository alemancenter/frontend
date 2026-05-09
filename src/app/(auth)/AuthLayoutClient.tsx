'use client';

import Link from 'next/link';
import { motion } from '@/lib/motion-lite';

export default function AuthLayoutClient({
  children,
  siteName,
}: {
  children: React.ReactNode;
  siteName: string;
}) {
  const resolvedName = siteName?.trim() ? siteName.trim() : '';
  const initial = resolvedName.trim().charAt(0).toUpperCase() || 'R';

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center"
            >
              <span className="text-white font-bold text-xl">{initial}</span>
            </motion.div>
            <span className="text-xl font-bold gradient-text">{resolvedName}</span>
          </Link>

          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 mx-auto">
              <span className="text-5xl font-bold">{initial}</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">مرحباً بك في {resolvedName}</h2>
            <p className="text-white/80 max-w-md">
              انضم إلى آلاف المستخدمين الذين يثقون بنا لتحويل أفكارهم إلى واقع رقمي مبتكر
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-8"
          >
            {[
              { value: '500+', label: 'مشروع' },
              { value: '150+', label: 'عميل' },
              { value: '99%', label: 'رضا' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

