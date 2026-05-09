'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSettingsStore, useAuthStore } from '@/store/useStore';
import type { HomeContentProps } from './HomeTypes';
import HomeHero from './HomeHero';
import HomeProgressCard from './HomeProgressCard';
import HomeClassesSection from './HomeClassesSection';
import HomeSearchCard from './HomeSearchCard';
import HomeCategoriesSection from './HomeCategoriesSection';
import HomeEditorialSection from './HomeEditorialSection';
import { HomeCalendarSkeleton } from './HomeCalendarWidget';

const HomeCalendarWidget = dynamic(() => import('./HomeCalendarWidget'), {
  ssr: false,
  loading: () => <HomeCalendarSkeleton />,
});

export default function HomeContent({
  country,
  classes,
  categories,
  articles,
  posts,
  featuredPosts,
  initialSiteName,
  isLoggedIn = false,
  adSettings,
}: HomeContentProps) {
  const { siteName } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const showHeroButtons = !isLoggedIn && !isAuthenticated;
  const resolvedSiteName = (initialSiteName || siteName || 'منصة التعليم').toString().trim();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans">
      <HomeHero country={country} siteName={resolvedSiteName} showHeroButtons={showHeroButtons} />
      <HomeProgressCard country={country} />

      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <HomeClassesSection country={country} classes={classes} mounted={isMounted} adSettings={adSettings} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <HomeCalendarWidget country={country} />
            <HomeSearchCard />
          </div>
        </div>
      </div>

      <HomeEditorialSection
        country={country}
        articles={articles}
        posts={posts}
        featuredPosts={featuredPosts}
        mounted={isMounted}
        adSettings={adSettings}
      />

      <HomeCategoriesSection country={country} categories={categories} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
