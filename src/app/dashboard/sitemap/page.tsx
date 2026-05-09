'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Clock,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CustomSelect } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, COUNTRIES, API_CONFIG } from '@/lib/api/config';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

interface SitemapInfo {
  exists: boolean;
  last_modified: string | null;
  url: string | null;
}

interface SitemapStatus {
  database: string;
  sitemaps: {
    articles: SitemapInfo;
    post: SitemapInfo;
    static: SitemapInfo;
  };
}

const sitemapTypes = [
  {
    key: 'articles',
    title: 'خريطة المقالات',
    description: 'جميع المقالات المنشورة على الموقع',
    icon: FileText,
    color: 'primary',
  },
  {
    key: 'post',
    title: 'خريطة المنشورات',
    description: 'جميع المنشورات والأخبار',
    icon: FileText,
    color: 'secondary',
  },
  {
    key: 'static',
    title: 'خريطة الصفحات الثابتة',
    description: 'الصفوف الدراسية والتصنيفات',
    icon: Globe,
    color: 'accent',
  },
];

export default function SitemapPage() {
  const { isAuthorized } = usePermissionGuard('manage sitemap');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('jo');
  const [status, setStatus] = useState<SitemapStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingType, setDeletingType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; database: string } | null>(null);
  const frontendBaseUrl = process.env.NEXT_PUBLIC_URL || API_CONFIG.BASE_URL.replace('/api', '');

  // Define loadStatus before useEffect
  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<SitemapStatus>(API_ENDPOINTS.SITEMAP.STATUS, {
        database: selectedDatabase,
      });
      setStatus((response.data as any).data || response.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في تحميل حالة السايت ماب' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatabase]);

  const handleGenerateAll = async () => {
    try {
      setIsGenerating(true);
      setMessage(null);

      // استخدام fetch مباشرة مع timeout أطول لعملية توليد الخريطة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 دقائق

      const token = apiClient.getToken();
      const frontendKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SITEMAP.GENERATE_ALL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(frontendKey ? { 'X-Frontend-Key': frontendKey } : {}),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ database: selectedDatabase }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'فشل في توليد خرائط الموقع');
      }

      setMessage({ type: 'success', text: 'تم توليد جميع خرائط الموقع بنجاح' });
      loadStatus();
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError'
        ? 'انتهت مهلة العملية - جاري المحاولة في الخلفية، يرجى الانتظار'
        : (error.message || 'فشل في توليد خرائط الموقع');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (type: string, database: string) => {
    try {
      setDeletingType(type);
      setMessage(null);
      await apiClient.delete(API_ENDPOINTS.SITEMAP.DELETE(type, database));
      setMessage({ type: 'success', text: 'تم حذف خريطة الموقع بنجاح' });
      loadStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل في حذف خريطة الموقع' });
    } finally {
      setDeletingType(null);
      setConfirmDelete(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const databaseOptions = COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name,
    icon: <Globe className="w-4 h-4" />,
  }));

  // Load sitemap status
  useEffect(() => {
    if (!isAuthorized) return;
    loadStatus();
  }, [loadStatus, selectedDatabase, isAuthorized]);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Map className="w-7 h-7 text-primary" />
            خرائط الموقع
          </h1>
          <p className="text-muted-foreground">إدارة وتوليد خرائط الموقع (Sitemap) لمحركات البحث</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <CustomSelect
              options={databaseOptions}
              value={selectedDatabase}
              onChange={(value) => setSelectedDatabase(value as string)}
              placeholder="اختر قاعدة البيانات"
            />
          </div>
          <Button
            onClick={handleGenerateAll}
            isLoading={isGenerating}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            توليد الكل
          </Button>
        </div>
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="text-muted-foreground">جاري تحميل حالة الخرائط...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Sitemap Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {sitemapTypes.map((sitemap) => {
              const info = status?.sitemaps?.[sitemap.key as keyof typeof status.sitemaps];
              const Icon = sitemap.icon;
              const colorClasses = {
                primary: 'bg-primary/10 text-primary',
                secondary: 'bg-secondary/10 text-secondary',
                accent: 'bg-accent/10 text-accent',
              };

              return (
                <motion.div
                  key={sitemap.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            colorClasses[sitemap.color as keyof typeof colorClasses]
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        {info?.exists ? (
                          <Badge variant="success" dot>
                            متاح
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot>
                            غير موجود
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4">{sitemap.title}</CardTitle>
                      <CardDescription>{sitemap.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Last Modified */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">آخر تحديث:</span>
                        <span className="font-medium">
                          {info?.last_modified ? formatDate(info.last_modified) : 'لم يتم التوليد بعد'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {info?.exists && info?.url && (
                          <a
                            href={info.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              leftIcon={<ExternalLink className="w-4 h-4" />}
                            >
                              عرض
                            </Button>
                          </a>
                        )}
                        {info?.exists && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setConfirmDelete({ type: sitemap.key, database: selectedDatabase })
                            }
                            isLoading={deletingType === sitemap.key}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Index Sitemap Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>خريطة الموقع الرئيسية (Index)</CardTitle>
                  <CardDescription>
                    ملف الفهرس الذي يجمع جميع خرائط الموقع - يتم توليده تلقائياً
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <code className="text-sm font-mono text-foreground">
                      sitemap_index_{selectedDatabase}.xml
                    </code>
                  </div>
                  <a
                    href={`${frontendBaseUrl}/storage/sitemaps/sitemap_index_${selectedDatabase}.xml`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                      فتح
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card variant="outlined">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">ملاحظات هامة</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>يتم توليد خرائط الموقع بشكل منفصل لكل قاعدة بيانات (الأردن، السعودية، مصر، فلسطين)</li>
                    <li>يُنصح بتوليد الخرائط بعد إضافة محتوى جديد أو إجراء تغييرات كبيرة</li>
                    <li>أضف رابط خريطة الموقع الرئيسية في Google Search Console لتحسين الفهرسة</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.type, confirmDelete.database)}
        title="حذف خريطة الموقع"
        message="هل أنت متأكد من حذف هذه الخريطة؟ يمكنك إعادة توليدها لاحقاً."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={!!deletingType}
      />
    </div>
  );
}
