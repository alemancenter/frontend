'use client';

import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { motion } from '@/lib/motion-lite';
import { useSettingsStore } from '@/store/useStore';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Share2,
  Youtube,
  Mail,
  Home,
  Info,
  Users,
  Shield,
  FileText,
  Cookie,
  AlertCircle,
  Smartphone,
  Heart,
} from 'lucide-react';

type SettingsBag = Record<string, string | null>;

export default function Footer({ initialSettings }: { initialSettings?: SettingsBag }) {
  const { siteName, siteLogo, socialLinks } = useSettingsStore();
  const currentYear = new Date().getFullYear();
  const initialSiteName = (initialSettings?.site_name || (initialSettings as any)?.siteName || '').toString().trim();
  const displaySiteName = initialSiteName || (siteName || '').toString().trim();
  const initialSiteLogo = initialSettings?.site_logo ?? (initialSettings as any)?.siteLogo ?? null;
  const displaySiteLogo = initialSiteLogo ?? siteLogo;

  const resolveStorageAssetSrc = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/storage/')) return trimmed;
    if (trimmed.startsWith('storage/')) return `/${trimmed}`;
    const withoutLeadingSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return `/storage/${withoutLeadingSlash}`;
  };

  const normalizeExternalUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const resolveWhatsappUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly) return `https://wa.me/${digitsOnly.replace(/^00/, '')}`;
    return normalizeExternalUrl(trimmed);
  };

  const footerSocialItems = [
    { key: 'facebook', icon: Facebook, href: socialLinks.facebook ? normalizeExternalUrl(socialLinks.facebook) : '', label: 'Facebook', hover: 'hover:bg-blue-600' },
    { key: 'twitter', icon: Twitter, href: socialLinks.twitter ? normalizeExternalUrl(socialLinks.twitter) : '', label: 'Twitter', hover: 'hover:bg-sky-500' },
    { key: 'instagram', icon: Instagram, href: socialLinks.instagram ? normalizeExternalUrl(socialLinks.instagram) : '', label: 'Instagram', hover: 'hover:bg-pink-600' },
    { key: 'linkedin', icon: Linkedin, href: socialLinks.linkedin ? normalizeExternalUrl(socialLinks.linkedin) : '', label: 'LinkedIn', hover: 'hover:bg-blue-700' },
    { key: 'whatsapp', icon: MessageCircle, href: socialLinks.whatsapp ? resolveWhatsappUrl(socialLinks.whatsapp) : '', label: 'WhatsApp', hover: 'hover:bg-green-600' },
    { key: 'youtube', icon: Youtube, href: socialLinks.youtube ? normalizeExternalUrl(socialLinks.youtube) : '', label: 'YouTube', hover: 'hover:bg-red-600' },
    { key: 'tiktok', icon: Share2, href: socialLinks.tiktok ? normalizeExternalUrl(socialLinks.tiktok) : '', label: 'TikTok', hover: 'hover:bg-slate-900' },
  ].filter((item) => item.href);

  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      {/* Top Footer */}
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Section (col-lg-4) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 relative flex items-center justify-center rounded-xl overflow-hidden bg-primary/5 border border-primary/10 group-hover:border-primary/30 transition-colors">
                {displaySiteLogo ? (
                  <Image
                    src={resolveStorageAssetSrc(displaySiteLogo)}
                    alt={displaySiteName}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="text-primary font-bold text-2xl">R</span>
                )}
              </div>
              <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                {displaySiteName}
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              منصتك التعليمية الشاملة. نهدف إلى توفير أفضل الموارد التعليمية والخدمات للطلاب والمعلمين في مكان واحد.
            </p>
            {footerSocialItems.length ? (
              <div className="flex items-center gap-2">
                {footerSocialItems.map((social) => (
                  <motion.a
                    key={social.key}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-white transition-all duration-300 ${social.hover}`}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quick Links (col-lg-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground text-lg mb-6 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Home className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Info className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>من نحن</span>
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Mail className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>اتصل بنا</span>
                </Link>
              </li>
              <li>
                <Link href="/members" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Users className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>الأعضاء</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links (col-lg-3) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-foreground text-lg mb-6 relative inline-block">
              روابط قانونية
              <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Shield className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>سياسة الخصوصية</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <FileText className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>شروط الاستخدام</span>
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Cookie className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>سياسة الكوكيز</span>
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <AlertCircle className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                  <span>إخلاء المسؤولية</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* App Download (col-lg-3) */}
          <div className="lg:col-span-3">
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
              <h3 className="font-bold text-foreground text-lg mb-3">حمل تطبيقنا</h3>
              <p className="text-sm text-muted-foreground mb-6">
                احصل على تطبيقنا للجوال لتجربة أفضل ومتابعة مستمرة.
              </p>
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="flex items-center gap-3 bg-foreground text-background hover:bg-foreground/90 transition-colors p-3 rounded-xl w-full"
                  aria-label="Download on App Store"
                >
                  <Smartphone className="w-8 h-8" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] opacity-80">Download on the</span>
                    <span className="font-bold text-sm leading-none">App Store</span>
                  </div>
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 bg-background border border-border hover:bg-muted transition-colors p-3 rounded-xl w-full text-foreground"
                  aria-label="Get it on Google Play"
                >
                  <Smartphone className="w-8 h-8 text-green-600" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-muted-foreground">GET IT ON</span>
                    <span className="font-bold text-sm leading-none">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-border pt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-right">
              &copy; {currentYear} <Link href="/" className="font-bold text-foreground hover:text-primary hover:underline transition-colors">{displaySiteName}</Link>. جميع الحقوق محفوظة.
            </div>
            
            <div className="flex items-center gap-1.5 bg-muted/50 px-4 py-2 rounded-full">
              <span>صنع بـ</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>في</span>
              <span className="font-semibold text-foreground">الأردن</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

