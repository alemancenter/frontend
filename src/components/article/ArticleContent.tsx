'use client';

import { FileText, Download, AlertCircle, LogIn, UserPlus, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { sanitizeRichHtml } from '@/lib/sanitize-html';
import ArticleAds from '@/components/ads/ArticleAds';

interface File {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  file_category?: string;
}

interface Props {
  content: string;
  files: File[];
  className?: string;
  backLink?: string;
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
  showInlineAd?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ArticleContent({ content, files, className, adSettings, showInlineAd }: Props) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Trusted iframe hosts: YouTube, Vimeo, Google Maps, and Dailymotion only.
  const TRUSTED_IFRAME_ORIGINS = [
    'www.youtube.com', 'youtube.com', 'youtube-nocookie.com',
    'player.vimeo.com', 'vimeo.com',
    'www.google.com', 'maps.google.com',
    'www.dailymotion.com', 'dailymotion.com',
  ];

  const processedContent = sanitizeRichHtml(content, TRUSTED_IFRAME_ORIGINS);
  const paragraphMatches = Array.from(processedContent.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi));
  const secondParagraph = paragraphMatches[1];
  const splitIndex = secondParagraph ? secondParagraph.index! + secondParagraph[0].length : -1;
  const contentBeforeAd = splitIndex > 0 ? processedContent.slice(0, splitIndex) : processedContent;
  const contentAfterAd = splitIndex > 0 ? processedContent.slice(splitIndex) : '';

  return (
    <div className={className}>
      {/* Main Content */}
      <div className="rich-content prose prose-lg max-w-none text-right prose-headings:text-right prose-headings:font-bold prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto mb-12">
        <div dangerouslySetInnerHTML={{ __html: contentBeforeAd }} />
        {showInlineAd && adSettings && splitIndex > 0 && (
          <div className="not-prose my-8">
            <ArticleAds adSettings={adSettings} position="content-mid" />
          </div>
        )}
        {contentAfterAd && <div dangerouslySetInnerHTML={{ __html: contentAfterAd }} />}
      </div>

      {/* Files Section */}
      {files && files.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="text-primary" />
            المرفقات
          </h3>
          <div className="grid gap-4">
            {files.map((file, index) => (
              <div
                key={file.id || `file-${index}`}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold text-sm uppercase">{file.file_type || 'PDF'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-medium text-gray-900 mb-1 group-hover:text-primary transition-colors whitespace-normal break-words bidi-plaintext"
                        dir="auto"
                      >
                        {file.file_name || 'ملف للتحميل'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.file_size || 0)} • {file.file_category || 'ملف'}
                      </p>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <Link
                      href={`/download/${file.id}`}
                      className="shrink-0 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Download size={18} />
                      <span className="hidden sm:inline">تحميل</span>
                    </Link>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm">
                      <Lock size={14} />
                      <span className="hidden sm:inline">مقيّد</span>
                    </div>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2 pointer-events-auto select-auto">
                    <p className="text-xs text-gray-500 flex items-center gap-1 sm:flex-1">
                      <Lock size={12} />
                      سجّل الدخول للتمكن من تحميل هذا الملف
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Link
                        href={`/login?return=${encodeURIComponent(pathname)}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
                      >
                        <LogIn size={14} />
                        تسجيل الدخول
                      </Link>
                      <Link
                        href={`/register?return=${encodeURIComponent(pathname)}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-primary text-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
                      >
                        <UserPlus size={14} />
                        إنشاء حساب
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning/Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm">
        <AlertCircle className="shrink-0 w-5 h-5" />
        <p>
          جميع الحقوق محفوظة للموقع. يرجى ذكر المصدر عند النقل. المحتوى التعليمي متاح للاستخدام الشخصي والتعليمي فقط.
        </p>
      </div>

    </div>
  );
}
