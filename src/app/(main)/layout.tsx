import Script from 'next/script';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { getFrontSettings } from '@/lib/front-settings';

const ADSENSE_CLIENT_RE = /^ca-pub-\d+$/;

function resolveAdsenseClient(settings: Record<string, string | null>): string {
  const value = (settings.adsense_client || process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '')
    .toString()
    .trim();
  return ADSENSE_CLIENT_RE.test(value) ? value : '';
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = await getFrontSettings();
  const adsenseClient = resolveAdsenseClient(initialSettings);

  const marketingFlag = process.env.NEXT_PUBLIC_ENABLE_MARKETING_TAGS;
  const marketingEnabled =
    marketingFlag === 'true' ||
    (marketingFlag !== 'false' && process.env.NODE_ENV === 'production');

  return (
    <>
      {/*
        AdSense — GCM Advanced Mode.
        Gated on marketingEnabled so the script never loads in development or
        when explicitly disabled, preventing ad network connections before
        a valid Consent Mode default has been established.
        strategy="afterInteractive" ensures CookieYes (beforeInteractive) has
        already fired its consent update before AdSense reads the signals.
      */}
      {marketingEnabled && adsenseClient && (
        <>
          <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
          <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
          <Script
            id="adsense-loader"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        </>
      )}
      <Navbar initialSettings={initialSettings} />
      <main className="min-h-screen">{children}</main>
      <Footer initialSettings={initialSettings} />
    </>
  );
}
