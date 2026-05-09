'use client';

import { useState, useEffect } from 'react';
import AdUnit from './AdUnit';
import { parseAdSlotConfig } from '@/lib/adsense';

interface ResponsiveAdProps {
  desktopCode?: string;
  mobileCode?: string;
  adClient: string;
  className?: string;
}

/**
 * Responsive AdSense Ad Component
 *
 * IMPORTANT: Only ONE <ins class="adsbygoogle"> element is rendered at a time.
 * Google's push({}) processes <ins> elements in DOM order. If we render both
 * a hidden desktop and visible mobile <ins>, push({}) would fill the hidden
 * desktop slot (first in DOM) instead of the visible mobile one.
 *
 * Uses matchMedia to detect viewport and render only the correct ad slot.
 */
export default function ResponsiveAd({
  desktopCode,
  mobileCode,
  adClient,
  className = '',
}: ResponsiveAdProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const desktopConfig = desktopCode ? parseAdSlotConfig(desktopCode) : null;
  const mobileConfig = mobileCode ? parseAdSlotConfig(mobileCode) : null;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!desktopConfig && !mobileConfig) return null;

  if (isDesktop === null) {
    return (
      <div
        className={`ad-wrapper relative rounded-2xl border border-gray-100 bg-gray-50 p-4 ${className}`}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="min-h-[100px]" />
      </div>
    );
  }

  const config = isDesktop ? desktopConfig : mobileConfig;
  if (!config) return null;

  return (
    <div
      className={`ad-wrapper relative rounded-2xl border border-gray-100 bg-gray-50 p-4 ${className}`}
      role="complementary"
      aria-label="Advertisement"
    >
      <span className="ad-label block text-xs text-gray-400 mb-2 text-center font-medium select-none">إعلان</span>
      <div className="min-h-[100px]">
        <AdUnit config={config} adClient={adClient} />
      </div>
    </div>
  );
}
