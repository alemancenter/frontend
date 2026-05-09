'use client';

import ResponsiveAd from './ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';

interface ArticleAdsProps {
  adSettings: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
  position: 'content-mid' | 'content-bottom' | 'top' | 'sidebar-bottom';
}

/**
 * Article Ads Component
 * - Shows appropriate ad based on position (content-mid/top = slot 1, content-bottom/sidebar-bottom = slot 2)
 * - Delegates to ResponsiveAd for responsive rendering and policy compliance
 */
export default function ArticleAds({ adSettings, position }: ArticleAdsProps) {
  const settings = useFrontSettings();
  const adClient = (settings?.adsense_client || '').toString();

  const usePrimarySlot = position === 'top' || position === 'content-mid';
  const desktopCode = usePrimarySlot ? adSettings.googleAdsDesktop : adSettings.googleAdsDesktop2;
  const mobileCode = usePrimarySlot ? adSettings.googleAdsMobile : adSettings.googleAdsMobile2;

  return (
    <ResponsiveAd
      adClient={adClient}
      desktopCode={desktopCode || undefined}
      mobileCode={mobileCode || undefined}
      className={position === 'content-mid' ? 'my-8' : position === 'content-bottom' ? 'mt-10 mb-2' : position === 'top' ? 'mb-6' : ''}
    />
  );
}
