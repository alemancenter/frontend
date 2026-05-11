'use client';

import { CheckCircle2, FileDiff, Loader2, XCircle } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ContentAIDecision, ContentAIFixPreview } from '@/lib/api/services/content-audit';

function trimText(value?: string, max = 1200) {
  if (!value) return '-';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function statusBadge(status: string) {
  if (status === 'applied') return { variant: 'success' as const, label: 'مُطبَّق' };
  if (status === 'rejected') return { variant: 'error' as const, label: 'مرفوض' };
  if (status === 'pending') return { variant: 'warning' as const, label: 'جارٍ التوليد…' };
  if (status === 'failed') return { variant: 'error' as const, label: 'فشل التوليد' };
  return { variant: 'warning' as const, label: 'معاينة' };
}

interface Props {
  decision?: ContentAIDecision | null;
  preview?: ContentAIFixPreview | null;
  isCreating?: boolean;
  isApplying?: boolean;
  isRejecting?: boolean;
  actionError?: string | null;
  onCreate: () => void;
  onApply: () => void;
  onReject: () => void;
}

export default function AIFixPreview({ decision, preview, isCreating, isApplying, isRejecting, actionError, onCreate, onApply, onReject }: Props) {
  const isPending = preview?.status === 'pending';
  const isApplied = preview?.status === 'applied';
  const isRejectedStatus = preview?.status === 'rejected';
  const badge = preview ? statusBadge(preview.status) : null;

  return (
    <>
      {/* Generating overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-2xl bg-card border border-border shadow-2xl px-10 py-8 text-center max-w-sm w-full mx-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">جارٍ توليد التصحيح بالذكاء الاصطناعي</p>
              <p className="text-sm text-muted-foreground">يعمل النظام على إنشاء نسخة محسّنة، قد يستغرق هذا بضع دقائق…</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileDiff className="h-5 w-5 text-primary" />
              معاينة تصحيح AI
            </CardTitle>
            {badge && (
              <div className="flex flex-wrap gap-2">
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              لا توجد معاينة تصحيح بعد. يتم إنشاء التصحيح كنسخة منفصلة ولا يُطبق على المقال إلا بعد الموافقة.
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">يعمل الذكاء الاصطناعي على توليد النسخة المحسّنة…</p>
              <p className="text-xs text-muted-foreground">قد يستغرق هذا بضع دقائق. ستظهر النتيجة تلقائيًا عند الاكتمال.</p>
            </div>
          ) : (
            <>
              {preview.fix_summary && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{preview.fix_summary}</p>
              )}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold">قبل التصحيح</h4>
                    <Badge variant="outline">الأصل</Badge>
                  </div>
                  <h5 className="text-sm font-bold">{preview.original_title || '-'}</h5>
                  <div className="max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                    {trimText(preview.original_content)}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold">بعد التصحيح</h4>
                    <Badge variant="info">AI</Badge>
                  </div>
                  <h5 className="text-sm font-bold">{preview.fixed_title || '-'}</h5>
                  <div className="max-h-80 overflow-auto rounded-lg bg-card p-3 text-sm leading-7 whitespace-pre-wrap">
                    {trimText(preview.fixed_content)}
                  </div>
                </div>
              </div>

              {actionError && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-700">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
              {isApplied && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>تم اعتماد وتطبيق التصحيح على المحتوى بنجاح.</span>
                </div>
              )}
              {isRejectedStatus && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/80 p-4 text-sm font-medium text-muted-foreground">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>تم رفض هذا التصحيح وحفظ القرار في سجل الموافقات.</span>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={preview.status !== 'previewed'}
                  isLoading={isRejecting}
                  onClick={onReject}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  رفض التصحيح
                </Button>
                <Button
                  type="button"
                  variant="success"
                  disabled={preview.status !== 'previewed'}
                  isLoading={isApplying}
                  onClick={onApply}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  اعتماد وتطبيق التصحيح
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
