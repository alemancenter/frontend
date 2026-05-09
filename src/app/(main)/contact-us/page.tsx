'use client';

import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/store/useStore';
import { motion } from '@/lib/motion-lite';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  User,
  FileText,
  MessageSquare,
} from 'lucide-react';
import Script from 'next/script';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export default function ContactUsPage() {
  const { siteName, siteEmail, siteUrl, contactEmail, contactPhone, contactAddress, socialLinks, recaptchaSiteKey } =
    useSettingsStore();

  const resolvedContactEmail = contactEmail || siteEmail || 'info@alemedu.com';
  const resolvedSiteUrl = siteUrl || 'https://alemedu.com';
  const resolvedContactPhone = contactPhone || '';
  const resolvedContactAddress = contactAddress || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [botField, setBotField] = useState('');
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [isRecaptchaScriptLoaded, setIsRecaptchaScriptLoaded] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botField.trim()) return;

    const elapsedMs = Date.now() - formStartedAt;
    if (elapsedMs < 1200) {
      toast.error('يرجى المحاولة مرة أخرى');
      return;
    }

    if (!recaptchaSiteKey) {
      toast.error('نموذج التواصل غير مُهيأ حالياً');
      return;
    }

    if (!recaptchaToken) {
      toast.error('يرجى إكمال التحقق أولاً');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post(API_ENDPOINTS.FRONT.CONTACT, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
        'g-recaptcha-response': recaptchaToken,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        form_time_ms: elapsedMs,
      });
      toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setBotField('');
      setFormStartedAt(Date.now());
      setRecaptchaToken(null);
      if (typeof window !== 'undefined' && window.grecaptcha && recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
    } catch (err: any) {
      const errors =
        err && typeof err === 'object' && 'errors' in err ? (err.errors as Record<string, string[] | string> | null) : null;

      let firstError: string | null = null;
      if (errors && typeof errors === 'object') {
        const firstVal = Object.values(errors)[0];
        if (Array.isArray(firstVal)) {
          firstError = firstVal.find((v) => typeof v === 'string' && v.trim()) ?? null;
        } else if (typeof firstVal === 'string') {
          firstError = firstVal;
        }
      }

      toast.error(firstError || err?.message || 'فشل إرسال الرسالة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (!recaptchaSiteKey) return;
    if (!isRecaptchaScriptLoaded) return;
    if (!recaptchaContainerRef.current) return;
    if (recaptchaWidgetId !== null) return;
    if (typeof window === 'undefined') return;
    if (!window.grecaptcha) return;

    const renderReCaptcha = () => {
      if (!window.grecaptcha || !recaptchaContainerRef.current) return;
      try {
        const widgetId = window.grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: recaptchaSiteKey,
          callback: (token) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(null),
          'error-callback': () => setRecaptchaToken(null),
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
      }
    };

    if (window.grecaptcha.ready) {
      window.grecaptcha.ready(renderReCaptcha);
    } else if (typeof window.grecaptcha.render === 'function') {
      renderReCaptcha();
    }
  }, [isRecaptchaScriptLoaded, recaptchaSiteKey, recaptchaWidgetId]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans">
      {recaptchaSiteKey ? (
        <Script
          src="https://www.google.com/recaptcha/api.js?render=explicit"
          async
          defer
          onLoad={() => setIsRecaptchaScriptLoaded(true)}
        />
      ) : null}
      {/* Hero Section */}
      <section
        className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 overflow-hidden"
        style={{ background: 'linear-gradient(226deg, #202c45 0%, #286aad 100%)' }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[150px] -right-[150px] w-[500px] h-[500px] rounded-full border border-white/5 opacity-30 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-sm leading-tight">
              اتصل بنا
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-0 max-w-2xl mx-auto font-light">
              نحن هنا للإجابة على استفساراتك ومساعدتك في كل ما تحتاج
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 -mt-20 relative z-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Contact Information (Left Side - 4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Email */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="mr-4">
                  <h5 className="font-bold text-slate-800 text-lg">البريد الإلكتروني</h5>
                  <p className="text-slate-500 text-sm">تواصل معنا عبر البريد</p>
                </div>
              </div>
              <a
                href={`mailto:${resolvedContactEmail}`}
                className="flex items-center text-slate-700 hover:text-blue-600 transition-colors font-medium"
              >
                <Mail className="w-4 h-4 ml-2" />
                {resolvedContactEmail}
              </a>

              {socialLinks.facebook || socialLinks.twitter || socialLinks.linkedin || socialLinks.whatsapp ? (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-slate-600 text-sm font-medium mb-3">وسائل التواصل</p>
                  <div className="flex gap-3">
                    {socialLinks.facebook ? (
                      <a
                        href={socialLinks.facebook}
                        className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    ) : null}
                    {socialLinks.twitter ? (
                      <a
                        href={socialLinks.twitter}
                        className="w-10 h-10 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    ) : null}
                    {socialLinks.linkedin ? (
                      <a
                        href={socialLinks.linkedin}
                        className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    ) : null}
                    {socialLinks.whatsapp ? (
                      <a
                        href={socialLinks.whatsapp}
                        className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {resolvedContactPhone ? (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-slate-600 text-sm font-medium mb-3">الهاتف</p>
                  <a
                    href={`tel:${resolvedContactPhone}`}
                    className="flex items-center text-slate-700 hover:text-green-600 transition-colors font-medium"
                    dir="ltr"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {resolvedContactPhone}
                  </a>
                </div>
              ) : null}
            </div>

            {/* Address */}
            {resolvedContactAddress && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="mr-4">
                    <h5 className="font-bold text-slate-800 text-lg">العنوان</h5>
                    <p className="text-slate-500 text-sm">موقعنا</p>
                  </div>
                </div>
                <p className="text-slate-700 font-medium">{resolvedContactAddress}</p>
              </div>
            )}
          </div>

          {/* Contact Form (Right Side - 8 Columns) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h4 className="text-2xl font-bold text-slate-800 mb-6">أرسل لنا رسالة</h4>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="website"
                  value={botField}
                  onChange={(e) => setBotField(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="رقم هاتفك"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">الموضوع</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="موضوع الرسالة"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">الرسالة</label>
                  <div className="relative">
                    <div className="absolute top-3 right-0 pr-3 pointer-events-none text-slate-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  </div>
                </div>

                {recaptchaSiteKey ? (
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-h-[78px]">
                      <div ref={recaptchaContainerRef} />
                    </div>
                    <a
                      href={resolvedSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {siteName || 'الموقع'}
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-amber-900 text-sm">
                    نموذج التواصل غير مُهيأ حالياً. يرجى ضبط `recaptcha_site_key` من لوحة التحكم.
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !recaptchaSiteKey || !recaptchaToken}
                    leftIcon={<Send className="w-4 h-4 ml-2" />}
                    className="px-8 py-3 h-auto text-base rounded-xl"
                  >
                    إرسال الرسالة
                  </Button>
                </div>
              </form>
            </div>
          </div>
      </div>

      {/* Map Section */}
      {resolvedContactAddress && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-hidden h-[400px]">
            <iframe
              src="https://www.google.com/maps?q=32.610854,35.608493&hl=ar&z=14&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map"
            />
          </div>
        )}
      </div>
    </div>
  );
}

