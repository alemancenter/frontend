'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Globe,
  Image as ImageIcon,
  Mail,
  FileText,
  Palette,
  Save,
  Upload,
  TestTube,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Code,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Server,
  Copy,
  Zap,
} from 'lucide-react';
import Image from '@/components/common/AppImage';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useThemeStore, useSettingsStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { settingsService } from '@/lib/api/services/settings';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';
import { extractSlotId, buildAdSlotValue } from '@/lib/adsense';

// Tabs configuration
const tabs = [
  { id: 'general', label: 'الإعدادات العامة', icon: Settings },
  { id: 'contact', label: 'اتصل بنا', icon: Phone },
  { id: 'media', label: 'الوسائط', icon: ImageIcon },
  { id: 'email', label: 'البريد الإلكتروني', icon: Mail },
  { id: 'seo', label: 'SEO', icon: FileText },
  { id: 'ads', label: 'الإعلانات', icon: Code },
  { id: 'security', label: 'الأمان', icon: Globe },
  { id: 'appearance', label: 'المظهر', icon: Palette },
];

interface SettingsData {
  // General
  site_name?: string;
  site_email?: string;
  site_description?: string;
  site_language?: string;
  timezone?: string;
  site_url?: string;

  // Contact
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_whatsapp?: string;
  social_tiktok?: string;

  // Media
  site_logo?: string;
  site_favicon?: string;

  // Email (SMTP)
  mail_host?: string;
  mail_port?: string;
  mail_username?: string;
  mail_password?: string;
  mail_encryption?: string;
  mail_from_address?: string;
  mail_from_name?: string;

  // Google OAuth
  google_client_id?: string;
  google_client_secret?: string;
  google_redirect_uri?: string;

  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  robots_txt?: string;
  sitemap_url?: string;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  canonical_url?: string;

  // Ads
  adsense_client?: string;
  // Desktop
  google_ads_desktop_home?: string;
  google_ads_desktop_home_2?: string;
  google_ads_desktop_classes?: string;
  google_ads_desktop_classes_2?: string;
  google_ads_desktop_subject?: string;
  google_ads_desktop_subject_2?: string;
  google_ads_desktop_article?: string;
  google_ads_desktop_article_2?: string;
  google_ads_desktop_news?: string;
  google_ads_desktop_news_2?: string;
  google_ads_desktop_download?: string;
  google_ads_desktop_download_2?: string;
  // Mobile
  google_ads_mobile_classes?: string;
  google_ads_mobile_classes_2?: string;
  google_ads_mobile_subject?: string;
  google_ads_mobile_subject_2?: string;
  google_ads_mobile_article?: string;
  google_ads_mobile_article_2?: string;
  google_ads_mobile_news?: string;
  google_ads_mobile_news_2?: string;
  google_ads_mobile_download?: string;
  google_ads_mobile_download_2?: string;
  google_ads_mobile_home?: string;
  google_ads_mobile_home_2?: string;

  // Security
  recaptcha_site_key?: string;
  recaptcha_secret_key?: string;

  // Appearance
  primary_color?: string;
  secondary_color?: string;

  [key: string]: any;
}

