import type { Metadata } from 'next';
import Script from 'next/script';
import { Cairo } from 'next/font/google';
import './globals.css';
import ToastProvider from '@/components/ui/ToastProvider';
import ThemeInitializer from '@/components/ThemeInitializer';
import ResourcePreloader from '@/components/common/ResourcePreloader';
import { getStorageUrl } from '@/lib/utils';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { getFrontSettings } from '@/lib/front-settings';
import { FrontSettingsProvider } from '@/components/front-settings/FrontSettingsProvider';
import StoreHydration from '@/components/StoreHydration';

// Cairo font - Arabic optimized, loaded via Next.js for better performance
const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
  adjustFontFallback: true,
});

async function getPublicSettings(): Promise<Record<string, string | null>> {
  return getFrontSettings();
}

const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d+$/;

const resolveAdsenseClient = (settings: Record<string, string | null>): string => {
  const value = (settings.adsense_client || process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '')
    .toString()
    .trim();
  return ADSENSE_CLIENT_PATTERN.test(value) ? value : '';
};

const toPublicStorageUrl = (value?: string | null): string | undefined => {
  const raw = (value || '').toString().trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      // Normalize backend storage absolute URLs to relative /storage/... paths
      // so the Next.js rewrite proxies them via the internal URL (survives domain renames).
      if (url.pathname.startsWith('/storage/')) return url.pathname;
    } catch {
      // fall through
    }
    return raw;
  }
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return normalized.startsWith('/storage/') ? normalized : `/storage${normalized}`;
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = (settings.site_name || (settings as any).siteName || '').toString().trim();

  const normalizeBaseUrl = (value: string | null | undefined): URL | undefined => {
    const trimmed = (value || '').toString().trim();
    if (!trimmed) return undefined;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(withProtocol);
    } catch {
      return undefined;
    }
  };

  const parseKeywords = (value: string | null | undefined): string[] | undefined => {
    const raw = (value || '').toString().trim();
    if (!raw) return undefined;
    const items = raw
      .split(/[,،\n\r]+/g)
      .map((k) => k.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  };

  const metaTitle = (settings.meta_title || '').toString().trim();
  const metaDescription = (settings.meta_description || settings.site_description || '').toString().trim();
  const metaKeywords = parseKeywords(settings.meta_keywords);
  const canonicalUrl = (settings.canonical_url || settings.site_url || '').toString().trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const metadataBase = normalizeBaseUrl(canonicalUrl) || new URL(appUrl);
  const ogImage = getStorageUrl(settings.site_logo || settings.site_favicon);
  const faviconUrl = toPublicStorageUrl(settings.site_favicon);
  const faviconFallback = '/favicon.ico';
  const iconList = [
    { url: faviconFallback },
    ...(faviconUrl && faviconUrl !== faviconFallback ? [{ url: faviconUrl }] : []),
  ];

  return {
    metadataBase,
    title: metaTitle || siteName || 'منصة التعليم - أخبار ومناهج ونتائج الامتحانات',
    description:
      metaDescription ||
      'المنصة التعليمية الرائدة للأخبار التربوية، المناهج الدراسية، نتائج الامتحانات، والملفات التعليمية للمعلمين والطلاب في الأردن والدول العربية.',
    keywords:
      metaKeywords || ['تعليم', 'أخبار التعليم', 'نتائج الامتحانات', 'مناهج', 'دروس', 'ملفات تعليمية', 'الأردن', 'طلاب', 'معلمين', 'وزارة التربية والتعليم'],
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    icons: {
      icon: iconList,
      shortcut: faviconFallback,
      apple: faviconUrl || faviconFallback,
    },
    openGraph: {
      title: metaTitle || siteName || 'منصة التعليم - أخبار ومناهج ونتائج الامتحانات',
      description:
        metaDescription ||
        'المنصة التعليمية الرائدة للأخبار التربوية، المناهج الدراسية، نتائج الامتحانات، والملفات التعليمية للمعلمين والطلاب في الأردن والدول العربية.',
      type: 'website',
      locale: 'ar_JO',
      siteName: siteName || undefined,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings();
  const gaId =
    (settings.google_analytics_id || settings.google_analytics || '').toString().trim() ||
    (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '').toString().trim() ||
    (process.env.NEXT_PUBLIC_GA_ID || '').toString().trim();
  const normalizedAdsenseClient = resolveAdsenseClient(settings);
  const marketingFlag = process.env.NEXT_PUBLIC_ENABLE_MARKETING_TAGS;
  const marketingEnabled =
    marketingFlag === 'true' ||
    (marketingFlag !== 'false' && process.env.NODE_ENV === 'production');
  const gtmId = (process.env.NEXT_PUBLIC_GTM_ID || 'GTM-T5G89XRM').toString().trim();
  const cookieYesClientId = (
    settings.cookieyes_id ||
    process.env.NEXT_PUBLIC_COOKIEYES_CLIENT_ID ||
    ''
  ).toString().trim();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/*
          Google Consent Mode v2 — MUST be the very first script.
          Initialises dataLayer + gtag and sets all consent signals to "denied"
          before any Google tag (Analytics, AdSense) has a chance to load.
          CookieYes reads this and calls gtag('consent','update',{...}) once
          the user makes a choice, satisfying GCM's "Consent tab" requirement.
          wait_for_update:500 gives CookieYes 500 ms to fire the update before
          Google tags act on the default denied state.
        */}
        {marketingEnabled && (
          <Script id="google-consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'ad_storage':'denied','analytics_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','wait_for_update':500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`}
          </Script>
        )}
        {/* Google Tag Manager */}
        {marketingEnabled && gtmId && (
          <Script id="google-tag-manager" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
        {/* Preconnect to Google Fonts - Critical for LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* AdSense ownership verification */}
        {normalizedAdsenseClient && (
          <meta name="google-adsense-account" content={normalizedAdsenseClient} />
        )}
      </head>
      <body
        className={`${cairo.className} ${cairo.variable} antialiased min-h-screen`}
      >
        {/*
          CookieYes — certified TCF v2.2 CMP
          strategy="beforeInteractive" guarantees it runs BEFORE:
            - React hydration
            - AdSense (in nested layout)
            - Google Analytics (afterInteractive)
        */}
        {marketingEnabled && cookieYesClientId && (
          <Script
            id="cookieyes"
            type="text/javascript"
            src={`https://cdn-cookieyes.com/client_data/${cookieYesClientId}/script.js`}
            strategy="beforeInteractive"
          />
        )}
        {/* Google Tag Manager (noscript) */}
        {marketingEnabled && gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <FrontSettingsProvider settings={settings}>
          <StoreHydration />
          <GoogleAnalytics gaId={marketingEnabled ? gaId : ''} />
          <ThemeInitializer />
          <ToastProvider />
          <ResourcePreloader />
          {children}
        </FrontSettingsProvider>
      </body>
    </html>
  );
}
