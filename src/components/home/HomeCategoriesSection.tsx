'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from '@/components/common/AppImage';
import {
  Atom,
  BookMarked,
  BookOpen,
  Brain,
  Calculator,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Layers,
  Library,
  Lightbulb,
  Microscope,
  Newspaper,
  PenTool,
  School,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion } from '@/lib/motion-lite';
import { getStorageUrl } from '@/lib/utils';
import type { Category } from '@/types';
import type { HomeCountry } from './HomeTypes';

type HomeCategoriesSectionProps = {
  country: HomeCountry;
  categories?: Category[];
};

const gradients = [
  'from-blue-600 to-cyan-500',
  'from-purple-600 to-pink-500',
  'from-emerald-600 to-teal-500',
  'from-amber-500 to-orange-600',
  'from-rose-600 to-red-500',
];

const lucideIconMap: Record<string, LucideIcon> = {
  Atom,
  BookMarked,
  BookOpen,
  Brain,
  Calculator,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Layers,
  Library,
  Lightbulb,
  Microscope,
  Newspaper,
  PenTool,
  School,
  Star,
  Trophy,
  Users,
  book: BookOpen,
  category: FolderOpen,
  exam: FileQuestion,
  lesson: BookMarked,
  post: Newspaper,
  subject: School,
};

function toPascalCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveLucideIcon(icon?: string): LucideIcon | null {
  const iconName = icon?.trim();
  if (!iconName || iconName.includes('/')) return null;

  return lucideIconMap[iconName] || lucideIconMap[toPascalCase(iconName)] || null;
}

function CategoryVisual({ category, gradient }: { category: Category; gradient: string }) {
  const IconComponent = resolveLucideIcon(category.icon);

  if (IconComponent) {
    return (
      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
        <IconComponent className="w-8 h-8" />
      </div>
    );
  }

  if (category.icon_image_url) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={getStorageUrl(category.icon_image_url) || ''}
          alt=""
          fill
          sizes="64px"
          className="object-contain"
        />
      </div>
    );
  }

  if (category.icon_url || (category.icon && category.icon.includes('/'))) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={getStorageUrl(category.icon_url || category.icon) || ''}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
      <BookOpen className="w-7 h-7" />
    </div>
  );
}

export default function HomeCategoriesSection({ country, categories }: HomeCategoriesSectionProps) {
  const parentCategories = useMemo(() => categories?.filter((category) => !category.parent_id).slice(0, 9) || [], [categories]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories
      ?.filter((category) => category.parent_id)
      .forEach((category) => {
        const parentId = category.parent_id!;
        const list = map.get(parentId) || [];
        list.push(category);
        map.set(parentId, list);
      });
    return map;
  }, [categories]);

  if (!categories?.length || !parentCategories.length) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.4] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight"
          >
            الأقسام <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">التعليمية</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg"
          >
            اختر القسم المناسب لاستكشاف جميع المواد الدراسية والملفات المرتبطة به
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {parentCategories.map((category, index) => {
            const children = childrenByParent.get(category.id) || [];
            const gradient = gradients[index % gradients.length];

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group h-full"
              >
                <div className="block h-full relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden">
                  <Link href={`/${country.code}/posts/category/${category.id}`} className="absolute inset-0 z-0" aria-label={category.name} />

                  <div className="h-32 w-full relative overflow-hidden bg-slate-50 pointer-events-none">
                    {category.image_url ? (
                      <Image
                        src={getStorageUrl(category.image_url) || ''}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  </div>

                  <div className="absolute top-20 right-6 pointer-events-none">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-slate-200/50 p-3 flex items-center justify-center border border-slate-50 group-hover:scale-110 transition-transform duration-300">
                      <CategoryVisual category={category} gradient={gradient} />
                    </div>
                  </div>

                  <div className="pt-8 px-6 pb-6 pointer-events-none">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                        <span>الفروع المتاحة</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{children.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pointer-events-auto relative z-10">
                        {children.slice(0, 3).map((child) => (
                          <Link
                            key={child.id}
                            href={`/${country.code}/posts/category/${child.id}`}
                            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                        {children.length > 3 && (
                          <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-xs">+{children.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
