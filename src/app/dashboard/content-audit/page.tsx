'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Filter,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import AccessDenied from '@/components/common/AccessDenied';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import {
  contentAuditService,
  type ContentAIDecision,
  type ContentAIFixPreview,
  type PaginationMeta,
  type PolicyAuditFinding,
  type PolicyAuditRun,
} from '@/lib/api/services/content-audit';
import AIDecisionCard from '@/components/dashboard/content-audit/AIDecisionCard';
import AIIssuesList from '@/components/dashboard/content-audit/AIIssuesList';
import AIFixPreview from '@/components/dashboard/content-audit/AIFixPreview';
import { cn } from '@/lib/utils';

const riskLabels: Record<string, string> = {
  sexual_content: 'محتوى جنسي',
  violence: 'عنف',
  hate: 'كراهية',
  gambling: 'مقامرة',
  drugs_or_medicine: 'أدوية أو مخدرات',
  unsafe_markup: 'كود غير آمن',
  dangerous_external_link: 'رابط خارجي خطر',
  macro_file: 'ملف Macro',
  thin_content: 'محتوى قصير',
  empty_file: 'ملف فارغ',
  empty_category: 'تصنيف فارغ',
};

const typeLabels: Record<string, string> = {
  article: 'مقال',
  post: 'منشور',
  comment: 'تعليق',
  file: 'ملف',
  category: 'تصنيف',
};

const riskOptions = [
  { value: '', label: 'كل المخاطر' },
  { value: 'sexual_content', label: 'محتوى جنسي' },
  { value: 'violence', label: 'عنف' },
  { value: 'hate', label: 'كراهية' },
  { value: 'gambling', label: 'مقامرة' },
  { value: 'drugs_or_medicine', label: 'أدوية أو مخدرات' },
  { value: 'unsafe_markup', label: 'كود غير آمن' },
  { value: 'dangerous_external_link', label: 'رابط خارجي خطر' },
  { value: 'macro_file', label: 'ملف Macro' },
  { value: 'thin_content', label: 'محتوى قصير' },
];

const typeOptions = [
  { value: '', label: 'كل الأنواع' },
  { value: 'article', label: 'المقالات' },
  { value: 'post', label: 'المنشورات' },
  { value: 'comment', label: 'التعليقات' },
  { value: 'file', label: 'الملفات' },
  { value: 'category', label: 'التصنيفات' },
];

function statusBadge(status: PolicyAuditRun['status']) {
  switch (status) {
    case 'completed':
      return { label: 'مكتمل', variant: 'success' as const, icon: CheckCircle2 };
    case 'failed':
      return { label: 'فشل', variant: 'error' as const, icon: XCircle };
    default:
      return { label: 'قيد التشغيل', variant: 'warning' as const, icon: Loader2 };
  }
}

function riskVariant(risk: string) {
  if (['unsafe_markup', 'dangerous_external_link', 'sexual_content', 'hate'].includes(risk)) {
    return 'error' as const;
  }
  if (['violence', 'gambling', 'drugs_or_medicine', 'macro_file'].includes(risk)) {
    return 'warning' as const;
  }
  return 'info' as const;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ar', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function PaginationControls({
  meta,
  page,
  onPageChange,
}: {
  meta?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm">
      <span className="text-muted-foreground">
        {meta.from}-{meta.to} من {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          السابق
        </Button>
        <span className="min-w-16 text-center font-medium">
          {page} / {meta.last_page}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= meta.last_page}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
        </Button>
      </div>

    </div>
  );
}


