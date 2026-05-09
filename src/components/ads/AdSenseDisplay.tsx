'use client';

import ResponsiveAd from './ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';

interface AdSenseDisplayProps {
  slotType: 'download_top' | 'download_sidebar';
  className?: string;
}

/**
 * AdSense Display for Download Pages
 * - Resolves mobile/desktop slots from public settings
 * - Delegates to ResponsiveAd for proper rendering and compliance
 */
const AdSenseDisplay = ({ slotType, className = '' }: AdSenseDisplayProps) => {
  const settings = useFrontSettings();

  const desktopKey =
    slotType === 'download_top' ? 'google_ads_desktop_download' : 'google_ads_desktop_download_2';
  const mobileKey =
    slotType === 'download_top' ? 'google_ads_mobile_download' : 'google_ads_mobile_download_2';

  const adClient = (settings?.adsense_client || '').toString();
  const desktopCode = (settings?.[desktopKey] || '').toString();
  const mobileCode = (settings?.[mobileKey] || '').toString();

  return (
    <ResponsiveAd
      adClient={adClient}
      desktopCode={desktopCode || undefined}
      mobileCode={mobileCode || undefined}
      className={className}
    />
  );
};

export default AdSenseDisplay;
