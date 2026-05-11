'use client';

import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { motion, type Variants } from '@/lib/motion-lite';
import { Category } from '@/types';
import { Folder, Sparkles, ArrowLeft, Hash } from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';

interface CategoriesSectionProps {
  categories: Category[];
  countryCode: string;
}

export default function CategoriesSection({ categories, countryCode }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) return null;

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
  };

  // Modern gradient colors for cards
  const gradients = [
    'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20',
    'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20',
    'from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20',
    'from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20',
    'from-cyan-500/10 to-sky-500/10 hover:from-cyan-500/20 hover:to-sky-500/20',
  ];

  const iconColors = [
    'text-blue-600 bg-blue-100',
    'text-emerald-600 bg-emerald-100',
    'text-orange-600 bg-orange-100',
    'text-purple-600 bg-purple-100',
    'text-cyan-600 bg-cyan-100',
  ];

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>الأقسام</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight"
          >
            أقسام <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">المحتوى</span>
          </motion.h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {categories.map((category, index) => {
            const gradientClass = gradients[index % gradients.length];
            const iconColorClass = iconColors[index % iconColors.length];

            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Link href={`/${countryCode}/posts/category/${category.id}`} className="block h-full">
                  <div className={`
                    group h-full relative overflow-hidden rounded-3xl p-6
                    bg-white border border-gray-100
                    hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1
                    transition-all duration-300 ease-out
                  `}>
                    {/* Hover Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconColorClass} group-hover:scale-110 transition-transform duration-300 shadow-sm overflow-hidden relative`}>
                          {(category.icon_image_url ?? category.icon_image ?? category.icon_url) ? (
                             <Image
                               src={getStorageUrl(category.icon_image_url ?? category.icon_image ?? category.icon_url) || ''}
                               alt={category.name}
                               fill
                               sizes="56px"
                               className="object-contain"
                             />
                          ) : (
                            <Folder className="w-7 h-7" />
                          )}
                        </div>
                        
                        {category.news_count !== undefined && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-semibold text-gray-500 group-hover:bg-white/80 transition-colors">
                            <Hash className="w-3 h-3" />
                            {category.news_count}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {category.name}
                      </h3>

                      <div className="mt-auto flex items-center text-sm font-semibold text-blue-600 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <span>عرض القسم</span>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

