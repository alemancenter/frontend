import AuthLayoutClient from './AuthLayoutClient';
import { getFrontSettings } from '@/lib/front-settings';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getFrontSettings();
  const siteName = (settings.site_name || (settings as any).siteName || '').toString();
  return <AuthLayoutClient siteName={siteName}>{children}</AuthLayoutClient>;
}
