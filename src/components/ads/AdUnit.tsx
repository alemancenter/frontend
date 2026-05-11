'use client';

import { useEffect, useRef } from 'react';
import type { AdSlotConfig } from '@/lib/adsense';
import { initializeAdSlots } from '@/lib/adsense';

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
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tryInit = () => {
      if (!hasCkyConsent('advertisement')) return;
      if (cleanupRef.current) return; // already initialized
      cleanupRef.current = initializeAdSlots(container) ?? null;
    };

    // Attempt immediately (returning visitors who already accepted)
    tryInit();

    // Re-attempt when CookieYes fires a consent update (first-time visitors)
    const onConsentUpdate = () => tryInit();
    window.addEventListener('ckyConsentUpdate', onConsentUpdate);

    return () => {
      window.removeEventListener('ckyConsentUpdate', onConsentUpdate);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
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
