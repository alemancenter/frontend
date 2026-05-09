'use client';

import Link from 'next/link';
import { ArrowLeft, School } from 'lucide-react';
import type { SchoolClass } from '@/types';
import type { HomeAdSettings, HomeCountry } from './HomeTypes';
import HomeAds from './HomeAds';

const classAccents = [
  'border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300',
  'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300',
  'border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300',
  'border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300',
  'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 hover:border-rose-300',
  'border-cyan-200 text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100 hover:border-cyan-300',
];

type HomeClassesSectionProps = {
  country: HomeCountry;
  classes: SchoolClass[];
  mounted: boolean;
  adSettings?: HomeAdSettings;
};

export default function HomeClassesSection({ country, classes, mounted, adSettings }: HomeClassesSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <School className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الصفوف الدراسية</h2>
          <p className="text-slate-500 text-sm">اختر صفك للوصول إلى المحتوى</p>
        </div>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.map((schoolClass, index) => {
            const style = classAccents[index % classAccents.length];
            return (
              <Link
                key={schoolClass.id}
                href={`/${country.code}/lesson/${schoolClass.id}`}
                className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${style}`}
              >
                <span className="font-bold text-lg group-hover:scale-105 transition-transform">{schoolClass.grade_name}</span>
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
            <School className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">لا توجد صفوف متاحة حالياً</p>
        </div>
      )}

      <HomeAds mounted={mounted} adSettings={adSettings} slot="primary" className="mt-8" />
    </div>
  );
}