export default function SettingsPage() {
  const { isAuthorized } = usePermissionGuard('manage settings');
  const [activeTab, setActiveTab] = useState('general');
  const { isDarkMode, toggleDarkMode, primaryColor, setPrimaryColor } = useThemeStore();
  const { setSiteName, setSiteLogo, setSiteFavicon, setSettings: setGlobalSettings } = useSettingsStore();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({});
  const [originalSettings, setOriginalSettings] = useState<SettingsData>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SMTP Test states
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Define all functions before hooks and permission checks
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ data: SettingsData }>(API_ENDPOINTS.SETTINGS.GET_ALL);
      const data = response.data?.data || {};
      setSettings(data);
      setOriginalSettings(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في تحميل الإعدادات' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      // Find changed settings
      const changedSettings: SettingsData = {};
      Object.keys(settings).forEach((key) => {
        if (settings[key] !== originalSettings[key]) {
          changedSettings[key] = settings[key];
        }
      });

      if (Object.keys(changedSettings).length === 0) {
        setMessage({ type: 'error', text: 'لم يتم إجراء أي تغييرات' });
        return;
      }

      // google_ads_* values are already stored as JSON — send as-is

      await apiClient.post(API_ENDPOINTS.SETTINGS.UPDATE, changedSettings);
      setOriginalSettings({ ...settings });
      
      // Update global store if site_name changed
      if (changedSettings.site_name) {
        setSiteName(changedSettings.site_name);
      }
      if (typeof changedSettings.site_email === 'string') {
        setGlobalSettings({ siteEmail: changedSettings.site_email });
      }
      if (typeof changedSettings.site_url === 'string') {
        setGlobalSettings({ siteUrl: changedSettings.site_url });
      }
      if (typeof changedSettings.contact_email === 'string') {
        setGlobalSettings({ contactEmail: changedSettings.contact_email });
      }
      if (typeof changedSettings.contact_phone === 'string') {
        setGlobalSettings({ contactPhone: changedSettings.contact_phone });
      }
      if (typeof changedSettings.contact_address === 'string') {
        setGlobalSettings({ contactAddress: changedSettings.contact_address });
      }
      if (typeof changedSettings.recaptcha_site_key === 'string') {
        setGlobalSettings({ recaptchaSiteKey: changedSettings.recaptcha_site_key });
      }
      if (
        typeof changedSettings.social_facebook === 'string' ||
        typeof changedSettings.social_twitter === 'string' ||
        typeof changedSettings.social_linkedin === 'string' ||
        typeof changedSettings.social_whatsapp === 'string' ||
        typeof changedSettings.social_tiktok === 'string'
      ) {
        setGlobalSettings({
          socialLinks: {
            ...(typeof settings.social_facebook === 'string' ? { facebook: settings.social_facebook } : {}),
            ...(typeof settings.social_twitter === 'string' ? { twitter: settings.social_twitter } : {}),
            ...(typeof settings.social_linkedin === 'string' ? { linkedin: settings.social_linkedin } : {}),
            ...(typeof settings.social_whatsapp === 'string' ? { whatsapp: settings.social_whatsapp } : {}),
            ...(typeof settings.social_tiktok === 'string' ? { tiktok: settings.social_tiktok } : {}),
          },
        });
      }

      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في حفظ الإعدادات' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setIsTesting(true);
      setSmtpTestResult(null);
      // Pass current settings to test (host, port, username, password, encryption)
      const smtpSettings = {
        host: settings.mail_host,
        port: settings.mail_port,
        username: settings.mail_username,
        password: settings.mail_password,
        encryption: settings.mail_encryption,
        from_address: settings.mail_from_address,
        from_name: settings.mail_from_name
      };
      
      const response = await settingsService.testSmtp(smtpSettings);
      setSmtpTestResult({
        success: response.success,
        message: response.message || response.error || 'تمت العملية',
      });
    } catch (error: any) {
      setSmtpTestResult({ success: false, message: error.message || 'فشل في اختبار الاتصال' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;

    try {
      setIsSendingTest(true);
      // Pass current settings to ensure we test what's in the form
      const smtpSettings = {
        host: settings.mail_host,
        port: settings.mail_port,
        username: settings.mail_username,
        password: settings.mail_password,
        encryption: settings.mail_encryption,
        from_address: settings.mail_from_address,
        from_name: settings.mail_from_name
      };

      await settingsService.sendTestEmail(testEmail, smtpSettings);
      setMessage({ type: 'success', text: 'تم إرسال البريد التجريبي بنجاح' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في إرسال البريد التجريبي' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleUpdateRobots = async () => {
    try {
      setIsSaving(true);
      await apiClient.post(API_ENDPOINTS.SETTINGS.UPDATE_ROBOTS, {
        content: settings.robots_txt || '',
      });
      setMessage({ type: 'success', text: 'تم تحديث robots.txt بنجاح' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في تحديث robots.txt' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (key: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append(key, file);

      const response = await apiClient.upload<{ data: any }>(
        API_ENDPOINTS.SETTINGS.UPDATE,
        formData
      );

      // Access the nested data structure
      // response.data = { data: { message: '...', data: { site_logo: '...' } }, success: true }
      const resource = response.data?.data;
      const innerData = resource?.data || resource;
      const newPath = innerData?.[key];

      if (newPath) {
          setSettings((prev) => ({ ...prev, [key]: newPath }));
          setOriginalSettings((prev) => ({ ...prev, [key]: newPath }));
          if (key === 'site_logo') setSiteLogo(newPath);
          if (key === 'site_favicon') setSiteFavicon(newPath);
          setMessage({ type: 'success', text: 'تم رفع الملف بنجاح' });
      } else {
         setMessage({ type: 'error', text: 'تم رفع الملف ولكن لم يتم استرجاع المسار الجديد' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: (error as any).message || 'فشل في رفع الملف' });
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const extractDomain = (url: string): string => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const applyServerMailSettings = (domain: string, emailPrefix: string) => {
    const email = `${emailPrefix}@${domain}`;
    updateSetting('mail_host', domain);
    updateSetting('mail_port', '465');
    updateSetting('mail_encryption', 'ssl');
    updateSetting('mail_username', email);
    updateSetting('mail_from_address', email);
    if (!settings.mail_from_name && settings.site_name) {
      updateSetting('mail_from_name', settings.site_name);
    }
  };

  const [serverMailPrefix, setServerMailPrefix] = useState('noreply');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Permission checks after all hooks
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-muted-foreground">جاري تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات الموقع والتفضيلات</p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          حفظ الإعدادات
        </Button>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'p-4 rounded-xl flex items-center gap-3',
              message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            )}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="mr-auto hover:opacity-70"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>الإعدادات العامة</CardTitle>
                  <CardDescription>إعدادات الموقع الأساسية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="اسم الموقع"
                      value={settings.site_name || ''}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      placeholder="أدخل اسم الموقع"
                    />
                    <Input
                      label="البريد الإلكتروني للموقع"
                      type="email"
                      value={settings.site_email || ''}
                      onChange={(e) => updateSetting('site_email', e.target.value)}
                      placeholder="admin@example.com"
                    />
                    <Input
                      label="لغة الموقع"
                      value={settings.site_language || 'ar'}
                      onChange={(e) => updateSetting('site_language', e.target.value)}
                      placeholder="ar"
                    />
                    <Input
                      label="المنطقة الزمنية"
                      value={settings.timezone || 'Asia/Amman'}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      placeholder="Asia/Amman"
                    />
                    <Input
                      label="رابط الموقع"
                      value={settings.site_url || ''}
                      onChange={(e) => updateSetting('site_url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <Textarea
                    label="وصف الموقع"
                    value={settings.site_description || ''}
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                    placeholder="وصف مختصر للموقع"
                    resize="vertical"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Contact Settings */}
          {activeTab === 'contact' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الاتصال</CardTitle>
                  <CardDescription>معلومات التواصل الأساسية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="البريد الإلكتروني للتواصل"
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      placeholder="contact@example.com"
                    />
                    <Input
                      label="رقم الهاتف"
                      value={settings.contact_phone || ''}
                      onChange={(e) => updateSetting('contact_phone', e.target.value)}
                      placeholder="+962 7xx xxx xxx"
                    />
                  </div>
                  <Textarea
                    label="العنوان"
                    value={settings.contact_address || ''}
                    onChange={(e) => updateSetting('contact_address', e.target.value)}
                    placeholder="عنوان المكتب أو الشركة"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>شبكات التواصل الاجتماعي</CardTitle>
                  <CardDescription>روابط حسابات التواصل الاجتماعي</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="فيسبوك"
                      value={settings.social_facebook || ''}
                      onChange={(e) => updateSetting('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                      leftIcon={<Facebook className="w-4 h-4 text-muted-foreground" />}
                    />
                    <Input
                      label="تويتر (X)"
                      value={settings.social_twitter || ''}
                      onChange={(e) => updateSetting('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                      leftIcon={<Twitter className="w-4 h-4 text-muted-foreground" />}
                    />
                    <Input
                      label="لينكد إن"
                      value={settings.social_linkedin || ''}
                      onChange={(e) => updateSetting('social_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      leftIcon={<Linkedin className="w-4 h-4 text-muted-foreground" />}
                    />
                    <Input
                      label="واتساب"
                      value={settings.social_whatsapp || ''}
                      onChange={(e) => updateSetting('social_whatsapp', e.target.value)}
                      placeholder="+9627..."
                      leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
                    />
                    <Input
                      label="تيك توك"
                      value={settings.social_tiktok || ''}
                      onChange={(e) => updateSetting('social_tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@..."
                      leftIcon={<Share2 className="w-4 h-4 text-muted-foreground" />}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Media Settings */}
          {activeTab === 'media' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>الشعار والأيقونات</CardTitle>
                  <CardDescription>رفع شعار الموقع والأيقونة المفضلة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">شعار الموقع</label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                        {settings.site_logo ? (
                          <div className="relative w-full h-full">
                        <Image
                          src={`/storage/${settings.site_logo}`}
                          alt="Logo"
                          fill
                          sizes="128px"
                          className="object-contain"
                        />
                      </div>
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={logoInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('site_logo', file);
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          leftIcon={<Upload className="w-4 h-4" />} 
                          className="cursor-pointer"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          رفع شعار جديد
                        </Button>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG (حد أقصى 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">الأيقونة المفضلة (Favicon)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                        {settings.site_favicon ? (
                          <div className="relative w-full h-full">
                        <Image
                          src={`/storage/${settings.site_favicon}`}
                          alt="Favicon"
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </div>
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={faviconInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('site_favicon', file);
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          leftIcon={<Upload className="w-4 h-4" />} 
                          className="cursor-pointer"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          رفع أيقونة جديدة
                        </Button>
                        <p className="text-xs text-muted-foreground">يفضل 32x32 أو 64x64 بكسل</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Server Mail Quick Setup */}
              {(() => {
                const domain = extractDomain(settings.site_url || '');
                if (!domain) return null;
                const serverEmail = `${serverMailPrefix}@${domain}`;
                const mailInfo = [
                  { proto: 'SMTP', desc: 'صادر', host: domain, port: '465', enc: 'SSL' },
                  { proto: 'IMAP', desc: 'وارد', host: domain, port: '993', enc: 'SSL' },
                  { proto: 'POP3', desc: 'وارد', host: domain, port: '995', enc: 'SSL' },
                ];
                return (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-primary" />
                        <CardTitle>إعداد بريد الخادم الداخلي</CardTitle>
                      </div>
                      <CardDescription>
                        إعدادات البريد المستضاف على نطاق <span className="font-mono font-semibold text-foreground">{domain}</span> — يُستخدم بدلاً من Gmail أو Outlook
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Protocol info cards */}
                      <div className="grid sm:grid-cols-3 gap-3">
                        {mailInfo.map((item) => (
                          <div key={item.proto} className="p-3 rounded-xl bg-muted/50 border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-primary">{item.proto}</span>
                              <span className="text-xs text-muted-foreground">{item.desc}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-mono truncate">{item.host}</span>
                              <button
                                onClick={() => copyToClipboard(item.host, `host-${item.proto}`)}
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                title="نسخ"
                              >
                                {copiedField === `host-${item.proto}` ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold">{item.port}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{item.enc}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Email account + apply */}
                      <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          تطبيق الإعدادات تلقائياً على نموذج SMTP
                        </p>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">اسم الحساب (قبل @)</label>
                            <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                              <input
                                type="text"
                                value={serverMailPrefix}
                                onChange={(e) => setServerMailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._+-]/g, ''))}
                                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none font-mono"
                                placeholder="noreply"
                                dir="ltr"
                              />
                              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted/50 border-r font-mono">
                                @{domain}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => applyServerMailSettings(domain, serverMailPrefix || 'noreply')}
                            leftIcon={<Zap className="w-4 h-4" />}
                            size="sm"
                          >
                            تطبيق
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            سيتم تعيين: الخادم = <span className="font-mono font-semibold text-foreground">{domain}</span>،
                            المنفذ = <span className="font-mono font-semibold text-foreground">465</span>،
                            التشفير = <span className="font-mono font-semibold text-foreground">SSL</span>،
                            المستخدم = <span className="font-mono font-semibold text-foreground">{serverEmail}</span>
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ ستحتاج إلى إدخال كلمة مرور البريد يدوياً من لوحة تحكم الاستضافة (cPanel / Plesk)
                        </p>
                      </div>

                      {/* Manual setup reference */}
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground select-none list-none flex items-center gap-1.5">
                          <span className="transition-transform group-open:rotate-90">▶</span>
                          عرض إعدادات Mail Client (Thunderbird / Outlook / iOS)
                        </summary>
                        <div className="mt-3 rounded-xl border overflow-hidden text-xs">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/50 text-right">
                                <th className="px-3 py-2 font-medium">الإعداد</th>
                                <th className="px-3 py-2 font-medium font-mono ltr:text-left rtl:text-right">القيمة</th>
                                <th className="px-3 py-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {[
                                { label: 'اسم المستخدم (Username)', value: serverEmail },
                                { label: 'خادم SMTP (صادر)', value: domain },
                                { label: 'منفذ SMTP', value: '465' },
                                { label: 'تشفير SMTP', value: 'SSL/TLS' },
                                { label: 'خادم IMAP (وارد)', value: domain },
                                { label: 'منفذ IMAP', value: '993' },
                                { label: 'تشفير IMAP', value: 'SSL/TLS' },
                                { label: 'خادم POP3 (وارد)', value: domain },
                                { label: 'منفذ POP3', value: '995' },
                                { label: 'تشفير POP3', value: 'SSL/TLS' },
                              ].map((row) => (
                                <tr key={row.label} className="hover:bg-muted/30">
                                  <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                                  <td className="px-3 py-2 font-mono font-semibold" dir="ltr">{row.value}</td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => copyToClipboard(row.value, `table-${row.label}`)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {copiedField === `table-${row.label}` ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات SMTP</CardTitle>
                  <CardDescription>إعدادات خادم البريد الإلكتروني</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.mail_host?.includes('gmail') && (
                    <div className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <p className="font-medium">Gmail يتطلب كلمة مرور التطبيق</p>
                        <p className="text-xs mt-0.5 opacity-80">
                          كلمة مرور حسابك العادية لن تعمل. يجب إنشاء{' '}
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            كلمة مرور التطبيق
                          </a>{' '}
                          من إعدادات Google وتفعيل المصادقة الثنائية أولاً.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="خادم SMTP"
                      value={settings.mail_host || ''}
                      onChange={(e) => updateSetting('mail_host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                    <Input
                      label="المنفذ"
                      value={settings.mail_port || ''}
                      onChange={(e) => updateSetting('mail_port', e.target.value)}
                      placeholder="587"
                      inputMode="numeric"
                    />
                    <Input
                      label="اسم المستخدم"
                      value={settings.mail_username || ''}
                      onChange={(e) => updateSetting('mail_username', e.target.value)}
                      placeholder="user@example.com"
                    />
                    <Input
                      label="كلمة المرور"
                      type="password"
                      value={settings.mail_password || ''}
                      onChange={(e) => updateSetting('mail_password', e.target.value)}
                      placeholder="••••••••"
                    />
                    <Select
                      label="التشفير"
                      value={settings.mail_encryption || 'tls'}
                      onChange={(e) => updateSetting('mail_encryption', e.target.value)}
                      options={[
                        { value: 'tls', label: 'TLS / STARTTLS (587) — Gmail, Outlook' },
                        { value: 'ssl', label: 'SSL / Implicit TLS (465)' },
                        { value: 'none', label: 'بدون تشفير (25)' },
                      ]}
                    />
                    <Input
                      label="عنوان المرسل"
                      value={settings.mail_from_address || ''}
                      onChange={(e) => updateSetting('mail_from_address', e.target.value)}
                      placeholder="noreply@example.com"
                    />
                    <Input
                      label="اسم المرسل"
                      value={settings.mail_from_name || ''}
                      onChange={(e) => updateSetting('mail_from_name', e.target.value)}
                      placeholder="اسم الموقع"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                  {/* SMTP Test Result */}
                  {smtpTestResult && (
                    <div
                      className={cn(
                        'w-full p-3 rounded-lg flex items-center gap-2 border',
                        smtpTestResult.success 
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                          : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                      )}
                    >
                      {smtpTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium">{smtpTestResult.message}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleTestSmtp}
                      isLoading={isTesting}
                      leftIcon={<TestTube className="w-4 h-4" />}
                    >
                      اختبار الاتصال
                    </Button>
                  </div>

                  {/* Send Test Email */}
                  <div className="w-full flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label="إرسال بريد تجريبي"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleSendTestEmail}
                      isLoading={isSendingTest}
                      disabled={!testEmail}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      إرسال
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات SEO</CardTitle>
                  <CardDescription>تحسين محركات البحث</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="عنوان الصفحة الرئيسية"
                    value={settings.meta_title || ''}
                    onChange={(e) => updateSetting('meta_title', e.target.value)}
                    placeholder="عنوان الموقع | الوصف"
                  />
                  <Textarea
                    label="الوصف التعريفي"
                    value={settings.meta_description || ''}
                    onChange={(e) => updateSetting('meta_description', e.target.value)}
                    placeholder="وصف الموقع لمحركات البحث (150-160 حرف)"
                  />
                  <Input
                    label="الكلمات المفتاحية"
                    value={settings.meta_keywords || ''}
                    onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                    placeholder="كلمة1, كلمة2, كلمة3"
                  />
                  <Input
                    label="رابط Canonical"
                    value={settings.canonical_url || ''}
                    onChange={(e) => updateSetting('canonical_url', e.target.value)}
                    placeholder="https://example.com"
                  />
                   <Input
                    label="رابط خريطة الموقع (Sitemap)"
                    value={settings.sitemap_url || ''}
                    onChange={(e) => updateSetting('sitemap_url', e.target.value)}
                    placeholder="https://example.com/sitemap.xml"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أكواد التتبع</CardTitle>
                  <CardDescription>إحصائيات جوجل وفيسبوك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="معرف Google Analytics"
                      value={settings.google_analytics_id || ''}
                      onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <Input
                      label="معرف Facebook Pixel"
                      value={settings.facebook_pixel_id || ''}
                      onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                      placeholder="XXXXXXXXXXXXXXX"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ملف Robots.txt</CardTitle>
                  <CardDescription>التحكم في فهرسة محركات البحث</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={settings.robots_txt || 'User-agent: *\nAllow: /'}
                    onChange={(e) => updateSetting('robots_txt', e.target.value)}
                    placeholder="محتوى robots.txt"
                    resize="vertical"
                    className="font-mono text-sm"
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    variant="secondary"
                    onClick={handleUpdateRobots}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    تحديث Robots.txt
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Ads Settings */}
          {activeTab === 'ads' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات Google AdSense</CardTitle>
                  <CardDescription>
                    أدخل معرف الحساب ورقم الإعلان فقط — الكود يُولَّد تلقائياً
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="معرف AdSense Client"
                    value={settings.adsense_client || ''}
                    onChange={(e) => updateSetting('adsense_client', e.target.value)}
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                    helperText="يُستخدم في جميع الإعلانات تلقائياً"
                  />
                </CardContent>
              </Card>

              {/* Desktop Ads */}
              <Card>
                <CardHeader>
                  <CardTitle>إعلانات سطح المكتب</CardTitle>
                  <CardDescription>أدخل رقم Ad Slot فقط (مثال: 1234567890)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {[
                      { key: 'google_ads_desktop_home',       label: 'الصفحة الرئيسية (1)' },
                      { key: 'google_ads_desktop_home_2',     label: 'الصفحة الرئيسية (2)' },
                      { key: 'google_ads_desktop_classes',    label: 'صفحة الأقسام (1)' },
                      { key: 'google_ads_desktop_classes_2',  label: 'صفحة الأقسام (2)' },
                      { key: 'google_ads_desktop_subject',    label: 'صفحة المادة (1)' },
                      { key: 'google_ads_desktop_subject_2',  label: 'صفحة المادة (2)' },
                      { key: 'google_ads_desktop_article',    label: 'المقال (1)' },
                      { key: 'google_ads_desktop_article_2',  label: 'المقال (2)' },
                      { key: 'google_ads_desktop_news',       label: 'الأخبار (1)' },
                      { key: 'google_ads_desktop_news_2',     label: 'الأخبار (2)' },
                      { key: 'google_ads_desktop_download',   label: 'التحميل (1)' },
                      { key: 'google_ads_desktop_download_2', label: 'التحميل (2)' },
                    ].map(({ key, label }) => (
                      <Input
                        key={key}
                        label={label}
                        value={extractSlotId(settings[key as keyof typeof settings] as string || '')}
                        onChange={(e) =>
                          updateSetting(key, buildAdSlotValue(e.target.value))
                        }
                        placeholder="1234567890"
                        inputMode="numeric"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Ads */}
              <Card>
                <CardHeader>
                  <CardTitle>إعلانات الجوال</CardTitle>
                  <CardDescription>أدخل رقم Ad Slot فقط (مثال: 1234567890)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {[
                      { key: 'google_ads_mobile_home',       label: 'الصفحة الرئيسية (1)' },
                      { key: 'google_ads_mobile_home_2',     label: 'الصفحة الرئيسية (2)' },
                      { key: 'google_ads_mobile_classes',    label: 'صفحة الأقسام (1)' },
                      { key: 'google_ads_mobile_classes_2',  label: 'صفحة الأقسام (2)' },
                      { key: 'google_ads_mobile_subject',    label: 'صفحة المادة (1)' },
                      { key: 'google_ads_mobile_subject_2',  label: 'صفحة المادة (2)' },
                      { key: 'google_ads_mobile_article',    label: 'المقال (1)' },
                      { key: 'google_ads_mobile_article_2',  label: 'المقال (2)' },
                      { key: 'google_ads_mobile_news',       label: 'الأخبار (1)' },
                      { key: 'google_ads_mobile_news_2',     label: 'الأخبار (2)' },
                      { key: 'google_ads_mobile_download',   label: 'التحميل (1)' },
                      { key: 'google_ads_mobile_download_2', label: 'التحميل (2)' },
                    ].map(({ key, label }) => (
                      <Input
                        key={key}
                        label={label}
                        value={extractSlotId(settings[key as keyof typeof settings] as string || '')}
                        onChange={(e) =>
                          updateSetting(key, buildAdSlotValue(e.target.value))
                        }
                        placeholder="1234567890"
                        inputMode="numeric"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Google reCAPTCHA</CardTitle>
                  <CardDescription>إعدادات الحماية من السبام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Site Key"
                    value={settings.recaptcha_site_key || ''}
                    onChange={(e) => updateSetting('recaptcha_site_key', e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxx"
                  />
                  <Input
                    label="Secret Key"
                    value={settings.recaptcha_secret_key || ''}
                    onChange={(e) => updateSetting('recaptcha_secret_key', e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxx"
                    type="password"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Google OAuth</CardTitle>
                  <CardDescription>إعدادات تسجيل الدخول عبر Google — تُحفظ في قاعدة البيانات وملف .env</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                    <span className="text-base shrink-0">ℹ️</span>
                    <div>
                      <p className="font-medium">كيفية الحصول على بيانات Google OAuth</p>
                      <ol className="text-xs mt-1 opacity-80 list-decimal list-inside space-y-0.5">
                        <li>افتح <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                        <li>أنشئ مشروعاً أو اختر موجوداً</li>
                        <li>APIs &amp; Services → Credentials → Create OAuth 2.0 Client</li>
                        <li>أضف Redirect URI: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{settings.google_redirect_uri || 'http://localhost:8080/api/auth/google/callback'}</code></li>
                      </ol>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Client ID"
                      value={settings.google_client_id || ''}
                      onChange={(e) => updateSetting('google_client_id', e.target.value)}
                      placeholder="123456789-xxx.apps.googleusercontent.com"
                      dir="ltr"
                    />
                    <Input
                      label="Client Secret"
                      type="password"
                      value={settings.google_client_secret || ''}
                      onChange={(e) => updateSetting('google_client_secret', e.target.value)}
                      placeholder="GOCSPX-..."
                      dir="ltr"
                    />
                    <Input
                      label="Redirect URI"
                      value={settings.google_redirect_uri || ''}
                      onChange={(e) => updateSetting('google_redirect_uri', e.target.value)}
                      placeholder="http://localhost:8080/api/auth/google/callback"
                      dir="ltr"
                      className="sm:col-span-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>المظهر</CardTitle>
                  <CardDescription>تخصيص مظهر لوحة التحكم</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <h4 className="font-medium">الوضع الداكن</h4>
                      <p className="text-sm text-muted-foreground">
                        تفعيل الوضع الداكن للواجهة
                      </p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={cn(
                        'relative w-14 h-8 rounded-full transition-colors',
                        isDarkMode ? 'bg-primary' : 'bg-border'
                      )}
                    >
                      <motion.div
                        animate={{ x: isDarkMode ? 24 : 4 }}
                        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                      />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">اختر اللون الأساسي</h4>
                    <div className="flex items-center gap-3">
                      {[
                        { color: '#696cff', name: 'Default' },
                        { color: '#0891b2', name: 'Teal' },
                        { color: '#7c3aed', name: 'Purple' },
                        { color: '#22c55e', name: 'Green' },
                        { color: '#f59e0b', name: 'Amber' },
                        { color: '#ef4444', name: 'Red' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => setPrimaryColor(item.color)}
                          className={cn(
                             "w-10 h-10 rounded-full border-2 transition-all shadow-md",
                             primaryColor === item.color ? "border-primary scale-110" : "border-transparent hover:border-foreground"
                          )}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}
                    </div>
                    <div className="mt-4">
                        <Input 
                            label="لون مخصص"
                            type="color"
                            value={primaryColor || '#696cff'}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-24 h-10 p-1"
                        />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
