'use client';

import Link from 'next/link';
import { Info, UserPlus } from 'lucide-react';
import { motion } from '@/lib/motion-lite';
import type { HomeCountry } from './HomeTypes';

type HomeHeroProps = {
  country: HomeCountry;
  siteName: string;
  showHeroButtons: boolean;
};

export default function HomeHero({ country, siteName, showHeroButtons }: HomeHeroProps) {
  return (
    <section
      className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 overflow-hidden"
      style={{ background: 'linear-gradient(226deg, #202c45 0%, #286aad 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

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
            منصة{' '}
            <span className="text-[#3498db] inline-block relative">
              {siteName}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#3498db]/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>{' '}
            التعليمية للمنهاج الدراسي في {country.name}
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light">
            منصتك التعليمية الشاملة في {country.name}. اكتشف الدروس، الامتحانات، والخطط الدراسية بسهولة.
          </p>

          {showHeroButtons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-tr from-[#3498db] to-[#2980b9] rounded-full text-white font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  ابدأ الآن مجاناً
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>

              <Link
                href="#features"
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Info className="w-5 h-5" />
                المزيد عنا
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+2px)] -ml-[1px] h-[60px] md:h-[100px]"
          shapeRendering="geometricPrecision"
        >
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            className="fill-[#f8f9fa]"
          />
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            className="fill-white/10"
            transform="translate(0,6)"
          />
        </svg>
      </div>
    </section>
  );
}
