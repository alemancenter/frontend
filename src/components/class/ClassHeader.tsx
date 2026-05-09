'use client';

import Link from 'next/link';
import { motion } from '@/lib/motion-lite';
import { UserPlus, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';

interface ClassHeaderProps {
  title: string;
}

export default function ClassHeader({ title }: ClassHeaderProps) {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900/80">
      {/* Background Pattern */}
      <div className="absolute w-full h-full top-0 left-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/10" />

      {/* Animated Shapes */}
      <div 
        className="absolute rounded-full w-72 h-72 -top-36 -right-36 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20"
      />
      <div 
        className="absolute rounded-full w-48 h-48 -bottom-24 -left-24 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-center">
          <div className="w-full lg:w-2/3 text-center">
            {/* Main Title */}
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-8 break-words whitespace-normal leading-relaxed px-4 bidi-plaintext"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              dir="auto"
            >
              {title}
            </motion.h1>

            {/* Call to Action Buttons (Guests Only) */}
            {!isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-8 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  <UserPlus className="w-5 h-5 ml-2" />
                  ابدأ الآن
                </Link>
                <Link 
                  href="#learn-more" 
                  className="inline-flex items-center px-8 py-3 rounded-lg border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  <Info className="w-5 h-5 ml-2" />
                  المزيد من المعلومات
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Wave Shape Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: '80px' }}>
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          style={{ width: '100%', height: '80px', transform: 'rotate(180deg)' }}
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            className="fill-white/95"
          />
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            className="fill-white/80"
          />
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-white/60"
          />
        </svg>
      </div>
    </section>
  );
}

