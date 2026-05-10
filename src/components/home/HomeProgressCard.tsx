'use client';

import Link from 'next/link';
import { ChevronLeft, Home as HomeIcon } from 'lucide-react';
import { motion } from '@/lib/motion-lite';
import type { HomeCountry } from './HomeTypes';

export default function HomeProgressCard({ country }: { country: HomeCountry }) {
  return (
    <div className="container mx-auto px-4 -mt-8 relative z-20 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Link href="/" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <HomeIcon className="w-4 h-4" />
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{country.name}</span>
          </nav>
          <div className="text-xs font-semibold text-slate-600">مستوى التقدم: 25%</div>
        </div>

        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '25%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
