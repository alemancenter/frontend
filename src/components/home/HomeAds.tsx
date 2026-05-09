'use client';

import ResponsiveAd from '@/components/ads/ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';
import type { HomeAdSettings } from './HomeTypes';

type HomeAdsProps = {
  adSettings?: HomeAdSettings;
  slot: 'primary' | 'secondary';
  mounted: boolean;
  className?: string;
};

export default function HomeAds({ adSettings, slot, mounted, className }: HomeAdsProps) {
  const settings = useFrontSettings();
  const adClient = (settings?.adsense_client || '').toString();

  if (!mounted) return null;

  const desktopCode = slot === 'primary' ? adSettings?.googleAdsDesktop : adSettings?.googleAdsDesktop2;
  const mobileCode = slot === 'primary' ? adSettings?.googleAdsMobile : adSettings?.googleAdsMobile2;

  if (!desktopCode && !mobileCode) return null;

  return (
    <div className={className}>
      <ResponsiveAd
        adClient={adClient}
        desktopCode={desktopCode || undefined}
        mobileCode={mobileCode || undefined}
      />
    </div>
  );
}
