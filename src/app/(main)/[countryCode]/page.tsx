import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/api/config';
import HomeContent from '@/components/home/HomeContent';
import { getHomeData } from '@/lib/home-data';

// Use ISR with revalidation for better performance
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}): Promise<Metadata> {
  const { countryCode } = await params;
  const country = COUNTRIES.find((c) => c.code === countryCode);

  if (!country) {
    return {
      title: 'Page Not Found',
    };
  }

  const { settings } = await getHomeData(country.id);
  const siteName = (settings.site_name || settings.siteName || '').toString().trim();
  const resolvedSiteName = siteName || 'منصة التعليم';

  return {
    title: `${resolvedSiteName} - المنهاج الدراسي ${country.name}`,
    description: `تصفح جميع الصفوف والمواد الدراسية للمنهاج ${country.name} على منصة ${resolvedSiteName} التعليمية.`,
    keywords: [`منهاج ${country.name}`, 'تعليم', 'دروس', 'امتحانات', resolvedSiteName],
    openGraph: {
      title: `${resolvedSiteName} - المنهاج الدراسي ${country.name}`,
      description: `أفضل منصة تعليمية في ${country.name}`,
      type: 'website',
    },
  };
}

export default async function CountryHomePage({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}) {
  const { countryCode } = await params;
  const country = COUNTRIES.find((c) => c.code === countryCode);

  if (!country) {
    notFound();
  }

  const { classes, categories, articles, posts, featured_posts, settings } = await getHomeData(country.id);
  const initialSiteName = (settings.site_name || settings.siteName || '').toString().trim();
  const adSettings = {
    googleAdsDesktop: settings.google_ads_desktop_home || '',
    googleAdsMobile: settings.google_ads_mobile_home || '',
    googleAdsDesktop2: settings.google_ads_desktop_home_2 || '',
    googleAdsMobile2: settings.google_ads_mobile_home_2 || '',
  };

  return (
    <HomeContent
      country={country}
      classes={classes}
      categories={categories}
      articles={articles}
      posts={posts}
      featuredPosts={featured_posts}
      initialSiteName={initialSiteName}
      adSettings={adSettings}
    />
  );
}
