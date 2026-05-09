'use client';

import Link from 'next/link';
import { motion } from '@/lib/motion-lite';
import { UserPlus, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';

interface SubjectHeaderProps {
  subjectName: string;
}

export default function SubjectHeader({ subjectName }: SubjectHeaderProps) {
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
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-8"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              {subjectName}
            </motion.h2>

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
                  className="inline-flex items-center px-8 py-3 rounded-lg text-white font-medium transition-transform hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(45deg, #3498db, #2980b9)',
                    boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
                  }}
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

      {/* Wave Shape Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: '60px' }}>
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          style={{ width: '100%', height: '60px', transform: 'rotate(180deg)' }}
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            fill="#ffffff" 
          />
        </svg>
      </div>
    </section>
  );
}

