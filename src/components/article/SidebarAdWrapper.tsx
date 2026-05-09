'use client';

import ArticleAds from '@/components/ads/ArticleAds';

interface SidebarAdWrapperProps {
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
  children?: React.ReactNode;
}

/**
 * Sidebar Ad Wrapper
 * - Shows one ad at the bottom of sidebar
 */
export default function SidebarAdWrapper({ adSettings, children }: SidebarAdWrapperProps) {
  const hasBottomAd = !!(adSettings?.googleAdsDesktop2 || adSettings?.googleAdsMobile2);

  return (
    <div className="lg:col-span-4 space-y-8">
      {/* Sidebar content (Related Articles, etc.) */}
      {children}

      {/* Bottom Sidebar Ad */}
      {hasBottomAd && adSettings && (
        <div className="mt-8">
          <ArticleAds adSettings={adSettings} position="sidebar-bottom" />
        </div>
      )}
    </div>
  );
}
