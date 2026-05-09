'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-lg">
            404
          </div>
          
          <motion.h1 
            className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            الصفحة غير موجودة
          </motion.h1>
          
          <motion.p 
            className="text-slate-600 dark:text-slate-300 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
            قد تكون الصفحة قد تم نقلها أو حذفها.
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للخلف
          </Button>
          
          <Link href="/" className="flex-1">
            <Button className="w-full flex items-center gap-2">
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            اقتراحات للبحث
          </h3>
          
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 text-right">
            <li>• تحقق من كتابة العنوان بشكل صحيح</li>
            <li>• جرب استخدام محرك البحث</li>
            <li>• انتقل إلى الصفحة الرئيسية واستكشف الموقع</li>
            <li>• تحقق من القوائم العلوية للتنقل</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
