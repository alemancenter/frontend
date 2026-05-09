'use client';

import { useEffect, useRef } from 'react';
import type { AdSlotConfig } from '@/lib/adsense';
import { initializeAdSlots } from '@/lib/adsense';

/**
 * Returns true only when CookieYes has granted consent for `category`.
 * Denies by default: if CookieYes failed to load, or consent state is unknown,
 * ads are blocked rather than running without authorisation.
 */
function hasCkyConsent(category: string): boolean {
  const win = window as Window & {
    getCkyConsent?: () => { categories?: { accepted?: string[] } };
  };
  if (typeof win.getCkyConsent !== 'function') return false;
  return win.getCkyConsent()?.categories?.accepted?.includes(category) ?? false;
}

interface AdUnitProps {
  config: AdSlotConfig;
  adClient: string;
  className?: string;
}

export default function AdUnit({ config, adClient, className = '' }: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!hasCkyConsent('advertisement')) return;
    return initializeAdSlots(container);
  }, [config.ad_slot, adClient]);

  if (!config.ad_slot || !adClient) return null;

  return (
    <div ref={containerRef} className={`ad-unit ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={config.ad_slot}
        data-ad-format={config.format}
        data-full-width-responsive={String(config.responsive)}
      />
    </div>
  );
}
