'use client';

import { ReactNode, useState, useEffect } from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import ResponsiveAd from '@/components/ads/ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';

interface SubjectsListWrapperProps {
  children: ReactNode;
  hasContent?: boolean;
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
}

export default function SubjectsListWrapper({ children, hasContent = true, adSettings }: SubjectsListWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const settings = useFrontSettings();
  const adClient = (settings?.adsense_client || '').toString();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/* First Ad Position - Below breadcrumb / above subjects */}
      {isMounted && hasContent && (
        <AnimatedSection delay={0.15}>
          <div className="mb-8">
            <ResponsiveAd
              adClient={adClient}
              desktopCode={adSettings?.googleAdsDesktop || undefined}
              mobileCode={adSettings?.googleAdsMobile || undefined}
            />
          </div>
        </AnimatedSection>
      )}

      {/* Subjects List Content (passed as children from Server Component) */}
      {children}

      {/* Second Ad Position - After subjects list */}
      {isMounted && hasContent && (
        <AnimatedSection delay={0.4}>
          <div className="mt-8">
            <ResponsiveAd
              adClient={adClient}
              desktopCode={adSettings?.googleAdsDesktop2 || undefined}
              mobileCode={adSettings?.googleAdsMobile2 || undefined}
            />
          </div>
        </AnimatedSection>
      )}
    </>
  );
}