export default function ContentAuditPage() {
  const { isAuthorized } = usePermissionGuard('manage content audit');
  const [runs, setRuns] = useState<PolicyAuditRun[]>([]);
  const [runsMeta, setRunsMeta] = useState<PaginationMeta | undefined>();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [findings, setFindings] = useState<PolicyAuditFinding[]>([]);
  const [findingsMeta, setFindingsMeta] = useState<PaginationMeta | undefined>();
  const [runPage, setRunPage] = useState(1);
  const [findingPage, setFindingPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isLoadingFindings, setIsLoadingFindings] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<PolicyAuditFinding | null>(null);
  const [aiDecision, setAiDecision] = useState<ContentAIDecision | null>(null);
  const [fixPreview, setFixPreview] = useState<ContentAIFixPreview | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isCreatingFix, setIsCreatingFix] = useState(false);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [isRejectingFix, setIsRejectingFix] = useState(false);
  const [fixActionError, setFixActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const requestSeq = useRef(0);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );
  const hasRunningRun = runs.some((run) => run.status === 'running');

  const currentRiskCounts = useMemo(() => {
    return findings.reduce<Record<string, number>>((acc, finding) => {
      acc[finding.risk] = (acc[finding.risk] || 0) + 1;
      return acc;
    }, {});
  }, [findings]);

  const canUseAIOnFinding = !!selectedFinding && ['article', 'post'].includes(selectedFinding.type);

  const loadRuns = useCallback(async () => {
    if (!isAuthorized) return;
    const seq = ++requestSeq.current;
    try {
      setIsLoadingRuns(true);
      const result = await contentAuditService.listRuns({ page: runPage, per_page: 10 });
      if (seq !== requestSeq.current) return;
      setRuns(result.data);
      setRunsMeta(result.meta);
      setSelectedRunId((current) => current ?? result.data[0]?.id ?? null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تحميل سجلات الفحص' });
    } finally {
      if (seq === requestSeq.current) setIsLoadingRuns(false);
    }
  }, [isAuthorized, runPage]);

  const loadFindings = useCallback(async () => {
    if (!isAuthorized || !selectedRun?.id) {
      setFindings([]);
      setFindingsMeta(undefined);
      return;
    }
    try {
      setIsLoadingFindings(true);
      const result = await contentAuditService.listFindings(selectedRun.id, {
        page: findingPage,
        per_page: 20,
        risk: riskFilter || undefined,
        type: typeFilter || undefined,
        q: search || undefined,
      });
      setFindings(result.data);
      setFindingsMeta(result.meta);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تحميل نتائج الفحص' });
    } finally {
      setIsLoadingFindings(false);
    }
  }, [findingPage, isAuthorized, riskFilter, search, selectedRun?.id, typeFilter]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    void loadFindings();
  }, [loadFindings]);

  useEffect(() => {
    if (selectedFinding && !findings.some((finding) => finding.finding_id === selectedFinding.finding_id)) {
      setSelectedFinding(null);
      setAiDecision(null);
      setFixPreview(null);
    }
  }, [findings, selectedFinding]);

  useEffect(() => {
    if (!hasRunningRun) return;
    const timer = window.setInterval(() => {
      void loadRuns();
      void loadFindings();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasRunningRun, loadFindings, loadRuns]);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      setMessage(null);
      const run = await contentAuditService.startRun();
      setSelectedRunId(run.id);
      setFindingPage(1);
      setMessage({ type: 'success', text: 'بدأ فحص المحتوى في الخلفية' });
      await loadRuns();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل بدء فحص المحتوى' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedRun?.id) return;
    try {
      setIsExporting(true);
      await contentAuditService.downloadCsv(selectedRun.id);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تصدير تقرير الفحص' });
    } finally {
      setIsExporting(false);
    }
  };


  const handleSelectFinding = async (finding: PolicyAuditFinding) => {
    setSelectedFinding(finding);
    setAiDecision(null);
    setFixPreview(null);
    setFixActionError(null);

    if (!['article', 'post'].includes(finding.type)) {
      setMessage({ type: 'error', text: 'تحليل AI الحالي يدعم المقالات والمنشورات فقط لأن التصحيح يحتاج محتوى قابلًا للتعديل.' });
      return;
    }

    try {
      const latest = await contentAuditService.getLatestDecision(finding.type, finding.id);
      setAiDecision(latest);
    } catch {
      setAiDecision(null);
    }
  };

  const handleAnalyzeAI = async () => {
    if (!selectedFinding) return;
    if (!canUseAIOnFinding) {
      setMessage({ type: 'error', text: 'تحليل AI الحالي مخصص للمقالات والمنشورات فقط.' });
      return;
    }

    try {
      setIsAnalyzingAI(true);
      setMessage(null);
      const decision = await contentAuditService.analyzeWithAI({
        run_id: selectedFinding.run_id,
        finding_id: selectedFinding.finding_id,
        content_type: selectedFinding.type,
        content_id: selectedFinding.id,
        title: selectedFinding.title,
        url: selectedFinding.url,
      });
      setAiDecision(decision);
      setFixPreview(null);
      setMessage({ type: 'success', text: 'تم إنشاء قرار الذكاء الاصطناعي وحفظه بنجاح' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تحليل العنصر بالذكاء الاصطناعي' });
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleCreateFixPreview = async () => {
    if (!aiDecision?.id || isCreatingFix) return;
    try {
      setIsCreatingFix(true);
      setMessage({ type: 'success', text: 'جارٍ توليد التصحيح بواسطة AI — سيظهر المحتوى تلقائيًا عند الاكتمال.' });
      const preview = await contentAuditService.createAndWaitForFixPreview(aiDecision.id);
      setFixPreview(preview);
      setMessage({
        type: preview.status === 'failed' ? 'error' : 'success',
        text: preview.status === 'failed' ? 'فشل توليد معاينة التصحيح. راجع سجل الخادم.' : 'تم إنشاء معاينة التصحيح. راجع الفرق قبل الاعتماد.',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل إنشاء معاينة التصحيح' });
    } finally {
      setIsCreatingFix(false);
    }
  };

  const handleApplyFix = async () => {
    if (!fixPreview?.id) return;
    try {
      setIsApplyingFix(true);
      setFixActionError(null);
      const updated = await contentAuditService.applyFix(fixPreview.id, 'تم اعتماد التصحيح من صفحة فحص المحتوى');
      setFixPreview(updated);
    } catch (error: any) {
      setFixActionError(error.message || 'فشل تطبيق التصحيح');
    } finally {
      setIsApplyingFix(false);
    }
  };

  const handleRejectFix = async () => {
    if (!fixPreview?.id) return;
    try {
      setIsRejectingFix(true);
      setFixActionError(null);
      const updated = await contentAuditService.rejectFix(fixPreview.id, 'تم رفض التصحيح من صفحة فحص المحتوى');
      setFixPreview(updated);
    } catch (error: any) {
      setFixActionError(error.message || 'فشل رفض التصحيح');
    } finally {
      setIsRejectingFix(false);
    }
  };

  const resetFilters = () => {
    setRiskFilter('');
    setTypeFilter('');
    setSearch('');
    setFindingPage(1);
  };

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            فحص المحتوى والسياسات
          </h1>
          <p className="text-sm text-muted-foreground">
            مراجعة المحتوى قبل AdSense وحفظ تقارير قابلة للتصدير
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={loadRuns}
            isLoading={isLoadingRuns}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            تحديث
          </Button>
          <Button
            onClick={handleStart}
            disabled={hasRunningRun}
            isLoading={isStarting}
            leftIcon={<PlayCircle className="h-4 w-4" />}
          >
            تشغيل فحص الآن
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!selectedRun || selectedRun.status === 'running'}
            isLoading={isExporting}
            leftIcon={<Download className="h-4 w-4" />}
          >
            تصدير CSV
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-4 text-sm',
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span>{message.text}</span>
          <button className="mr-auto" type="button" onClick={() => setMessage(null)}>
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">آخر حالة</p>
            {selectedRun ? (
              <Badge variant={statusBadge(selectedRun.status).variant} dot animated={selectedRun.status === 'running'}>
                {statusBadge(selectedRun.status).label}
              </Badge>
            ) : (
              <span className="text-2xl font-bold">-</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">المخالفات</p>
            <p className="text-3xl font-bold">{selectedRun?.findings_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">آخر تشغيل</p>
            <p className="text-sm font-medium">{formatDate(selectedRun?.started_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">الفحص الدوري</p>
            <p className="text-sm font-medium">حسب إعدادات الخادم</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>سجلات الفحص</CardTitle>
            <CardDescription>آخر عمليات الفحص اليدوية والدورية</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRuns ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : runs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                لا توجد سجلات فحص بعد
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => {
                  const status = statusBadge(run.status);
                  const StatusIcon = status.icon;
                  return (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => {
                        setSelectedRunId(run.id);
                        setFindingPage(1);
                        setSelectedFinding(null);
                        setAiDecision(null);
                        setFixPreview(null);
                      }}
                      className={cn(
                        'w-full rounded-xl border p-4 text-right transition-colors',
                        selectedRun?.id === run.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">#{run.id}</div>
                        <Badge variant={status.variant} dot>
                          <StatusIcon className={cn('h-3.5 w-3.5', run.status === 'running' && 'animate-spin')} />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>{run.triggered_by === 'scheduled' ? 'دوري' : 'يدوي'}</span>
                        <span>{run.findings_count} نتيجة</span>
                        <span className="col-span-2">{formatDate(run.started_at)}</span>
                      </div>
                    </button>
                  );
                })}
                <PaginationControls meta={runsMeta} page={runPage} onPageChange={setRunPage} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>نتائج الفحص</CardTitle>
                <CardDescription>
                  {selectedRun ? `تقرير #${selectedRun.id} - ${formatDate(selectedRun.started_at)}` : 'اختر تقريرًا لعرض النتائج'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentRiskCounts).slice(0, 4).map(([risk, count]) => (
                  <Badge key={risk} variant={riskVariant(risk)}>
                    {riskLabels[risk] || risk}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setFindingPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
                placeholder="بحث في العنوان أو السبب أو الرابط"
              />
              <select
                value={riskFilter}
                onChange={(event) => {
                  setRiskFilter(event.target.value);
                  setFindingPage(1);
                }}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
              >
                {riskOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setFindingPage(1);
                }}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
              >
                {typeOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                مسح
              </Button>
            </div>

            {selectedRun?.status === 'failed' && selectedRun.error_message && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <span>{selectedRun.error_message}</span>
              </div>
            )}

            {isLoadingFindings ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : findings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium">النوع</th>
                        <th className="px-4 py-3 text-right font-medium">المعرف</th>
                        <th className="px-4 py-3 text-right font-medium">العنوان</th>
                        <th className="px-4 py-3 text-right font-medium">الخطر</th>
                        <th className="px-4 py-3 text-right font-medium">السبب</th>
                        <th className="px-4 py-3 text-right font-medium">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findings.map((finding) => (
                        <tr
                          key={finding.finding_id}
                          className={cn(
                            'cursor-pointer border-t border-border transition-colors hover:bg-muted/40',
                            selectedFinding?.finding_id === finding.finding_id && 'bg-primary/5'
                          )}
                          onClick={() => void handleSelectFinding(finding)}
                        >
                          <td className="px-4 py-3">{typeLabels[finding.type] || finding.type}</td>
                          <td className="px-4 py-3 font-mono text-xs">{finding.id}</td>
                          <td className="max-w-64 truncate px-4 py-3" title={finding.title}>
                            {finding.title || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={riskVariant(finding.risk)}>
                              {riskLabels[finding.risk] || finding.risk}
                            </Badge>
                          </td>
                          <td className="max-w-80 px-4 py-3 text-muted-foreground">{finding.reason}</td>
                          <td className="max-w-80 px-4 py-3 text-muted-foreground">{finding.recommended_action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <PaginationControls meta={findingsMeta} page={findingPage} onPageChange={setFindingPage} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AIDecisionCard
          selectedFinding={selectedFinding}
          decision={aiDecision}
          isAnalyzing={isAnalyzingAI}
          onAnalyze={handleAnalyzeAI}
        />
        <AIIssuesList decision={aiDecision} />
      </div>

      <AIFixPreview
        decision={aiDecision}
        preview={fixPreview}
        isCreating={isCreatingFix}
        isApplying={isApplyingFix}
        isRejecting={isRejectingFix}
        actionError={fixActionError}
        onCreate={handleCreateFixPreview}
        onApply={handleApplyFix}
        onReject={handleRejectFix}
      />
    </div>
  );
}

