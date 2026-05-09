'use client';

import Script from 'next/script';

type Props = {
  gaId?: string | null;
};

/**
 * Google Analytics — GCM Advanced Mode.
 *
 * The script loads after the page's critical work. Data collection is gated by
 * the consent signals set in
 * layout.tsx <head>: analytics_storage defaults to "denied" and only becomes
 * "granted" after CookieYes fires gtag('consent','update',{...}).
 * No _ga / _gid cookies are written while analytics_storage is denied.
 */
export default function GoogleAnalytics({ gaId }: Props) {
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
