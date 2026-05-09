'use client';

import { useEffect, useRef } from 'react';
import { useThemeStore, useSettingsStore } from '@/store/useStore';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';

export default function ThemeInitializer() {
  const { isDarkMode, primaryColor } = useThemeStore();
  const { siteName, siteFavicon, setSettings } = useSettingsStore();
  const frontSettings = useFrontSettings();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const data: any = frontSettings || {};
    const siteNameValue = data.site_name ?? data.siteName;
    const siteEmailValue = data.site_email ?? data.siteEmail;
    const siteUrlValue = data.site_url ?? data.siteUrl;
    const siteLogoValue = data.site_logo ?? data.siteLogo;
    const siteFaviconValue = data.site_favicon ?? data.siteFavicon;

    const siteDescription = data.site_description ?? '';
    const contactEmail = data.contact_email ?? '';
    const contactPhone = data.contact_phone ?? '';
    const contactAddress = data.contact_address ?? '';
    const recaptchaSiteKey = data.recaptcha_site_key ?? '';

    const socialLinks = {
      facebook: data.social_facebook,
      twitter: data.social_twitter,
      linkedin: data.social_linkedin,
      instagram: data.social_instagram,
      whatsapp: data.social_whatsapp,
      youtube: data.social_youtube,
      tiktok: data.social_tiktok,
    };

    const nextSettings: Parameters<typeof setSettings>[0] = {};
    if (typeof siteNameValue === 'string') nextSettings.siteName = siteNameValue;
    if (typeof siteEmailValue === 'string') nextSettings.siteEmail = siteEmailValue;
    if (typeof siteUrlValue === 'string') nextSettings.siteUrl = siteUrlValue;
    if (siteLogoValue === null || typeof siteLogoValue === 'string') nextSettings.siteLogo = siteLogoValue;
    if (siteFaviconValue === null || typeof siteFaviconValue === 'string') nextSettings.siteFavicon = siteFaviconValue;

    nextSettings.siteDescription = siteDescription;
    nextSettings.contactEmail = contactEmail;
    nextSettings.contactPhone = contactPhone;
    nextSettings.contactAddress = contactAddress;
    if (typeof recaptchaSiteKey === 'string') nextSettings.recaptchaSiteKey = recaptchaSiteKey;
    nextSettings.socialLinks = socialLinks;

    setSettings(nextSettings);
  }, [frontSettings, setSettings]);

  useEffect(() => {
    // Update Title and Favicon
    if (siteName && siteName.trim()) document.title = siteName.trim();

    if (siteFavicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = `/storage/${siteFavicon}`;
    }
  }, [siteName, siteFavicon]);

  useEffect(() => {
    const root = document.documentElement;

    // Apply Dark Mode
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply Primary Color
    // We assume the CSS variable is --color-primary
    // Since the global css defines it as hsl(...), we can override it.
    // However, for best compatibility with Tailwind opacity modifiers if they rely on channels,
    // we should test. But given modern CSS 'color-mix', hex should work fine.
    if (primaryColor) {
      root.style.setProperty('--color-primary', primaryColor);
      
      // We might also want to update the ring color to match
      root.style.setProperty('--color-ring', primaryColor);
    }
  }, [isDarkMode, primaryColor]);

  return null;
}
