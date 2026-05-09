'use client';

import { ReactNode, useEffect, useState } from 'react';
import ResponsiveAd from '@/components/ads/ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';

type SemesterListWrapperProps = {
  children: ReactNode;
  hasContent: boolean;
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
};

export default function SemesterListWrapper({ children, hasContent, adSettings }: SemesterListWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const settings = useFrontSettings();
  const adClient = (settings?.adsense_client || '').toString();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {children}

      {isMounted && hasContent && (
        <div className="mt-8">
          <ResponsiveAd
            adClient={adClient}
            desktopCode={adSettings?.googleAdsDesktop || undefined}
            mobileCode={adSettings?.googleAdsMobile || undefined}
          />
        </div>
      )}
    </>
  );
}
