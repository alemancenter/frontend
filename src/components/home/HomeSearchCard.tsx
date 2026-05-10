'use client';

import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import QuickSearch from '@/components/search/QuickSearch';

export default function HomeSearchCard() {
  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border p-6 relative overflow-hidden text-foreground">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg">بحث سريع</h3>
          </div>
        </div>

        <QuickSearch showTitle={false} className="shadow-none border-0 p-0 bg-transparent" />

        <div className="mt-6 pt-4 border-t border-border flex justify-center">
          <Link
            href="/search"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors border border-primary/40 px-4 py-2 rounded-full hover:bg-primary/10"
          >
            <span>بحث متقدم</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
